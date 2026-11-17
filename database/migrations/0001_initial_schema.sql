-- Integration Centre foundation schema.
-- Apply in a Supabase project using the SQL editor or Supabase CLI.
create extension if not exists pgcrypto;

do $$ begin
  create type public.tenant_role as enum ('owner', 'admin', 'designer', 'operator', 'viewer');
exception when duplicate_object then null; end $$;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active' check (status in ('active','suspended')),
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_members (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.tenant_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

create table if not exists public.connector_catalog (
  id text primary key,
  name text not null,
  category text not null,
  priority text not null check (priority in ('P0','P1','P2')),
  lifecycle_status text not null check (lifecycle_status in ('available','planned','deprecated')),
  description text not null,
  integration_method text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.connector_instances (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  connector_id text not null references public.connector_catalog(id),
  name text not null,
  environment text not null default 'development',
  status text not null default 'draft' check (status in ('draft','active','disabled','error')),
  config jsonb not null default '{}'::jsonb,
  secret_reference text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  actor_user_id uuid references auth.users(id),
  event_type text not null,
  resource_type text not null,
  resource_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_tenant_members_user on public.tenant_members(user_id);
create index if not exists idx_connector_instances_tenant on public.connector_instances(tenant_id);
create index if not exists idx_audit_events_tenant_created on public.audit_events(tenant_id, created_at desc);

create or replace function public.is_tenant_member(target_tenant uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = target_tenant and tm.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_tenant_member(uuid) from public;
grant execute on function public.is_tenant_member(uuid) to authenticated;

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.tenant_members enable row level security;
alter table public.connector_catalog enable row level security;
alter table public.connector_instances enable row level security;
alter table public.audit_events enable row level security;

drop policy if exists "members can read their tenants" on public.tenants;
create policy "members can read their tenants" on public.tenants
for select to authenticated using (public.is_tenant_member(id));

drop policy if exists "users can read own profile" on public.profiles;
create policy "users can read own profile" on public.profiles
for select to authenticated using (id = (select auth.uid()));

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile" on public.profiles
for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "members can read tenant membership" on public.tenant_members;
create policy "members can read tenant membership" on public.tenant_members
for select to authenticated using (public.is_tenant_member(tenant_id));

drop policy if exists "authenticated users can read connector catalogue" on public.connector_catalog;
create policy "authenticated users can read connector catalogue" on public.connector_catalog
for select to authenticated using (true);

drop policy if exists "members can read connector instances" on public.connector_instances;
create policy "members can read connector instances" on public.connector_instances
for select to authenticated using (public.is_tenant_member(tenant_id));

drop policy if exists "members can create connector instances" on public.connector_instances;
create policy "members can create connector instances" on public.connector_instances
for insert to authenticated with check (
  public.is_tenant_member(tenant_id)
  and created_by = (select auth.uid())
);

drop policy if exists "members can update connector instances" on public.connector_instances;
create policy "members can update connector instances" on public.connector_instances
for update to authenticated using (public.is_tenant_member(tenant_id))
with check (public.is_tenant_member(tenant_id));

drop policy if exists "members can read audit events" on public.audit_events;
create policy "members can read audit events" on public.audit_events
for select to authenticated using (public.is_tenant_member(tenant_id));

-- Deliberately no client-side insert/update/delete policy on audit_events.
-- Production audit writes should be performed by a trusted server-side service.
