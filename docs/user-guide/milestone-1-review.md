# User Guide – Milestone 1 Review

## What is available
- Overview dashboard.
- Connector catalogue with seven priority connectors.
- Workspace navigation for future connections, integrations, mappings, jobs, data quality, runtime and settings modules.
- Health endpoint at `/api/health`.

## Suggested functional review
1. Open Overview and review the summary cards.
2. Open Connector Catalogue.
3. Confirm connector names, priority and status.
4. Review the navigation placeholders and confirm the future module boundaries.
5. Open `/api/health` and confirm the JSON status is `ok`.

## Current connector labels
“Available” means the initial connector foundation is represented in the catalogue. It does not mean a production connector has been implemented or tested against a live source system.

## Functional decisions required before Milestone 2
- Should catalogue entries be visible to all tenant roles or restricted by role?
- Should connector lifecycle status be controlled centrally or per tenant?
- What is the preferred initial connection naming convention?
- Which source authentication patterns must be supported in the first connection wizard?
