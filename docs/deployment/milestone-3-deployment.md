# Milestone 3 Deployment

1. Pull branch `milestone-3-data-discovery`.
2. Install dependencies with `npm ci`.
3. Apply Supabase SQL migrations in order: 0001, 0002, 0003.
4. Keep the existing `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` variables.
5. Run `npm run typecheck && npm run lint && npm test && npm run build`.
6. Deploy the branch to a Vercel preview environment before merging.

The browser CSV profiler does not require a worker. The discovery job API only queues jobs; do not represent a queued job as a completed source discovery. A trusted integration worker and service-role credential management are required for actual source discovery. Never expose a Supabase service-role key to the browser or a NEXT_PUBLIC variable.
