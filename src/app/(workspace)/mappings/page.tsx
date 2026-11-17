import { PageHeader } from "@/components/page-header";
export default function Page() {
  return <>
    <PageHeader eyebrow="WORKSPACE" title="Mapping studio" description="Standardise source dimensions and members into the canonical FP&A model." />
    <section className="panel empty-state">
      <div className="empty-icon">IC</div>
      <h2>Foundation screen established</h2>
      <p>Mapping workflows are scheduled for Milestone 5.</p>
      <span className="status-tag">Milestone 1 · shell only</span>
    </section>
  </>;
}
