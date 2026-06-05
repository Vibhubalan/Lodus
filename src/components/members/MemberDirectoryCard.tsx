"use client";

import { SafeDisplayImage } from "@/components/ui/SafeDisplayImage";
import { StatusBadge } from "@/components/members/StatusBadge";
import { rosterCardBadge } from "@/lib/members/roster-display";
import type { RosterMember, RosterViewerMode } from "@/lib/members/roster-types";

function truncateDescription(text: string | null | undefined): string {
  const desc = text || "Lodus member";
  let nonSpaceCount = 0;
  let result = "";
  for (let i = 0; i < desc.length; i++) {
    const char = desc[i];
    result += char;
    if (char !== " ") {
      nonSpaceCount++;
    }
    if (nonSpaceCount >= 16) {
      if (i < desc.length - 1) {
        result += "...";
      }
      break;
    }
  }
  return result;
}

export function MemberDirectoryCard({
  member,
  onSelect,
  isSmall = false,
  viewerMode = "member",
}: {
  member: RosterMember;
  onSelect: (id: string) => void;
  isSmall?: boolean;
  viewerMode?: RosterViewerMode;
}) {
  const isPublicView = viewerMode === "public";
  const badge = rosterCardBadge(member);

  const cardHeightClass = isSmall
    ? "min-h-[250px]"
    : isPublicView
      ? "min-h-[300px] sm:min-h-[320px]"
      : "min-h-[320px] sm:min-h-[360px]";
  const imgHeightClass = isSmall
    ? "min-h-[160px]"
    : isPublicView
      ? "min-h-[200px] sm:min-h-[220px]"
      : "min-h-[220px] sm:min-h-[260px]";
  const nameSizeClass = isSmall ? "text-lg" : "text-2xl";

  const displayDescription = isSmall
    ? truncateDescription(member.description)
    : (member.description || "Lodus member");

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(member.id)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(member.id); }}}
      className={`group relative flex h-full ${cardHeightClass} w-full flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0d1118]/92 text-left shadow-lg transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_28px_rgba(255,70,85,0.12)] focus:outline-none focus-visible:outline-none cursor-pointer`}
    >


      <div className={`relative ${imgHeightClass} flex-1 overflow-hidden`}>
        <SafeDisplayImage
          src={member.photoUrl}
          alt={member.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
          unoptimized={member.photoUrl.startsWith("http")}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0507] via-[#0a0507]/55 to-transparent" />
        {!isPublicView ? (
          <div className="absolute left-3 top-3 z-10">
            <span className="rounded-md border border-primary/30 bg-primary/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary">
              {badge}
            </span>
          </div>
        ) : null}
      </div>

      <div className="relative z-10 flex flex-col gap-1.5 px-4 pb-4 pt-1">
        <div className="flex items-baseline gap-2 min-w-0">
          <h3 className={`truncate font-tech ${nameSizeClass} font-bold leading-none text-on-surface`}>
            {member.name}
          </h3>
          {member.age != null ? (
            <span className="shrink-0 text-xs font-mono text-on-surface-variant/70">
              {member.age}
            </span>
          ) : null}
        </div>
        {!isPublicView ? (
          <>
            <StatusBadge status={member.presence} />
            <p className="line-clamp-2 text-xs leading-relaxed text-on-surface-variant">
              {displayDescription}
            </p>
          </>
        ) : null}
        {!isSmall ? (
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary/80 opacity-0 transition-opacity group-hover:opacity-100">
            View profile →
          </p>
        ) : null}
      </div>
    </div>
  );
}
