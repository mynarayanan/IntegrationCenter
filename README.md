# Integration Centre

A hybrid, connector-led integration control plane for an AI-powered FP&A platform.

## Milestone 1 contents
- Next.js App Router + TypeScript workspace shell.
- Responsive dashboard and connector catalogue.
- Seven priority connector definitions.
- Supabase browser/server client helpers.
- PostgreSQL tenant and connector foundation schema.
- Health endpoint.
- Vitest unit tests and Playwright smoke tests.
- Architecture, functional, test, deployment and user documentation.

## Requirements
- Node.js 20.9 or later (use an active LTS release).
- npm.
- Supabase project for database/auth integration (optional for local demo shell).

## Quick start
```bash
npm install
cp .env.example .env.local
npm run dev
```
On Windows PowerShell:
```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

## Quality commands
```bash
npm run typecheck
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

## Important
- The default local configuration is a demo shell.
- No live source connector is implemented in Milestone 1.
- Do not put source passwords, API secrets or Supabase service-role keys in client-side code or `VITE_` variables.
- Vercel hosts the control plane. Long-running data extraction belongs in a separate worker runtime.
- Review `docs/deployment/vercel-and-supabase.md` before deployment.

## Project structure
```text
integration-centre/
├── src/app/                 # Next.js routes and API
├── src/components/          # Workspace UI
├── src/lib/                 # Config, connector catalogue, Supabase clients
├── database/
│   ├── migrations/
│   └── seed/
├── tests/
│   ├── unit/
│   └── e2e/
└── docs/
    ├── architecture/
    ├── deployment/
    ├── functional/
    ├── testing/
    └── user-guide/
```
