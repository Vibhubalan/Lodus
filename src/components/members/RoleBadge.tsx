import { ROLE_LABELS } from "@/lib/constants";
import type { Member } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

const styles: Record<Member["role"], string> = {
  owner: "bg-[var(--color-owner-badge)] text-white",
  admin: "bg-on-surface text-primary-container",
  member: "bg-surface-container-high text-on-surface-variant",
};

export function RoleBadge({ role }: { role: Member["role"] }) {
  return (
    <span
      className={cn(
        "rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        styles[role],
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
