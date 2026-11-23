"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity, ArrowLeftRight, Boxes, Cable, ClipboardCheck,
  Database, LayoutDashboard, Settings, Workflow, ScanSearch
} from "lucide-react";
import { isNavigationActive } from "@/lib/navigation";

const navigation = [
  { label: "Overview", href: "/overview", icon: LayoutDashboard },
  { label: "Connector catalogue", href: "/connectors", icon: Cable },
  { label: "Connections", href: "/connections", icon: ArrowLeftRight },
  { label: "Data Object Explorer", href: "/data-explorer", icon: ScanSearch },
  { label: "Integration designer", href: "/integrations", icon: Workflow },
  { label: "Mapping studio", href: "/mappings", icon: Boxes },
  { label: "Jobs & schedules", href: "/jobs", icon: Activity },
  { label: "Data quality", href: "/data-quality", icon: ClipboardCheck },
  { label: "Runtime management", href: "/runtime", icon: Database },
  { label: "Settings", href: "/settings", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="app-frame">
      <aside className="sidebar">
        <Link href="/overview" className="brand">
          <span className="brand-mark">IC</span>
          <span><strong>Integration Centre</strong><small>FP&A data foundation</small></span>
        </Link>
        <div className="nav-caption">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isNavigationActive(pathname, item.href);
            return (
              <Link key={item.href} href={item.href} className={`nav-link ${active ? "active" : ""}`}>
                <Icon size={17} strokeWidth={1.8} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <span className="status-dot" /> Foundation release · 0.1.0
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div><span className="eyebrow">FP&A PLATFORM</span><strong>Integration workspace</strong></div>
          <div className="topbar-right"><span className="env-pill">DEMO ENVIRONMENT</span><span className="avatar">IC</span></div>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
