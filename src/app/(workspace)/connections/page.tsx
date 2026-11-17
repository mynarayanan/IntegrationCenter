import { PageHeader } from "@/components/page-header";
export default function Page() {
  return <>
    <PageHeader eyebrow="WORKSPACE" title="Connections" description="Manage source-system endpoints, authentication references and connection health." />
    <section className="panel empty-state">
      <div className="empty-icon">IC</div>
      <h2>Foundation screen established</h2>
      <p>Connection management is scheduled for Milestone 3.</p>
      <span className="status-tag">Milestone 1 · shell only</span>
    </section>
  </>;
}
