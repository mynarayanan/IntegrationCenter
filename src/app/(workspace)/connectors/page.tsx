import { Cable, FileSpreadsheet, Cloud, Database, Layers3, Network } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { connectorCatalog } from "@/lib/connectors/catalog";

const icons: Record<string, React.ElementType> = {
  "excel-csv": FileSpreadsheet, "rest-sftp": Network, snowflake: Database,
  "oracle-cloud-epm": Cloud, anaplan: Layers3, board: Layers3, "ibm-tm1": Database
};

export default function ConnectorsPage() {
  return <>
    <PageHeader eyebrow="CONNECTIVITY / CATALOGUE" title="Connector catalogue"
      description="Browse the initial source-system integration patterns. Connector availability here represents the product foundation, not a live validated source connection." />
    <div className="catalogue-summary"><Cable size={18} /><span><strong>7 priority connectors</strong> across file, API, warehouse and EPM categories</span></div>
    <div className="connector-grid">
      {connectorCatalog.map((connector) => {
        const Icon = icons[connector.id] || Cable;
        return <article className="connector-card" key={connector.id}>
          <div className="connector-card-top"><div className="connector-icon"><Icon size={20} /></div><span className={`status-tag ${connector.status === "Available" ? "status-available" : ""}`}>{connector.status}</span></div>
          <div className="connector-title-row"><h2>{connector.name}</h2><span className="priority">{connector.priority}</span></div>
          <p>{connector.description}</p>
          <div className="connector-method"><span>INTEGRATION METHOD</span><strong>{connector.integrationMethod}</strong></div>
          <button className="secondary-button" disabled title="Connection wizard is scheduled for a later milestone">Connection wizard · coming next</button>
        </article>;
      })}
    </div>
  </>;
}
