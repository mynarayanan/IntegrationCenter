# Test Plan – Milestone 1

## Automated tests

| ID | Test | Type | Expected result |
|---|---|---|---|
| IC-M1-UT-001 | Catalogue has seven connectors | Unit | Pass |
| IC-M1-UT-002 | Connector IDs are unique | Unit | Pass |
| IC-M1-UT-003 | P0 priorities are correct | Unit | Pass |
| IC-M1-UT-004 | Unknown connector lookup | Unit | Undefined |
| IC-M1-E2E-001 | Overview renders | Browser | Key headings visible |
| IC-M1-E2E-002 | Seven connectors render | Browser | All connector names visible |
| IC-M1-E2E-003 | Health endpoint | API/browser | HTTP success and status ok |

## Commands

```bash
npm install
npm run typecheck
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

## Test evidence status

The source package includes test definitions. These tests have **not** been executed in a Node.js project environment as part of package generation. Run the commands above after installation and record the actual results before accepting the milestone.

## Required additional tests before production

- RLS tenant-isolation tests using two separate tenant users.
- Role/permission matrix tests.
- Session expiry and sign-out tests.
- Authentication redirect and callback tests.
- SQL migration clean-install and repeatability tests.
- Dependency and secret scanning.
- Accessibility checks and responsive browser coverage.
