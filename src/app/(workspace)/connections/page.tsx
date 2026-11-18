"use client";

import { FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { connectorCatalog } from "@/lib/connectors/catalog";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Tenant = { id: string; name: string };
type Connection = {
  id: string;
  tenant_id: string;
  connector_id: string;
  name: string;
  status: "draft" | "active" | "disabled";
  config: Record<string, unknown>;
  secret_reference: string | null;
  updated_at: string;
  last_test_status: string;
};

const defaultConfig: Record<string, Record<string, unknown>> = {
  "excel-csv": { sourceType: "excel_or_csv", uploadMode: "manual" },
  "rest-sftp": { protocol: "rest", baseUrl: "", folder: "" },
  snowflake: { account: "", warehouse: "", database: "", schema: "" },
  "oracle-cloud-epm": { baseUrl: "", environment: "" },
  anaplan: { workspaceId: "", modelId: "" },
  board: { deploymentUrl: "", cubeName: "" },
  "ibm-tm1": { baseUrl: "", cubeName: "" }
};

export default function Page() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState("");
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectorId, setConnectorId] = useState("excel-csv");
  const [name, setName] = useState("");
  const [secretReference, setSecretReference] = useState("");
  const [config, setConfig] = useState<Record<string, unknown>>(defaultConfig["excel-csv"]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function refresh(tenant: string) {
    if (!tenant) {
      setConnections([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/connections?tenantId=${encodeURIComponent(tenant)}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not load connections.");
      setConnections(body.connections ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load connections.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    async function loadTenants() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Sign in to manage connections.");

        const { data, error: membershipError } = await supabase
          .from("tenant_members")
          .select("tenant_id, tenants(id,name)")
          .eq("user_id", user.id);
        if (membershipError) throw new Error("Could not load tenant memberships.");

        const available = (data ?? []).flatMap((row) => {
          const tenant = Array.isArray(row.tenants) ? row.tenants[0] : row.tenants;
          return tenant ? [{ id: tenant.id as string, name: tenant.name as string }] : [];
        });
        if (!active) return;
        setTenants(available);
        if (available.length) {
          setTenantId(available[0].id);
          await refresh(available[0].id);
        } else {
          setLoading(false);
        }
      } catch (caught) {
        if (!active) return;
        setError(caught instanceof Error ? caught.message : "Supabase configuration is unavailable.");
        setLoading(false);
      }
    }
    void loadTenants();
    return () => {
      active = false;
    };
  }, []);

  function selectConnector(id: string) {
    setConnectorId(id);
    setConfig(defaultConfig[id] ?? {});
  }

  async function createConnection(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          connectorId,
          name,
          config,
          secretReference: secretReference || null
        })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not create connection.");
      setName("");
      setSecretReference("");
      await refresh(tenantId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create connection.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(connection: Connection, status: "draft" | "active" | "disabled") {
    setError("");
    try {
      const response = await fetch(`/api/connections/${connection.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not change status.");
      await refresh(tenantId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not change status.");
    }
  }

  async function deleteConnection(connection: Connection) {
    if (!window.confirm(`Delete connection "${connection.name}"?`)) return;
    setError("");
    try {
      const response = await fetch(`/api/connections/${connection.id}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not delete connection.");
      await refresh(tenantId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete connection.");
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="WORKSPACE"
        title="Connections"
        description="Manage source-system endpoints, authentication references and connection health."
      />
      {!process.env.NEXT_PUBLIC_SUPABASE_URL && (
        <section className="panel" role="alert">
          <h2>Supabase setup required</h2>
          <p className="muted">Add Supabase environment variables and apply migrations 0001 and 0002 before using connection management.</p>
        </section>
      )}
      {error && <section className="panel" role="alert"><p>{error}</p></section>}

      <section className="content-grid">
        <article className="panel">
          <div className="panel-heading">
            <div><span className="eyebrow">NEW CONNECTION</span><h2>Create draft profile</h2></div>
          </div>
          <form className="form-stack" onSubmit={createConnection}>
            <label>
              Tenant
              <select value={tenantId} onChange={(event) => { setTenantId(event.target.value); void refresh(event.target.value); }} disabled={loading || tenants.length === 0}>
                {tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}
              </select>
            </label>
            <label>
              Connector
              <select value={connectorId} onChange={(event) => selectConnector(event.target.value)}>
                {connectorCatalog.map((connector) => (
                  <option key={connector.id} value={connector.id}>{connector.name}</option>
                ))}
              </select>
            </label>
            <label>
              Connection name
              <input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={80} required />
            </label>
            <label>
              Secret reference (identifier only)
              <input
                value={secretReference}
                onChange={(event) => setSecretReference(event.target.value)}
                maxLength={200}
                placeholder="vault://finance/source-01"
              />
            </label>
            <div className="info-box">
              <strong>Configuration preview</strong>
              <pre>{JSON.stringify(config, null, 2)}</pre>
            </div>
            <button className="primary-link" type="submit" disabled={saving || !tenantId || !name.trim()}>
              {saving ? "Saving…" : "Save as Draft"}
            </button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div><span className="eyebrow">CONNECTION REGISTRY</span><h2>Configured profiles</h2></div>
          </div>
          {loading ? (
            <p className="muted">Loading connections…</p>
          ) : connections.length === 0 ? (
            <p className="muted">No connection profiles have been created for this tenant.</p>
          ) : (
            <div className="registry-list">
              {connections.map((connection) => (
                <article className="registry-row" key={connection.id}>
                  <div>
                    <strong>{connection.name}</strong>
                    <small>{connection.connector_id} · Test: {connection.last_test_status || "not_tested"}</small>
                  </div>
                  <select
                    aria-label={`Status for ${connection.name}`}
                    value={connection.status}
                    onChange={(event) => void changeStatus(connection, event.target.value as "draft" | "active" | "disabled")}
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                  <button type="button" className="danger-link" onClick={() => void deleteConnection(connection)}>Delete</button>
                </article>
              ))}
            </div>
          )}
        </article>
      </section>
    </>
  );
}
