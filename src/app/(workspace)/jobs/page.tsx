import { PageHeader } from "@/components/page-header";
export default function Page() {
  return <>
    <PageHeader eyebrow="WORKSPACE" title="Jobs & schedules" description="Monitor extraction runs, checkpoints, retries and publication status." />
    <section className="panel empty-state">
      <div className="empty-icon">IC</div>
      <h2>Foundation screen established</h2>
      <p>Job orchestration is scheduled for Milestone 6.</p>
      <span className="status-tag">Milestone 1 · shell only</span>
    </section>
  </>;
}
