# Milestone 1 – Functional Scope

## Objective
Establish the Integration Centre application foundation and a reviewable workspace shell.

## In scope
- Responsive workspace navigation.
- Overview dashboard with foundation status.
- Catalogue of seven priority connectors:
  - Excel / CSV (P0)
  - REST API / SFTP (P0)
  - Snowflake (P1)
  - Oracle Cloud EPM (P1)
  - Anaplan (P1)
  - Board (P2)
  - IBM Planning Analytics / TM1 (P2)
- Supabase browser/server client helpers.
- PostgreSQL tenant, profile, membership, connector catalogue, connector instance and audit-event schema.
- Health endpoint.
- Unit and browser test scaffolding.
- Deployment and operating documentation.

## Out of scope
- Live connector authentication or extraction.
- Customer-side runtime agent.
- Scheduling and job execution.
- Mapping/transformation engine.
- Data quality and reconciliation execution.
- Production tenant onboarding and role administration.
- Source-system write-back.

## Acceptance criteria
1. Application starts locally using documented commands.
2. Overview and connector catalogue pages render.
3. All seven connector entries appear with correct priorities and lifecycle labels.
4. `/api/health` returns `status=ok`.
5. Unit tests verify catalogue count, uniqueness and lookup behaviour.
6. Playwright smoke tests cover overview, catalogue and health endpoint.
7. Database migrations can be applied to a clean Supabase project.
8. Demo mode is not permitted in production.
