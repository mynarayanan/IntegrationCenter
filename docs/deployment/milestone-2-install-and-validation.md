# Milestone 2 Install & Validation

1. Apply `database/migrations/0002_connection_management.sql` after 0001 in Supabase.
2. Patch files into the Milestone 1 project root.
3. Add optional `.env.local` value `VITE_DEMO_TENANT_ID=<tenant UUID>` for pre-filling the tenant input. It is not a secret.
4. `npm install`
5. `npm run typecheck`
6. `npm run lint`
7. `npm test`
8. `npm run build`
9. `npm run dev`; visit `/connections`.
10. Test with an authenticated account that has a tenant membership. The connection screen requires a tenant UUID.

## Status
This patch was packaged and file-level checked. It has not been installed against a live Supabase project or run through the project's build/test commands. Execute validation before merging into the main branch.
