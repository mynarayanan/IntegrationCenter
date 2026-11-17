# Integration Centre – Architecture Overview

## Milestone 1 architecture

The application is a hybrid, connector-led integration platform. Vercel hosts the Next.js control-plane UI and lightweight APIs. It is not the execution environment for long-running data extraction.

```text
Finance / EPM users
        |
        v
Next.js application (Vercel)
  - Workspace UI
  - Connector catalogue
  - Control-plane APIs
        |
        +------ Supabase Auth
        |
        +------ Supabase PostgreSQL
        |
        +------ Future job queue / orchestration
                         |
                         v
              Integration worker runtime
              - Native connector adapters
              - Validation / mapping
              - Reconciliation / lineage
                         |
                         v
          Source systems and customer networks
```

## Core design principles

1. Read-only source access in the initial release.
2. No source credentials in browser code, public environment variables or ordinary connector configuration JSON.
3. Use secret references; a managed secret vault is a later implementation item.
4. Tenant isolation must be enforced in the database and verified with security tests.
5. Extraction jobs must be idempotent, checkpointed and observable.
6. Publish data only after structural and business validation.
7. Keep source data lineage and reconciliation evidence.
8. Human approval is required before any future write-back.

## Connector contract (future worker SDK)

Every connector adapter should implement:
- `test_connection`
- `validate_access`
- `discover_objects`
- `get_schema`
- `preview_data`
- `extract_data`
- `get_watermark`
- `get_job_status`
- `cancel_job`
- `health_check`

## Canonical FP&A data model

The target fact grain is tenant + dataset + period + scenario + version + entity + account + dimensional combination + measure. Preserve source keys and source metadata alongside canonical members. Do not discard planning dimensions such as currency, movement, product, cost centre, department or intercompany partner.

## Milestone 1 boundaries

Implemented: web shell, navigation, connector catalogue, health endpoint, Supabase client helpers, initial database schema and seed script, test scaffolding.

Not implemented yet: real source connections, secret vault, worker runtime, queues, extraction, mapping engine, job monitoring, data quality and reconciliation.
