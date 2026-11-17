import { PageHeader } from "@/components/page-header";
export default function Page() {
  return <>
    <PageHeader eyebrow="WORKSPACE" title="Data quality" description="Apply structural, business, reconciliation and completeness controls." />
    <section className="panel empty-state">
      <div className="empty-icon">IC</div>
      <h2>Foundation screen established</h2>
      <p>Data quality workflows are scheduled for Milestone 7.</p>
      <span className="status-tag">Milestone 1 · shell only</span>
    </section>
  </>;
}
