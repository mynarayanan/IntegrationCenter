# Milestone 2 Architecture – Connection Management

The Vercel app is the control plane. It persists source connection metadata and a secret-reference string. It must not store credential material or directly execute arbitrary customer endpoint requests.

## Future test/execution flow
UI/API -> queue job -> trusted integration worker (Vercel-hosted or customer-side runtime) -> secret provider -> connector adapter -> result/status callback.

## Secret Provider abstraction
`SecretProvider.get(reference)` is a worker-only interface. Implementations may later target Azure Key Vault, AWS Secrets Manager, GCP Secret Manager, or another enterprise vault. The UI and DB store only references. Secret access must be logged, scoped, rotated, and never returned to the browser.

## Security controls
- Supabase Auth session required.
- Tenant membership checked before API reads/writes.
- Database RLS remains mandatory; API checks supplement it.
- Owner/Admin/Designer create and update; Owner/Admin delete.
- Connector configuration keys are screened for obvious secret-like names.
- Request size bounded at 8 KB config JSON.
- Never allow a test endpoint to be supplied and fetched from Vercel API in this release (SSRF protection).
- Production tenant onboarding and authorization matrix need formal security review before rollout.
