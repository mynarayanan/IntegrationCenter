import csv
import ipaddress
import json
import socket
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import httpx


class ConnectorError(Exception):
    pass


def _infer_type(values: list[Any]) -> str:
    present = [str(v).strip() for v in values if v not in (None, "")]
    if not present:
        return "string"
    lowered = {v.lower() for v in present}
    if lowered <= {"true", "false", "yes", "no", "0", "1"} and any(
        v in {"true", "false", "yes", "no"} for v in lowered
    ):
        return "boolean"
    try:
        parsed_ints = [int(v) for v in present]
        if all(str(value) == original or original.lstrip("+") == str(value) for value, original in zip(parsed_ints, present)):
            return "integer"
    except ValueError:
        pass
    try:
        for value in present:
            float(value.replace(",", ""))
        return "number"
    except ValueError:
        return "string"


def _schema(rows: list[dict[str, Any]]) -> list[dict[str, str]]:
    keys = list(dict.fromkeys(k for row in rows for k in row.keys()))
    return [
        {"name": key, "dataType": _infer_type([row.get(key) for row in rows])}
        for key in keys
    ]


def discover_csv(config: dict[str, Any], csv_root: str) -> list[dict[str, Any]]:
    configured = config.get("filePath")
    if not isinstance(configured, str) or not configured.strip():
        raise ConnectorError("CSV connection requires config.filePath under the worker CSV_ROOT mount.")
    root = Path(csv_root).resolve()
    candidate = (root / configured).resolve() if not Path(configured).is_absolute() else Path(configured).resolve()
    if root not in candidate.parents or candidate == root:
        raise ConnectorError("CSV path is outside the configured CSV_ROOT.")
    if not candidate.is_file():
        raise ConnectorError("Configured CSV file does not exist in the worker mount.")
    if candidate.stat().st_size > 10 * 1024 * 1024:
        raise ConnectorError("CSV file exceeds the 10 MB worker limit.")
    with candidate.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if not reader.fieldnames:
            raise ConnectorError("CSV must contain a header row.")
        rows = []
        row_count = 0
        for row in reader:
            row_count += 1
            if row_count > 100_000:
                raise ConnectorError("CSV exceeds the 100,000 row worker limit.")
            rows.append(row)
    name = candidate.name
    return [{
        "source_object_key": str(candidate.relative_to(root)),
        "object_name": name,
        "qualified_name": name,
        "object_type": "file",
        "description": "CSV file discovered by the trusted worker.",
        "schema_definition": _schema(rows[:1000]),
        "estimated_row_count": row_count,
    }]


def _validate_rest_url(url: str, allowed_hosts: tuple[str, ...]) -> None:
    parsed = urlparse(url)
    if parsed.scheme != "https" or not parsed.hostname:
        raise ConnectorError("REST connector requires an HTTPS URL.")
    if parsed.port not in (None, 443):
        raise ConnectorError("REST connector permits only the standard HTTPS port.")
    host = parsed.hostname.lower()
    if host not in allowed_hosts:
        raise ConnectorError("REST host is not in CONNECTOR_ALLOWED_HOSTS.")
    try:
        addresses = socket.getaddrinfo(host, 443, type=socket.SOCK_STREAM)
        for item in addresses:
            address = ipaddress.ip_address(item[4][0])
            if not address.is_global:
                raise ConnectorError("REST host resolves to a non-public address.")
    except socket.gaierror as exc:
        raise ConnectorError("REST host could not be resolved.") from exc


def discover_rest(config: dict[str, Any], allowed_hosts: tuple[str, ...]) -> list[dict[str, Any]]:
    base_url = config.get("baseUrl")
    if not isinstance(base_url, str) or not base_url.strip():
        raise ConnectorError("REST connection requires config.baseUrl.")
    endpoint = config.get("endpoint", "")
    if not isinstance(endpoint, str) or endpoint.startswith("//") or "://" in endpoint:
        raise ConnectorError("REST endpoint must be a relative path.")
    url = base_url.rstrip("/") + ("/" + endpoint.lstrip("/") if endpoint else "")
    _validate_rest_url(url, allowed_hosts)
    try:
        with httpx.Client(timeout=20, follow_redirects=False) as client:
            response = client.get(url, headers={"Accept": "application/json"})
            response.raise_for_status()
            if len(response.content) > 5 * 1024 * 1024:
                raise ConnectorError("REST response exceeds the 5 MB limit.")
            payload = response.json()
    except (httpx.HTTPError, json.JSONDecodeError) as exc:
        raise ConnectorError(f"REST request failed: {type(exc).__name__}") from exc
    if isinstance(payload, list) and all(isinstance(item, dict) for item in payload):
        rows = payload
    elif isinstance(payload, dict) and isinstance(payload.get("data"), list) and all(
        isinstance(item, dict) for item in payload["data"]
    ):
        rows = payload["data"]
    elif isinstance(payload, dict):
        rows = [payload]
    else:
        raise ConnectorError("REST response must be a JSON object or an array of objects.")
    object_name = endpoint.strip("/").split("/")[-1] if endpoint.strip("/") else "root"
    has_row_collection = isinstance(payload, list) or (
        isinstance(payload, dict) and isinstance(payload.get("data"), list)
    )
    return [{
        "source_object_key": endpoint or "/",
        "object_name": object_name,
        "qualified_name": url,
        "object_type": "rest_endpoint",
        "description": "JSON endpoint discovered by the trusted worker.",
        "schema_definition": _schema(rows[:1000]),
        "estimated_row_count": len(rows) if has_row_collection else None,
    }]


def discover(connection: dict[str, Any], settings: Any) -> list[dict[str, Any]]:
    connector_id = connection.get("connector_id")
    config = connection.get("config") or {}
    if connector_id == "excel-csv":
        return discover_csv(config, settings.csv_root)
    if connector_id == "rest-sftp":
        if config.get("protocol", "rest") != "rest":
            raise ConnectorError("SFTP execution is not enabled in this worker release.")
        return discover_rest(config, settings.allowed_hosts)
    raise ConnectorError(f"Connector '{connector_id}' is not supported by worker 0.4.0.")
