import { MemberAvatar } from "@/components/members/MemberAvatar";
import { RoleBadge } from "@/components/members/RoleBadge";
import type { Member } from "@/lib/db/schema";

export function LeadershipGrid({ leaders }: { leaders: Member[] }) {
  return (
    <section id="leadership" className="scroll-mt-24 pt-16">
      <div className="mb-8">
        <h2 className="text-2xl font-medium text-on-surface">Leadership</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Owners & admins</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {leaders.map((person) => (
          <div
            key={person.id}
            className="glass-card group flex items-start gap-4 rounded-lg p-6 transition-colors hover:border-outline-variant"
          >
            <MemberAvatar name={person.name} avatarUrl={person.avatarUrl} size={64} />
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-on-surface">{person.name}</h3>
                <RoleBadge role={person.role} />
              </div>
              {person.bio && (
                <p className="line-clamp-2 text-sm text-on-surface-variant">{person.bio}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
