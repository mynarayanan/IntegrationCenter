-- Milestone 2: connection registry metadata and role-scoped access.
-- Apply after 0001_initial_schema.sql.
alter table public.connector_instances
  add column if not exists connection_type text not null default 'file_upload'
    check (connection_type in ('file_upload','rest_api','sftp','snowflake','oracle_cloud_epm','anaplan','board','ibm_tm1')),
  add column if not exists description text,
  add column if not exists last_tested_at timestamptz,
  add column if not exists last_test_status text not null default 'not_tested'
    check (last_test_status in ('not_tested','queued','passed','failed','not_configured')),
  add column if not exists last_test_message text;

-- Authorization helper: member role lookup, without recursive RLS evaluation.
create or replace function public.has_tenant_role(target_tenant uuid, allowed_roles public.tenant_role[])
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = target_tenant
      and tm.user_id = (select auth.uid())
      and tm.role = any(allowed_roles)
  );
$$;
revoke all on function public.has_tenant_role(uuid, public.tenant_role[]) from public;
grant execute on function public.has_tenant_role(uuid, public.tenant_role[]) to authenticated;

drop policy if exists "members can create connector instances" on public.connector_instances;
create policy "design roles can create connector instances" on public.connector_instances
for insert to authenticated with check (
  public.has_tenant_role(tenant_id, array['owner','admin','designer']::public.tenant_role[])
  and created_by = (select auth.uid())
);

drop policy if exists "members can update connector instances" on public.connector_instances;
create policy "design roles can update connector instances" on public.connector_instances
for update to authenticated
using (public.has_tenant_role(tenant_id, array['owner','admin','designer']::public.tenant_role[]))
with check (public.has_tenant_role(tenant_id, array['owner','admin','designer']::public.tenant_role[]));

drop policy if exists "design roles can delete connector instances" on public.connector_instances;
create policy "design roles can delete connector instances" on public.connector_instances
for delete to authenticated
using (public.has_tenant_role(tenant_id, array['owner','admin']::public.tenant_role[]));

create index if not exists idx_connector_instances_tenant_updated
  on public.connector_instances(tenant_id, updated_at desc);

-- API writes audit rows only after session + membership checks. This policy deliberately
-- remains read-only for authenticated users; the service-role worker/audit path is deferred.
