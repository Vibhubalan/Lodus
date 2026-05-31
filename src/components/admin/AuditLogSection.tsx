import { listAuditLogs } from "@/lib/auth/user-service";
import { Terminal, Shield, UserPlus, UserMinus, ShieldAlert, Key, Edit, Trash } from "lucide-react";

type AuditEntry = {
  id: number;
  actorEmail: string;
  action: string;
  targetUserId: number | null;
  metadata: string | null;
  createdAt: Date;
};

function LogIcon({ action }: { action: string }) {
  if (action.includes("role.created")) return <Shield className="h-4.5 w-4.5 text-green-400" />;
  if (action.includes("role.deleted")) return <Trash className="h-4.5 w-4.5 text-red-400" />;
  if (action.includes("role.permissions")) return <ShieldAlert className="h-4.5 w-4.5 text-yellow-400" />;
  if (action.includes("member.approved")) return <UserPlus className="h-4.5 w-4.5 text-green-400" />;
  if (action.includes("member.rejected")) return <UserMinus className="h-4.5 w-4.5 text-red-400" />;
  if (action.includes("member.deleted")) return <Trash className="h-4.5 w-4.5 text-red-500" />;
  if (action.includes("member.password")) return <Key className="h-4.5 w-4.5 text-blue-400" />;
  if (action.includes("member.updated")) return <Edit className="h-4.5 w-4.5 text-indigo-400" />;
  return <Terminal className="h-4.5 w-4.5 text-on-surface-variant/70" />;
}

interface AuditMetadata {
  email?: string;
  roleName?: string;
  roleSlug?: string;
  changes?: Record<string, unknown>;
}

function formatActionMessage(action: string, meta: AuditMetadata | null | undefined) {
  switch (action) {
    case "member.approved":
      return (
        <span>
          approved membership application for <strong className="text-white select-all">{meta?.email ?? "User"}</strong>
        </span>
      );
    case "member.rejected":
      return (
        <span>
          rejected membership application for <strong className="text-white select-all">{meta?.email ?? "User"}</strong>
        </span>
      );
    case "member.deleted":
      return (
        <span>
          removed member account <strong className="text-white select-all">{meta?.email ?? "User"}</strong>
        </span>
      );
    case "member.updated":
      return (
        <span>
          updated profile details for member <strong className="text-white select-all">{meta?.email ?? "User"}</strong>
          {meta?.changes && (
            <span className="block mt-1 font-mono text-[10px] text-on-surface-variant/60">
              Changes: {Object.keys(meta.changes).join(", ")}
            </span>
          )}
        </span>
      );
    case "member.password_reset":
      return (
        <span>
          reset login credentials/password for member <strong className="text-white select-all">{meta?.email ?? "User"}</strong>
        </span>
      );
    case "role.created":
      return (
        <span>
          created custom role <strong className="text-white">&quot;{meta?.roleName ?? "Role"}&quot;</strong> <span className="font-mono text-[10px] text-on-surface-variant/50">(@{meta?.roleSlug})</span>
        </span>
      );
    case "role.permissions_updated":
      return (
        <span>
          updated security policies for role <strong className="text-white">&quot;{meta?.roleName ?? "Role"}&quot;</strong>
        </span>
      );
    case "role.deleted":
      return (
        <span>
          deleted custom role <strong className="text-white">&quot;{meta?.roleName ?? "Role"}&quot;</strong>
        </span>
      );
    default:
      return <span>performed administrative action <strong className="text-white">{action}</strong></span>;
  }
}

export async function AuditLogSection() {
  const logs = (await listAuditLogs(80)) as AuditEntry[];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Terminal className="h-7 w-7 text-primary" />
            <h1 className="font-tech text-3xl font-bold uppercase tracking-wider text-on-surface">
              Activity Audit Logs
            </h1>
          </div>
          <p className="text-sm text-on-surface-variant">
            Platform action trail. Keeps track of administrative activities and member role changes.
          </p>
        </div>
      </header>

      {/* Audit Log Timeline */}
      <div className="rounded-xl border border-white/10 bg-[#0d1118]/20 p-5 backdrop-blur-md">
        {logs.length === 0 ? (
          <div className="text-center py-12 font-mono text-xs text-on-surface-variant/60 uppercase tracking-wider">
            No administrative activity recorded yet.
          </div>
        ) : (
          <div className="relative border-l border-white/10 pl-6 space-y-6">
            {logs.map((log) => {
              let meta = null;
              try {
                if (log.metadata) meta = JSON.parse(log.metadata);
              } catch {}

              return (
                <div key={log.id} className="relative group select-none">
                  {/* Bullet indicator */}
                  <span className="absolute -left-[35px] top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#0d1118] border border-white/15 text-on-surface group-hover:border-primary/50 transition-colors">
                    <LogIcon action={log.action} />
                  </span>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/[0.02] pb-3 last:border-0">
                    <div>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        <strong className="text-[#ece8ea] select-all font-mono">
                          {log.actorEmail}
                        </strong>{" "}
                        {formatActionMessage(log.action, meta)}
                      </p>
                    </div>
                    <span className="font-mono text-[9px] text-on-surface-variant/40 shrink-0 select-text">
                      {log.createdAt.toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
