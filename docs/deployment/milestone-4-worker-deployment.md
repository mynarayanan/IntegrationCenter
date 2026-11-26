# M4 Trusted Worker Deployment

## Architecture

- Vercel: web UI and control-plane APIs.
- Supabase: tenant registry, connector metadata, discovery queue and discovered-object metadata.
- Trusted worker: separately deployed Python service with outbound access to Supabase and explicitly approved source endpoints.

Do not run long-running extraction inside Vercel serverless functions.

## Required setup

1. Pull branch milestone-4-trusted-worker.
2. Install Python 3.12 or use the provided Dockerfile.
3. Apply SQL migrations 0001, 0002, 0003, then 0004.
4. For local testing, copy worker/.env.example to worker/.env. The worker loads this file automatically. For hosted deployment, set worker secrets in the deployment platform:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
5. Set operational variables:
   - WORKER_ID (unique per replica)
   - POLL_INTERVAL_SECONDS (default 5)
   - JOB_LEASE_SECONDS (default 600; valid range 60-3600)
   - MAX_JOB_ATTEMPTS (default 3)
   - CSV_ROOT (default /data/inbound)
   - CONNECTOR_ALLOWED_HOSTS (comma-separated exact hostnames)
6. Deploy the FastAPI health service and queue runner as separate processes/containers from the same image.
7. Mount approved CSV input storage read-only at CSV_ROOT.

## Docker build

From repository root:

    docker build -f worker/Dockerfile -t integration-centre-worker:0.4.0 .

API container:

    docker run --rm -p 8080:8080 --env-file worker/.env integration-centre-worker:0.4.0

Runner container:

    docker run --rm --env-file worker/.env -v /approved/csv:/data/inbound:ro integration-centre-worker:0.4.0 python -m worker.runner

For production, inject secrets using a managed secret store rather than an env file.

## CSV connection configuration

The CSV worker reads only files already mounted under CSV_ROOT. The connection config must contain:

    {"filePath":"sample.csv"}

The current web connection form does not upload a file or expose filePath configuration. For the initial integration test, place a test file in the approved worker mount and set filePath through a controlled administrative update. A managed upload/storage workflow is a separate follow-on.

## REST connection configuration

The REST worker expects protocol=rest, baseUrl, and optional relative endpoint. Add the exact hostname to CONNECTOR_ALLOWED_HOSTS. No auth token or secret_reference resolver is implemented yet; use only non-sensitive test endpoints.

## Operational endpoints

- GET /health: liveness.
- GET /ready: checks required configuration is present.

The readiness endpoint does not currently perform a live Supabase query. Add a DB readiness probe before production deployment.

## Production checklist

- Restrict outbound egress at network level.
- Keep worker service-role credential in a secret manager and rotate it.
- Use read-only CSV mounts.
- Configure TLS, log aggregation, metrics, alerts and retention.
- Add periodic heartbeat renewal before processing long-running jobs.
- Validate lease expiry, worker crash recovery, duplicate delivery and retry behaviour.
- Do not enable customer production sources until secret resolution and connector-specific security review are complete.
