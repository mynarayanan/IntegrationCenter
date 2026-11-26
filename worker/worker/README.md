# Integration Centre Trusted Worker (M4 foundation)

This is a separately deployable Python service. Vercel remains the control plane; the worker polls Supabase and uses a server-side service-role credential. Never put the service-role key in browser code, source control, Vercel public variables, or a connection config.

## M4 scope

- FastAPI liveness and readiness endpoints.
- Supabase service-role client.
- Atomic job claiming using PostgreSQL row locking with SKIP LOCKED.
- Lease recovery, attempt counters and bounded exponential retry.
- Read-only metadata discovery for CSV files mounted beneath CSV_ROOT.
- Read-only HTTPS JSON REST endpoints with an explicit hostname allowlist.
- Tenant-scoped discovered-object upsert and audit events.

SFTP, authenticated REST, Snowflake, Oracle Cloud EPM, Anaplan, Board and TM1 are not enabled in this foundation release. The profile job type is also not executed yet.

## Configure

Copy worker/.env.example to worker/.env and set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WORKER_ID, CSV_ROOT, and CONNECTOR_ALLOWED_HOSTS. The worker loads worker/.env automatically for local development. Keep the service-role key in your deployment platform secret manager. Do not commit .env.

For REST, connection config must contain baseUrl and optional relative endpoint. The hostname must be in CONNECTOR_ALLOWED_HOSTS. Requests are HTTPS-only, redirects are disabled, DNS results must be public, and the response is limited to 5 MB. This adapter does not support authentication.

For CSV, mount an approved directory at CSV_ROOT and set connection config filePath to a relative path inside that mount. The file is limited to 10 MB and 100,000 rows.

## Run locally (from repository root)

    python -m venv .venv
    . .venv/bin/activate
    pip install -r worker/requirements.txt
    uvicorn worker.api:app --app-dir worker --host 0.0.0.0 --port 8080

Run the queue consumer in a second terminal from the worker directory:

    cd worker
    python -m worker.runner

The API and runner are separate processes. GET /health is liveness; GET /ready validates required configuration only.

## Docker (build from repository root)

    docker build -f worker/Dockerfile -t integration-centre-worker:0.4.0 .

Run the API and runner as separate containers/processes in production. Mount inbound files read-only at /data/inbound for CSV. Supply secrets using the hosting platform secret manager.

## Database migration

Apply database/migrations/0004_trusted_worker.sql after 0001, 0002 and 0003. It adds attempt/lease columns and the claim_next_discovery_job RPC. The function is executable only by Supabase service_role.

## Job lifecycle

The worker claims one eligible job atomically, increments attempt_count, and marks it running. It upserts discovered objects, then marks the job completed. Failures are retried with bounded backoff until max_attempts is reached. Expired leases can be reclaimed. The database migration uses a default 10-minute lease; the worker passes its configured lease duration.

The worker only executes metadata_discovery. A queued job is not a completed discovery until its status changes to completed and discovered objects appear in the explorer/API.

## Security limitations and production hardening

- Supabase service-role key is highly privileged. Use a secret manager and restrict worker network access.
- REST hostname allowlisting must be paired with deployment-level egress controls.
- DNS is checked before the request, but a production-grade egress proxy is recommended to mitigate DNS rebinding.
- CSV mount should be read-only and contain only approved files.
- No secret_reference resolver exists yet; authenticated source connections are intentionally not attempted.
- The worker currently uses bounded synchronous jobs; add periodic heartbeats before allowing long-running extracts.
- Configure TLS termination, network policy, log retention, monitoring and alerting in the worker hosting environment.
