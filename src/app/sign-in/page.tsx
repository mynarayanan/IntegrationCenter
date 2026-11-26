"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import {
  createSupabaseBrowserClient,
  isSupabaseBrowserConfigured
} from "@/lib/supabase/client";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (signInError) throw signInError;
      router.replace("/overview");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign-in failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return <main className="signin-page">
    <section className="signin-card">
      <div className="brand-mark">IC</div>
      <PageHeader eyebrow="SECURE WORKSPACE" title="Sign in" description="Authentication is configured through your Supabase project." />
      {isSupabaseBrowserConfigured() ? (
        <form className="form-stack" onSubmit={signIn}>
          <label>Email<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          {error && <p className="discovery-error" role="alert">{error}</p>}
          <button className="primary-link" type="submit" disabled={submitting}>{submitting ? "Signing in..." : "Sign in"}</button>
        </form>
      ) : (
        <>
          <p className="muted">Supabase credentials are not configured. Local demo mode is available only outside production.</p>
          {process.env.NODE_ENV !== "production" && <Link href="/overview" className="primary-link">Continue to demo workspace</Link>}
        </>
      )}
    </section>
  </main>;
}
