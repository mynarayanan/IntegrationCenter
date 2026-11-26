# M4 Trusted Worker Test Plan

## Automated unit tests

Run from repository root after installing worker requirements:

    cd worker
    python -m pytest -q
    ruff check worker tests

Expected unit coverage:
- CSV metadata extraction and row count.
- CSV path traversal rejection.
- Missing CSV file path rejection.
- Required Supabase environment configuration.
- Worker environment option parsing.

## Supabase integration validation

1. Apply migrations 0001, 0002, 0003, then 0004 in order.
2. Confirm the worker RPC exists and only service_role can execute it.
3. Create or reuse an active CSV connection in a test tenant.
4. Ensure a test CSV is mounted under the worker CSV_ROOT.
5. Update that connection config so filePath points to the mounted relative filename.
6. Submit a metadata_discovery job through the existing authenticated application API.
7. Start the worker runner with service-role credentials injected from a secret manager.
8. Verify the job moves queued -> running -> completed.
9. Verify a discovered_objects row exists for the tenant and connection.
10. Verify the result_summary reports objects_discovered = 1.
11. Submit a deliberately invalid filePath and verify retry scheduling, then terminal failure after max_attempts.

## Security tests

- Service-role key is not present in frontend environment variables, browser bundles, source control, or connection config.
- Worker cannot read a CSV outside CSV_ROOT.
- REST requests require HTTPS and an explicit host allowlist.
- REST redirects are disabled.
- Non-public DNS destinations are rejected.
- The database claim RPC cannot be executed by anon or authenticated roles.
- Tenant IDs in discovered-object writes are taken from the claimed job, not connector payload input.

## Not yet validated

No worker runtime, Docker build, SQL migration execution, Supabase RPC execution, or automated test suite has been run by the repository authoring process. Record actual execution results before calling M4 production-ready.
