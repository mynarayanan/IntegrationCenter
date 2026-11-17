import Link from "next/link";
import { PageHeader } from "@/components/page-header";

export default function SignInPage() {
  return <main className="signin-page">
    <section className="signin-card">
      <div className="brand-mark">IC</div>
      <PageHeader eyebrow="SECURE WORKSPACE" title="Sign in" description="Authentication is configured through your Supabase project." />
      <p className="muted">The Milestone 1 demo workspace does not require sign-in. Configure Supabase credentials and the authentication flow before enabling production access.</p>
      <Link href="/overview" className="primary-link">Continue to demo workspace</Link>
    </section>
  </main>;
}
