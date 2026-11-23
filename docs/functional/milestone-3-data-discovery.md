# Milestone 3 – Data Object Discovery & Source Profiling

## Delivered in this branch
- Data Object Explorer workspace page with search and source filters.
- Clearly labelled illustrative source-object catalogue for Snowflake, Oracle Cloud EPM, Anaplan, IBM Planning Analytics and CSV.
- Browser-local CSV profiling (up to 10 MB, 100,000 rows and 250 columns).
- Tenant-scoped discovery object read API and discovery-job queue API.
- Database schema for discovery jobs, discovered objects and profile runs.
- Unit tests for CSV profiling.

## CSV profile metrics
- Row and column counts.
- Basic type inference (number, date, boolean, text, empty).
- Blank and distinct counts.
- Repeated-value counts and sample values.
- Basic duplicate-header and blank-value findings.

## Important limitations
- The catalogue entries are demo data, not discovered records.
- CSV profiling runs locally in the browser; file contents are not sent to the server.
- XLSX parsing is not included in this increment.
- Discovery-job API creates a queued database record only. A trusted worker must claim and execute jobs.
- No source-system credentials or secret values are stored by this milestone.
- Database migration must be applied after migrations 0001 and 0002.

## Acceptance checks
1. Explorer is reachable from the workspace navigation.
2. Search and source filters update the displayed demo catalogue.
3. CSV profiling reports deterministic metrics for a test file.
4. CSV parser rejects header-only files and enforces size/row/column limits.
5. Discovery object API requires authenticated tenant membership.
6. Discovery-job API requires an active connection and an allowed tenant role.
7. RLS prevents cross-tenant reads; worker writes are service-role only.
