"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { MemberDirectoryCard } from "@/components/members/MemberDirectoryCard";
import { MemberProfileModal } from "@/components/members/MemberProfileModal";
import type { RosterMember, RosterViewerMode } from "@/lib/members/roster-types";

export function MembersShowAllOverlay({
  roster,
  onClose,
  viewerMode = "public",
  title = "All Members",
  canEditRoster = false,
  canDeleteMembers = false,
}: {
  roster: RosterMember[];
  onClose: () => void;
  viewerMode?: RosterViewerMode;
  title?: string;
  canEditRoster?: boolean;
  canDeleteMembers?: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const selected = roster.find((m) => m.id === selectedId);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (selectedId) {
        e.preventDefault();
        e.stopPropagation();
        setSelectedId(null);
        return;
      }
      onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey, true);
    };
  }, [onClose, selectedId]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 pointer-events-auto">
      <button
        type="button"
        className="absolute inset-0 bg-[#06080c]/90 backdrop-blur-md"
        onClick={onClose}
        aria-label="Close members list"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="members-overlay-title"
        className="relative z-10 flex w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0f1115] shadow-2xl max-h-[min(88vh,900px)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
          <div>
            <h2
              id="members-overlay-title"
              className="font-tech text-xl font-bold uppercase tracking-wider text-on-surface"
            >
              {title}
            </h2>
            <p className="mt-1 text-xs text-on-surface-variant">
              {roster.length} {roster.length === 1 ? "person" : "people"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-on-surface transition-all hover:bg-white/10 cursor-pointer focus:outline-none focus-visible:outline-none"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative z-10 min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 scrollbar-none">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {roster.map((member) => (
              <MemberDirectoryCard
                key={member.id}
                member={member}
                viewerMode={viewerMode}
                onSelect={setSelectedId}
              />
            ))}
          </div>
        </div>
      </div>

      {selected ? (
        <MemberProfileModal
          member={selected}
          viewerMode={viewerMode}
          onClose={() => setSelectedId(null)}
          canEditRoster={canEditRoster}
          canDeleteMembers={canDeleteMembers}
        />
      ) : null}
    </div>,
    document.body,
  );
}
