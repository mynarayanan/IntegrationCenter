# Milestone 3 Test Plan

## Automated unit tests
- CSV type inference, blank counts, distinct counts and repeated values.
- Quoted commas and escaped quotes.
- Header-only input rejection.

Run: `npm test`

## Static checks
- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Manual UI checks
1. Open Data Object Explorer from the sidebar.
2. Search by object name, source and FP&A tag.
3. Filter by Snowflake, Oracle, Anaplan, IBM and Excel.
4. Upload a valid CSV and inspect profile metrics.
5. Try a non-CSV file and a file larger than 10 MB.

## Supabase integration checks
- Apply migrations 0001, 0002 and 0003 in order.
- Verify an unauthenticated request returns 401.
- Verify a non-member cannot read tenant discovery objects.
- Verify an operator can queue a job only for an active connection in their tenant.
- Verify no authenticated user can insert or update discovered objects/profile runs directly.
- Verify a tenant cannot access another tenant's objects or jobs.

## Execution status
Test cases are defined in this branch. They have not yet been executed against a local install or Supabase environment.
