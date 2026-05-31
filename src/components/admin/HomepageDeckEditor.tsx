"use client";

import type { HomepageMemberOverride } from "@/lib/site/homepage-config";
import type { RosterMember } from "@/lib/members/roster-types";
import Image from "next/image";

type Props = {
  roster: RosterMember[];
  overrides: Record<string, HomepageMemberOverride>;
  onOverrideChange: (memberId: string, patch: Partial<HomepageMemberOverride>) => void;
};

export function HomepageDeckEditor({ roster, overrides, onOverrideChange }: Props) {
  if (roster.length === 0) {
    return (
      <p className="text-sm text-on-surface-variant">No roster members yet. Approve members first.</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {roster.map((member) => {
          const override = overrides[member.id] ?? {};
          return (
            <div
              key={member.id}
              className="rounded-lg border border-white/10 bg-black/25 p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-white/10">
                  <Image
                    src={member.photoUrl}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized={member.photoUrl.startsWith("http")}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{member.realName}</p>
                  <p className="truncate text-[10px] text-on-surface-variant">{member.email}</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Homepage card name (optional)
                  </label>
                  <input
                    type="text"
                    value={override.displayName ?? ""}
                    onChange={(e) =>
                      onOverrideChange(member.id, { displayName: e.target.value })
                    }
                    placeholder={member.name}
                    className="w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Homepage card tagline (optional)
                  </label>
                  <input
                    type="text"
                    value={override.tagline ?? ""}
                    onChange={(e) => onOverrideChange(member.id, { tagline: e.target.value })}
                    placeholder={member.description || member.bio || "Short line on card"}
                    className="w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-on-surface-variant/70">
        Optional display name and tagline for homepage cards. Saved with &quot;Save Changes&quot;. Use
        the crown on a member in the Members tab to add them to the Leadership deck.
      </p>
    </div>
  );
}
