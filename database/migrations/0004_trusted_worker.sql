-- Milestone 4: trusted worker lifecycle, leases, retries and atomic job claiming.
-- Apply after migrations 0001, 0002 and 0003.

alter table public.discovery_jobs
  add column if not exists attempt_count integer not null default 0 check (attempt_count >= 0),
  add column if not exists max_attempts integer not null default 3 check (max_attempts between 1 and 10),
  add column if not exists available_at timestamptz not null default now(),
  add column if not exists locked_at timestamptz,
  add column if not exists locked_by text,
  add column if not exists heartbeat_at timestamptz;

create index if not exists idx_discovery_jobs_worker_queue
  on public.discovery_jobs(status, available_at, created_at)
  where status in ('queued','running');

create or replace function public.claim_next_discovery_job(p_worker_id text)
returns setof public.discovery_jobs
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed_id uuid;
begin
  if p_worker_id is null or length(trim(p_worker_id)) < 3 or length(p_worker_id) > 120 then
    raise exception 'Invalid worker identifier';
  end if;

  -- Expired jobs at their retry limit are terminally failed.
  update public.discovery_jobs
  set status = 'failed',
      error_message = coalesce(error_message, 'Worker lease expired and retry limit was reached.'),
      completed_at = now(),
      locked_at = null,
      locked_by = null,
      heartbeat_at = null
  where status = 'running'
    and locked_at < now() - interval '10 minutes'
    and attempt_count >= max_attempts;

  select j.id into claimed_id
  from public.discovery_jobs j
  where j.attempt_count < j.max_attempts
    and (
      (j.status = 'queued' and j.available_at <= now())
      or
      (j.status = 'running' and j.locked_at < now() - interval '10 minutes')
    )
  order by j.available_at asc, j.created_at asc
  for update skip locked
  limit 1;

  if claimed_id is null then
    return;
  end if;

  return query
  update public.discovery_jobs j
  set status = 'running',
      attempt_count = j.attempt_count + 1,
      locked_at = now(),
      locked_by = p_worker_id,
      heartbeat_at = now(),
      started_at = coalesce(j.started_at, now()),
      completed_at = null,
      error_message = null
  where j.id = claimed_id
  returning j.*;
end;
$$;

revoke all on function public.claim_next_discovery_job(text) from public, anon, authenticated;
grant execute on function public.claim_next_discovery_job(text) to service_role;
