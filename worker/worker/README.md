# Integration Centre Trusted Worker (M4 foundation)

This is a separately deployable Python worker. Vercel remains the control plane; the worker polls Supabase for jobs and uses a server-side service-role credential. Never put the service-role key in Vercel public variables, browser code, source control, or a customer-visible connection config.

## Current M4 scope

- Health and readiness endpoints.
- Supabase service-role client.
- Atomic job claiming through the M4 database RPC.
- Lease metadata and bounded retry lifecycle.
- Read-only metadata discovery for:
  - CSV files mounted beneath CSV_ROOT.
  - HTTPS JSON REST endpoints whose hostname is explicitly allowlisted.
- Tenant-scoped discovered-object upsert and audit events.

SFTP, authenticated REST secret resolution, cloud file storage, Snowflake, Oracle Cloud EPM, Anaplan, Board and TM1 are not enabled in this foundation release.

## Configure

Copy .env.example to .env and set:

- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY (secret; server-side only)
- WORKER_ID (unique per worker instance)
- CSV_ROOT and CONNECTOR_ALLOWED_HOSTS

For REST, the connection config must contain baseUrl and optional relative endpoint. The hostname must be in CONNECTOR_ALLOWED_HOSTS. Requests are HTTPS-only, redirects are disabled, and non-public DNS destinations are rejected. This initial adapter does not support authentication. Do not expose sensitive endpoints.

For CSV, mount a directory into the container at CSV_ROOT and set connection config.filePath to a relative path within that mount. Do not use arbitrary user-controlled host paths.

## Run locally

From the repository root:

    python -m venv .venv
    . .venv/bin/activate
    pip install -r worker/requirements.txt
    cp worker/.env.example worker/.env
    # Export the variables from worker/.env in your shell; do not commit the file.
    uvicorn worker.api:app --host 0.0.0.0 --port 8080
    python -m worker.runner

The API and runner are separate processes. GET /health is liveness; GET /ready checks required configuration only.

## Docker

Build from the repository root:

    docker build -f worker/Dockerfile -t integration-centre-worker:0.4.0 worker

Run the API and runner as separate containers/processes in production. Mount inbound files read-only at /data/inbound when using CSV. Supply secrets through the deployment platform's secret manager.

## Job lifecycle

The worker calls claim_next_discovery_job(worker_id). The database function atomically claims one eligible job with SKIP LOCKED and marks it running. The worker upserts discovered objects and then marks the job completed. Failed attempts are re-queued until MAX_JOB_ATTEMPTS is reached.

The first release supports metadata_discovery only. A queued job is not a completed discovery until the worker executes it and the job status changes to completed.

## Security and operational limitations

- Service-role key has broad database privileges. Use a dedicated Supabase project/role strategy and secret manager for production.
- The REST host allowlist is mandatory. Add egress firewall controls at the hosting layer as well.
- The CSV root should be mounted read-only and contain only approved files.
- No secret_reference resolver exists yet; authenticated source connections are intentionally not attempted.
- Job leases are recovered by the database claim function after expiry.
- Configure TLS termination, network policy, log retention and alerting in the worker hosting environment.
