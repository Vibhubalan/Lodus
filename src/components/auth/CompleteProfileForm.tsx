"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { completeOAuthProfile } from "@/app/auth/actions";
import { ArrowRight, Phone } from "lucide-react";

export function CompleteProfileForm({ email, name }: { email: string; name: string }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await completeOAuthProfile({ email, phone, message });
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? "Could not save profile.");
      return;
    }
    router.push("/login?applied=1");
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#0B0B0F] px-4">
      <header className="absolute left-6 top-6">
        <Link href="/" className="logo-font logo-link text-3xl font-bold tracking-widest">
          Lodus
        </Link>
      </header>

      <div className="glass-card w-full max-w-md rounded-2xl border border-white/5 p-8">
        <h1 className="text-xl font-medium text-on-surface">Complete your application</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Signed in as <span className="text-on-surface">{email}</span>
          {name ? ` (${name})` : ""}. Phone is required. Owner/Admin will review your request.
        </p>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" autoComplete="off">
          <div className="pointer-events-none absolute -left-[9999px] h-0 overflow-hidden opacity-0" aria-hidden>
            <input type="text" name="username" tabIndex={-1} readOnly />
            <input type="password" name="password" tabIndex={-1} readOnly />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Phone number *
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/40" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="off"
                className="w-full rounded-lg py-2.5 pl-10 pr-4 text-sm text-white auth-input-override"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Why join Lodus? (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              autoComplete="off"
              className="w-full rounded-lg p-3 text-sm text-white auth-input-override"
              placeholder="Tell us a bit about yourself..."
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold uppercase tracking-wider text-on-primary disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit application"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
