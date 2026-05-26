import { MemberAvatar } from "@/components/members/MemberAvatar";
import { STATUS_LABELS } from "@/lib/constants";
import type { Member } from "@/lib/db/schema";

export function OnlineWidget({ members }: { members: Member[] }) {
  return (
    <div className="admin-card p-6">
      <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-on-surface-variant">
        Who&apos;s Online
      </h3>
      <ul className="space-y-4">
        {members.length === 0 ? (
          <li className="text-sm text-on-surface-variant">No one online right now.</li>
        ) : (
          members.map((m) => (
            <li key={m.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MemberAvatar name={m.name} avatarUrl={m.avatarUrl} size={32} />
                <span className="text-sm text-on-surface">{m.name}</span>
              </div>
              <span className="text-xs text-on-surface-variant">{STATUS_LABELS[m.status]}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
