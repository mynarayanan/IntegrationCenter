"use client";

import { useMemo, useState } from "react";
import { Database, FileSpreadsheet, Search, UploadCloud, AlertTriangle, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { profileCsv, type CsvProfile } from "@/lib/discovery/profile-csv";

const demoObjects = [
  { source: "Snowflake / FINANCE_WH", name: "FACT_GL_ACTUALS", type: "TABLE", rows: "2.4M", tags: ["Actuals", "Account", "Entity"], readiness: "High", note: "General ledger actuals at entity-account-period grain." },
  { source: "Oracle Cloud EPM / FCCS", name: "FCCS_MOVEMENT_EXPORT", type: "EXPORT", rows: "84K", tags: ["Consolidation", "Movement", "Period"], readiness: "High", note: "Movement dimension and closing balance export." },
  { source: "Anaplan / Corporate Planning", name: "Revenue Forecast", type: "MODULE VIEW", rows: "18K", tags: ["Forecast", "Revenue", "Product"], readiness: "Medium", note: "Revenue forecast by product, region and month." },
  { source: "IBM Planning Analytics / Finance", name: "OPEX_PLAN", type: "CUBE VIEW", rows: "36K", tags: ["Budget", "OPEX", "Cost Centre"], readiness: "Medium", note: "Operating expense plan by cost centre and account." },
  { source: "Excel / Uploaded file", name: "Workforce_Plan.csv", type: "FILE", rows: "1,250", tags: ["Workforce", "Headcount", "Cost"], readiness: "Review", note: "Illustrative workforce planning extract." }
];

export default function DataExplorerPage() {
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("All sources");
  const [fileName, setFileName] = useState("");
  const [profile, setProfile] = useState<CsvProfile | null>(null);
  const [error, setError] = useState("");
  const filtered = useMemo(() => demoObjects.filter((item) =>
    (source === "All sources" || item.source.toLowerCase().includes(source.toLowerCase())) &&
    (item.name.toLowerCase().includes(search.toLowerCase()) || item.source.toLowerCase().includes(search.toLowerCase()) || item.tags.join(" ").toLowerCase().includes(search.toLowerCase()))
  ), [search, source]);

  async function handleFile(file?: File) {
    setError(""); setProfile(null); setFileName("");
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) { setError("For this release, upload a CSV file. XLSX profiling will be added with the workbook parser."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("File exceeds the 10 MB browser profiling limit."); return; }
    try {
      const result = profileCsv(await file.text());
      setProfile(result); setFileName(file.name);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not profile file."); }
  }

  return <>
    <PageHeader eyebrow="DISCOVERY & PROFILING" title="Data Object Explorer" description="Inspect source objects, assess FP&A relevance and profile uploaded CSV extracts." />
    <section className="discovery-notice"><AlertTriangle size={17}/><span><strong>Demo catalogue:</strong> connected-source examples below are illustrative. Live discovery jobs are queued for a trusted integration worker and are not executed by this web application.</span></section>
    <section className="panel discovery-toolbar">
      <div className="discovery-search"><Search size={16}/><input aria-label="Search objects" placeholder="Search object, source or FP&A tag" value={search} onChange={(e) => setSearch(e.target.value)}/></div>
      <select aria-label="Filter by source" value={source} onChange={(e) => setSource(e.target.value)}>
        {["All sources","Snowflake","Oracle","Anaplan","IBM","Excel"].map((s) => <option key={s}>{s}</option>)}
      </select>
    </section>
    <section className="discovery-grid">
      {filtered.map((item) => <article className="panel discovery-card" key={item.name}>
        <div className="discovery-card-top"><span className="discovery-object-icon"><Database size={18}/></span><span className={`readiness-pill readiness-${item.readiness.toLowerCase()}`}>{item.readiness} readiness</span></div>
        <div className="eyebrow">{item.source}</div><h2>{item.name}</h2><p>{item.note}</p>
        <div className="discovery-meta"><span>{item.type}</span><strong>{item.rows} rows</strong></div>
        <div className="tag-list">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      </article>)}
      {filtered.length === 0 && <div className="panel empty-state">No matching objects. Adjust the search or source filter.</div>}
    </section>
    <section className="panel csv-profiler">
      <div className="panel-heading"><div><span className="eyebrow">LOCAL FILE PROFILING</span><h2>Profile a CSV extract</h2><p className="muted">The file is processed in your browser; its contents are not uploaded to the server.</p></div><FileSpreadsheet size={25}/></div>
      <label className="upload-zone"><UploadCloud size={22}/><strong>Choose a CSV file</strong><span>Maximum 10 MB · 100,000 rows · 250 columns</span><input type="file" accept=".csv,text/csv" onChange={(e) => void handleFile(e.target.files?.[0])}/></label>
      {error && <p className="discovery-error" role="alert">{error}</p>}
      {profile && <div className="profile-results">
        <div className="profile-summary"><strong>{fileName}</strong><span>{profile.rowCount.toLocaleString()} rows · {profile.columnCount} columns</span></div>
        <div className="discovery-meta"><strong>{profile.findings.length} finding(s)</strong><span><CheckCircle2 size={14}/> Local profile complete</span></div>
        <div className="table-scroll"><table className="data-table"><thead><tr><th>Column</th><th>Type</th><th>Blank</th><th>Distinct</th><th>Repeated</th><th>Sample</th></tr></thead><tbody>
          {profile.columns.map((column) => <tr key={column.name}><td>{column.name}</td><td>{column.inferredType}</td><td>{column.nullCount}</td><td>{column.distinctCount}</td><td>{column.duplicateCount}</td><td>{column.sampleValues.join(", ")}</td></tr>)}
        </tbody></table></div>
        {profile.findings.length > 0 && <ul className="finding-list">{profile.findings.slice(0, 20).map((finding) => <li key={finding}>{finding}</li>)}</ul>}
      </div>}
    </section>
  </>;
}
