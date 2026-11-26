import logging
import os
import time
from datetime import datetime, timedelta, timezone
from typing import Any

from worker.config import Settings
from worker.connectors import ConnectorError, discover
from worker.db import get_client

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("integration-centre.worker")


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def claim_job(client: Any, worker_id: str, lease_seconds: int = 600) -> dict[str, Any] | None:
    result = client.rpc(
        "claim_next_discovery_job",
        {"p_worker_id": worker_id, "p_lease_seconds": lease_seconds},
    ).execute()
    data = result.data
    if isinstance(data, list):
        return data[0] if data else None
    return data if isinstance(data, dict) else None


def process_job(client: Any, job: dict[str, Any], settings: Settings) -> None:
    job_id = job["id"]
    try:
        if job.get("job_type") != "metadata_discovery":
            raise ConnectorError("Only metadata_discovery jobs are supported in worker 0.4.0.")
        connection_result = (
            client.table("connector_instances")
            .select("id,tenant_id,connector_id,name,config,status")
            .eq("id", job["connector_instance_id"])
            .eq("tenant_id", job["tenant_id"])
            .maybe_single()
            .execute()
        )
        connection = connection_result.data
        if not connection or connection.get("status") != "active":
            raise ConnectorError("Connection is missing or no longer active.")
        objects = discover(connection, settings)
        for item in objects:
            row = {
                "tenant_id": job["tenant_id"],
                "connector_instance_id": job["connector_instance_id"],
                **item,
                "discovery_status": "discovered",
            }
            client.table("discovered_objects").upsert(
                row, on_conflict="tenant_id,connector_instance_id,source_object_key"
            ).execute()
        client.table("discovery_jobs").update({
            "status": "completed",
            "result_summary": {"objects_discovered": len(objects), "worker_id": settings.worker_id},
            "error_message": None,
            "completed_at": _utc_now(),
            "locked_at": None,
            "locked_by": None,
            "heartbeat_at": None,
        }).eq("id", job_id).eq("status", "running").eq("locked_by", settings.worker_id).execute()
        _audit(client, job, "discovery_job.completed", {"objects_discovered": len(objects)})
        logger.info("job_completed job_id=%s objects=%s", job_id, len(objects))
    except Exception as exc:
        message = str(exc)[:1000]
        attempts = int(job.get("attempt_count") or 1)
        max_attempts = int(job.get("max_attempts") or settings.max_job_attempts)
        terminal = attempts >= max_attempts
        delay_seconds = min(300, 5 * (2 ** max(0, attempts - 1)))
        next_attempt = datetime.now(timezone.utc) + timedelta(seconds=delay_seconds)
        update = {
            "status": "failed" if terminal else "queued",
            "error_message": message,
            "available_at": _utc_now() if terminal else next_attempt.isoformat(),
            "completed_at": _utc_now() if terminal else None,
            "locked_at": None,
            "locked_by": None,
            "heartbeat_at": None,
        }
        client.table("discovery_jobs").update(update).eq("id", job_id).eq(
            "status", "running"
        ).eq("locked_by", settings.worker_id).execute()
        _audit(client, job, "discovery_job.failed" if terminal else "discovery_job.retry_scheduled", {
            "error": message, "attempt": attempts, "terminal": terminal,
            "retry_delay_seconds": 0 if terminal else delay_seconds,
        })
        logger.exception("job_failed job_id=%s attempt=%s terminal=%s", job_id, attempts, terminal)


def _audit(client: Any, job: dict[str, Any], event_type: str, details: dict[str, Any]) -> None:
    try:
        client.table("audit_events").insert({
            "tenant_id": job["tenant_id"],
            "actor_user_id": None,
            "event_type": event_type,
            "resource_type": "discovery_job",
            "resource_id": job["id"],
            "details": details,
        }).execute()
    except Exception:
        logger.exception("audit_write_failed job_id=%s", job.get("id"))


def run_forever() -> None:
    settings = Settings.from_env()
    client = get_client()
    logger.info("worker_started worker_id=%s", settings.worker_id)
    while True:
        try:
            job = claim_job(client, settings.worker_id, settings.lease_seconds)
            if job:
                process_job(client, job, settings)
            else:
                time.sleep(settings.poll_interval_seconds)
        except KeyboardInterrupt:
            logger.info("worker_stopping")
            break
        except Exception:
            logger.exception("worker_poll_failed")
            time.sleep(settings.poll_interval_seconds)


if __name__ == "__main__":
    run_forever()
