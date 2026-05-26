import { STATUS_LABELS } from "@/lib/constants";
import type { Member } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

const styles: Record<Member["status"], string> = {
  online: "bg-[var(--color-status-success-bg)] text-[var(--color-status-success)]",
  in_game: "bg-[var(--color-status-success-bg)] text-[var(--color-status-success)]",
  away: "bg-[var(--color-status-warning-bg)] text-[var(--color-status-warning)]",
  offline: "bg-surface-container-high text-on-surface-variant",
};

export function StatusBadge({ status }: { status: Member["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium",
        styles[status],
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "online" || status === "in_game"
            ? "bg-[var(--color-status-success)]"
            : status === "away"
              ? "bg-[var(--color-status-warning)]"
              : "bg-on-surface-variant",
        )}
      />
      {STATUS_LABELS[status]}
    </span>
  );
}
