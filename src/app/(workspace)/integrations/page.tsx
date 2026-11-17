import { PageHeader } from "@/components/page-header";
export default function Page() {
  return <>
    <PageHeader eyebrow="WORKSPACE" title="Integration designer" description="Define extraction objects, parameters, schedules and target datasets." />
    <section className="panel empty-state">
      <div className="empty-icon">IC</div>
      <h2>Foundation screen established</h2>
      <p>Integration design is scheduled for Milestone 4.</p>
      <span className="status-tag">Milestone 1 · shell only</span>
    </section>
  </>;
}
