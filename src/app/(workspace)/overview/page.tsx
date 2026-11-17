import Link from "next/link";
import { ArrowUpRight, Cable, CheckCircle2, Clock3, Database, Workflow } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { connectorCatalog } from "@/lib/connectors/catalog";

const metrics = [
  { label: "Connector types", value: "07", note: "Priority integrations", icon: Cable },
  { label: "Active connections", value: "00", note: "No source systems linked", icon: Database },
  { label: "Integration jobs", value: "00", note: "No jobs executed yet", icon: Workflow },
  { label: "Data quality checks", value: "—", note: "Available in next workflow", icon: CheckCircle2 }
];

export default function OverviewPage() {
  const available = connectorCatalog.filter((c) => c.status === "Available").length;
  return (
    <>
      <PageHeader eyebrow="CONTROL PLANE / OVERVIEW" title="Integration overview"
        description="A governed entry point for connecting enterprise finance and operational data." />
      <section className="metric-grid" aria-label="Platform summary">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return <article className="metric-card" key={metric.label}>
            <div className="metric-top"><span>{metric.label}</span><Icon size={18} /></div>
            <div className="metric-value">{metric.value}</div>
            <div className="metric-note">{metric.note}</div>
          </article>;
        })}
      </section>
      <section className="content-grid">
        <article className="panel">
          <div className="panel-heading"><div><span className="eyebrow">GETTING STARTED</span><h2>Build your first data connection</h2></div><span className="step-count">01 / 04</span></div>
          <p className="muted">Start with a source, validate access, discover available objects and establish a governed data path.</p>
          <div className="setup-steps">
            {["Select a connector", "Configure authentication", "Test and discover source objects", "Map, validate and activate"].map((step, i) =>
              <div className="setup-step" key={step}><span className="step-number">{i + 1}</span><span>{step}</span><span className="step-state">{i === 0 ? "Ready" : "Upcoming"}</span></div>
            )}
          </div>
          <Link className="primary-link" href="/connectors">Explore connector catalogue <ArrowUpRight size={16} /></Link>
        </article>
        <article className="panel">
          <div className="panel-heading"><div><span className="eyebrow">PLATFORM STATUS</span><h2>Foundation readiness</h2></div><span className="status-tag">In setup</span></div>
          <div className="readiness-number">{available} <small>of {connectorCatalog.length} connector foundations available</small></div>
          <div className="progress-track"><div style={{ width: `${(available / connectorCatalog.length) * 100}%` }} /></div>
          <div className="status-row"><span><span className="status-dot" /> Application shell</span><strong>Ready for review</strong></div>
          <div className="status-row"><span><Clock3 size={14} /> Worker runtime</span><strong>Future milestone</strong></div>
          <div className="status-row"><span><Clock3 size={14} /> Source credentials</span><strong>Not configured</strong></div>
        </article>
      </section>
      <section className="panel connector-preview">
        <div className="panel-heading"><div><span className="eyebrow">PRIORITY CONNECTORS</span><h2>Connector catalogue</h2></div><Link href="/connectors" className="text-link">View all <ArrowUpRight size={14} /></Link></div>
        <div className="mini-connector-grid">
          {connectorCatalog.slice(0, 4).map((c) => <div className="mini-connector" key={c.id}><div><strong>{c.name}</strong><small>{c.category}</small></div><span className={`mini-status ${c.status === "Available" ? "available" : ""}`}>{c.status}</span></div>)}
        </div>
      </section>
    </>
  );
}
