import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  fetchMembersRoster,
  filterRosterForViewer,
} from "@/lib/queries/members-roster";
import type { RosterViewerMode } from "@/lib/members/roster-types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const modeParam = searchParams.get("mode");

  const session = await auth();
  const viewerMode: RosterViewerMode =
    modeParam === "public"
      ? "public"
      : session?.user
        ? "member"
        : "public";

  const roster = await fetchMembersRoster();
  const filtered = filterRosterForViewer(roster, viewerMode);

  return NextResponse.json({
    roster: filtered,
    viewerMode,
  });
}
