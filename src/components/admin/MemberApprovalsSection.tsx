import { listPendingApplications } from "@/lib/auth/user-service";
import { ApprovalCard } from "@/components/admin/ApprovalCard";
import { ShieldCheck } from "lucide-react";

export async function MemberApprovalsSection() {
  const pending = await listPendingApplications();

  return (
    <div className="w-full">
      <header className="mb-8">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <h1 className="font-tech text-3xl font-bold uppercase tracking-wider text-on-surface sm:text-4xl">
            Member Approvals
          </h1>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
          New members appear here after they verify their email. Approve to send their login
          password and unlock profile setup. You can also approve from the secure link in the
          notification email.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">
          Pending review ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="rounded-lg border border-white/5 bg-[#0d1118]/60 px-4 py-8 text-center text-sm text-on-surface-variant">
            No applicants are awaiting review. When someone signs up and verifies their email,
            they will show up here.
          </p>
        ) : (
          <div className="space-y-3">
            {pending.map(({ user }) => (
              <ApprovalCard
                key={user.id}
                applicant={{
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  phone: user.phone,
                  applicationMessage: user.applicationMessage,
                  authProvider: user.authProvider,
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
