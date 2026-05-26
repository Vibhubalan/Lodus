import { MemberAvatar } from "@/components/members/MemberAvatar";
import { StatusBadge } from "@/components/members/StatusBadge";
import type { Member } from "@/lib/db/schema";

export function MembersGrid({ members }: { members: Member[] }) {
  return (
    <section id="members" className="scroll-mt-24 pb-8 pt-16">
      <div className="mb-8">
        <h2 className="text-2xl font-medium text-on-surface">Members</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Everyone in Lodus</p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {members.map((person) => (
          <div key={person.id} className="glass-card flex flex-col items-center rounded-lg p-4 text-center">
            <MemberAvatar name={person.name} avatarUrl={person.avatarUrl} size={40} />
            <h3 className="mt-3 text-sm font-semibold text-on-surface">{person.name}</h3>
            {person.tagline && (
              <p className="mt-0.5 text-xs text-on-surface-variant">{person.tagline}</p>
            )}
            <div className="mt-3">
              <StatusBadge status={person.status} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
