"use client";

import { SafeDisplayImage } from "@/components/ui/SafeDisplayImage";
import { StatusBadge } from "@/components/members/StatusBadge";
import type { RosterMember, RosterViewerMode } from "@/lib/members/roster-types";

/** Square (1:1) homepage deck card — shared by Leadership and Team sections. */
export function HomeDeckCard({
  person,
  viewerMode,
}: {
  person: RosterMember;
  viewerMode: RosterViewerMode;
}) {
  const showPresence = viewerMode === "member";
  const designation = person.description?.trim();

  return (
    <article className="glass-card group flex w-full flex-col overflow-hidden rounded-lg p-0 text-left">
      <div className="relative aspect-square w-full overflow-hidden">
        <SafeDisplayImage
          src={person.photoUrl}
          alt={person.name}
          fill
          className="object-cover object-center"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
          unoptimized={person.photoUrl.startsWith("http")}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0507]/95 via-[#0a0507]/25 to-transparent" />
      </div>

      <div className="flex min-h-[78px] flex-col justify-center gap-1.5 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-baseline gap-1.5">
            <h3 className="min-w-0 truncate font-semibold text-on-surface">{person.name}</h3>
            {person.age != null ? (
              <span className="shrink-0 text-[10px] font-mono text-on-surface-variant/70">
                {person.age}
              </span>
            ) : null}
          </div>
          {showPresence ? <StatusBadge status={person.presence} /> : null}
        </div>
        {designation ? (
          <p className="line-clamp-1 text-[11px] leading-relaxed text-on-surface-variant">
            {designation}
          </p>
        ) : null}
      </div>
    </article>
  );
}
