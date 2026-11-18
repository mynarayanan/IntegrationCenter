# Deployment – Vercel and Supabase

## 1. Create Supabase project
1. Create a Supabase project in the required region.
2. Open Project Settings → API.
3. Copy the Project URL and publishable key.
4. Do not expose the `service_role` key in the browser or in any `VITE_` variable.

## 2. Apply database scripts
1. Open Supabase SQL Editor.
2. Run `database/migrations/0001_initial_schema.sql`.
3. Run `database/seed/0001_connector_catalog.sql`.
4. Create a test tenant and tenant membership through a trusted administrative process. Tenant self-provisioning is intentionally not included in this milestone.

## 3. Local configuration
Copy `.env.example` to `.env.local` and populate:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_DEMO_MODE=false` once authentication is configured and tested.

## 4. Run locally
```bash
npm install
npm run dev
```
Open `http://localhost:3000`.

## 5. GitHub
1. Create a new private GitHub repository named `integration-centre`.
2. Extract this package into the repository root.
3. Commit the source.
4. Push the default branch.

## 6. Vercel
1. Import the GitHub repository into Vercel.
2. Keep the project root at the repository root.
3. Add the three environment variables from `.env.local` in Vercel Project Settings → Environment Variables.
4. Apply environment variables to Preview and Production intentionally; do not enable demo mode in Production.
5. Deploy a Preview first.
6. Validate `/api/health`, overview and connector catalogue.
7. Promote to Production only after the security and acceptance checks are complete.

## Important security note
This milestone provides Supabase client helpers and an initial schema. It does not yet implement a complete production sign-in/sign-out flow, tenant onboarding, secret management or comprehensive authorization. Do not expose the workspace publicly as a production multi-tenant service until those controls are implemented and tested.
