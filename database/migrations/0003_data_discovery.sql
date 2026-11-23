-- Milestone 3: Data Object Discovery and source profiling.
-- Apply after 0001_initial_schema.sql and 0002_connection_management.sql.

create table if not exists public.discovery_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  connector_instance_id uuid not null references public.connector_instances(id) on delete cascade,
  requested_by uuid not null references auth.users(id),
  job_type text not null default 'metadata_discovery'
    check (job_type in ('metadata_discovery','profile')),
  status text not null default 'queued'
    check (status in ('queued','running','completed','failed','cancelled')),
  request jsonb not null default '{}'::jsonb,
  result_summary jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create table if not exists public.discovered_objects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  connector_instance_id uuid not null references public.connector_instances(id) on delete cascade,
  source_object_key text not null,
  object_name text not null,
  qualified_name text,
  object_type text not null,
  description text,
  schema_definition jsonb not null default '[]'::jsonb,
  estimated_row_count bigint,
  discovery_status text not null default 'discovered'
    check (discovery_status in ('discovered','profiled','ignored','error')),
  fpna_tags text[] not null default '{}',
  discovered_at timestamptz not null default now(),
  unique (tenant_id, connector_instance_id, source_object_key)
);

create table if not exists public.profile_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  discovered_object_id uuid not null references public.discovered_objects(id) on delete cascade,
  status text not null default 'completed'
    check (status in ('queued','running','completed','failed')),
  row_count bigint,
  column_count integer,
  metrics jsonb not null default '{}'::jsonb,
  findings jsonb not null default '[]'::jsonb,
  profiled_at timestamptz not null default now()
);

create index if not exists idx_discovery_jobs_tenant_created
  on public.discovery_jobs(tenant_id, created_at desc);
create index if not exists idx_discovered_objects_tenant_connection
  on public.discovered_objects(tenant_id, connector_instance_id);
create index if not exists idx_profile_runs_object_date
  on public.profile_runs(discovered_object_id, profiled_at desc);

alter table public.discovery_jobs enable row level security;
alter table public.discovered_objects enable row level security;
alter table public.profile_runs enable row level security;

drop policy if exists "tenant members read discovery jobs" on public.discovery_jobs;
create policy "tenant members read discovery jobs" on public.discovery_jobs
for select to authenticated using (public.is_tenant_member(tenant_id));
drop policy if exists "design roles create discovery jobs" on public.discovery_jobs;
create policy "design roles create discovery jobs" on public.discovery_jobs
for insert to authenticated with check (
  public.has_tenant_role(tenant_id, array['owner','admin','designer','operator']::public.tenant_role[])
  and requested_by = (select auth.uid())
);

drop policy if exists "tenant members read discovered objects" on public.discovered_objects;
create policy "tenant members read discovered objects" on public.discovered_objects
for select to authenticated using (public.is_tenant_member(tenant_id));

drop policy if exists "tenant members read profile runs" on public.profile_runs;
create policy "tenant members read profile runs" on public.profile_runs
for select to authenticated using (public.is_tenant_member(tenant_id));

-- Only trusted worker/service-role processes should write discovered objects and profile results.
-- No authenticated insert/update/delete policies are intentionally created.
