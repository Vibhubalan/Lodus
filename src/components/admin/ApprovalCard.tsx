"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, AlertCircle, Mail, Phone } from "lucide-react";
import { approveMemberAction } from "@/app/admin/approvals/actions";

export type PendingApplicant = {
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
  applicationMessage: string | null;
  authProvider: string;
};

export function ApprovalCard({ applicant }: { applicant: PendingApplicant }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleApprove = () => {
    setResult(null);
    startTransition(async () => {
      const res = await approveMemberAction(applicant.id);
      setResult(res);
      if (res.ok) router.refresh();
    });
  };

  return (
    <div className="glass-card rounded-xl border border-white/5 bg-[#0d1118]/80 p-5 shadow-xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold text-on-surface">{applicant.name ?? applicant.email}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {applicant.email}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              {applicant.phone ?? "—"}
            </span>
            <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
              via {applicant.authProvider}
            </span>
          </div>
          {applicant.applicationMessage ? (
            <p className="mt-3 max-w-prose text-sm text-on-surface-variant">
              {applicant.applicationMessage}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleApprove}
          disabled={pending || result?.ok}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#248046] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-colors hover:bg-[#1a6535] disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : result?.ok ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : null}
          {result?.ok ? "Approved" : "Approve Member"}
        </button>
      </div>

      {result && !result.ok ? (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-400">
          <AlertCircle className="h-3.5 w-3.5" />
          {result.message}
        </p>
      ) : null}
      {result?.ok ? (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-xs text-green-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {result.message}
        </p>
      ) : null}
    </div>
  );
}
