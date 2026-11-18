export const allowedConnectorIds = [
  "excel-csv",
  "rest-sftp",
  "snowflake",
  "oracle-cloud-epm",
  "anaplan",
  "board",
  "ibm-tm1"
] as const;

export type ConnectionType =
  | "file_upload"
  | "rest_api"
  | "sftp"
  | "snowflake"
  | "oracle_cloud_epm"
  | "anaplan"
  | "board"
  | "ibm_tm1";

export const connectionTypeForConnector: Record<string, ConnectionType> = {
  "excel-csv": "file_upload",
  "rest-sftp": "rest_api",
  snowflake: "snowflake",
  "oracle-cloud-epm": "oracle_cloud_epm",
  anaplan: "anaplan",
  board: "board",
  "ibm-tm1": "ibm_tm1"
};

export function validateConnectionPayload(input: unknown): {
  ok: true;
  value: Record<string, unknown>;
} | {
  ok: false;
  error: string;
} {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "Body must be a JSON object." };
  }

  const v = input as Record<string, unknown>;
  const connectorId = String(v.connectorId ?? "");
  const name = typeof v.name === "string" ? v.name.trim() : "";
  const tenantId = typeof v.tenantId === "string" ? v.tenantId : "";
  const config = v.config;
  const secretReference =
    v.secretReference == null
      ? null
      : typeof v.secretReference === "string"
        ? v.secretReference.trim()
        : "";

  if (!allowedConnectorIds.includes(connectorId as (typeof allowedConnectorIds)[number])) {
    return { ok: false, error: "Unsupported connector." };
  }
  if (name.length < 2 || name.length > 80) {
    return { ok: false, error: "Connection name must be 2–80 characters." };
  }
  if (!isUuid(tenantId)) {
    return { ok: false, error: "A valid tenantId is required." };
  }
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return { ok: false, error: "Config must be an object." };
  }

  const cfg = config as Record<string, unknown>;
  if (JSON.stringify(cfg).length > 8000) {
    return { ok: false, error: "Configuration is too large." };
  }
  if (Object.keys(cfg).some((key) => /password|secret|token|private.?key|credential/i.test(key))) {
    return { ok: false, error: "Do not include secret values in configuration. Use secret references instead." };
  }
  if (
    secretReference &&
    (secretReference.length > 200 || /[\r\n]/.test(secretReference))
  ) {
    return { ok: false, error: "Secret reference is invalid." };
  }

  return {
    ok: true,
    value: {
      tenantId,
      connectorId,
      name,
      config: cfg,
      secretReference
    }
  };
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
