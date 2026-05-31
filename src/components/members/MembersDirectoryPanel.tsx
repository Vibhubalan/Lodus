"use client";

import { useMemo, useState, useEffect } from "react";
import { Users } from "lucide-react";
import { MemberDirectoryCard } from "@/components/members/MemberDirectoryCard";
import { MemberProfileModal } from "@/components/members/MemberProfileModal";
import type { RosterMember, RosterViewerMode } from "@/lib/members/roster-types";
import { updateHomepageDeck } from "@/app/admin/roster/actions";
import { AddRosterMemberForm } from "@/components/members/AddRosterMemberForm";

type DB_Role = {
  id: number;
  name: string;
  slug: string;
  color: string;
  permissions: string;
  isSystem: boolean;
  sortOrder: number;
};

type DB_Game = {
  id: number;
  name: string;
  sortOrder: number;
};

export function MembersDirectoryPanel({
  roster,
  viewerMode,
  maxCards,
  showHeader = true,
  allRoles = [],
  allGames = [],
  canEdit = false,
  canDeleteMembers = false,
}: {
  roster: RosterMember[];
  viewerMode: RosterViewerMode;
  maxCards?: number;
  showHeader?: boolean;
  allRoles?: DB_Role[];
  allGames?: DB_Game[];
  canEdit?: boolean;
  canDeleteMembers?: boolean;
}) {
  const [localRoster, setLocalRoster] = useState(roster);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setLocalRoster(roster);
  }, [roster]);

  const handleToggleDeck = async (userId: number, value: boolean) => {
    setLocalRoster((prev) =>
      prev.map((m) => {
        if (m.userId === userId) {
          return { ...m, showInLeadership: value };
        }
        return m;
      }),
    );

    const res = await updateHomepageDeck(userId, "leadership", value);
    if (!res.ok) {
      setLocalRoster(roster);
      alert(res.error);
    }
  };
  const visible = maxCards != null ? localRoster.slice(0, maxCards) : localRoster;
  const selected = useMemo(
    () => localRoster.find((m) => m.id === selectedId),
    [localRoster, selectedId],
  );

  return (
    <div className="w-full">
      {showHeader ? (
        <header className="mb-8">
          <div className="mb-2 flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            <h1 className="font-tech text-3xl font-bold tracking-wider text-on-surface uppercase sm:text-4xl">
              People
            </h1>
          </div>
          <p className="max-w-xl text-sm text-on-surface-variant">
            The Lodus member directory. Tap a card to view full profile, skills, and socials.
          </p>
        </header>
      ) : null}

      {canEdit ? <AddRosterMemberForm /> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((member) => (
          <MemberDirectoryCard
            key={member.id}
            member={member}
            onSelect={setSelectedId}
            isAdmin={canEdit}
            onToggleDeck={(val) => handleToggleDeck(member.userId, val)}
          />
        ))}
      </div>

      {selected ? (
        <MemberProfileModal
          member={selected}
          viewerMode={viewerMode}
          onClose={() => setSelectedId(null)}
          allRoles={allRoles}
          allGames={allGames}
          canEditRoster={canEdit}
          canDeleteMembers={canDeleteMembers}
        />
      ) : null}
    </div>
  );
}
