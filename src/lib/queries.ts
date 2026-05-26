import { asc, eq } from "drizzle-orm";
import { db } from "./db";
import {
  games,
  memberGames,
  members,
  resources,
  siteContent,
} from "./db/schema";

export async function getSiteContent() {
  const rows = await db.select().from(siteContent).limit(1);
  return rows[0] ?? null;
}

export async function getAllMembers() {
  return db.select().from(members).orderBy(asc(members.sortOrder), asc(members.name));
}

export async function getLeadership() {
  const all = await getAllMembers();
  return all.filter((m) => m.role === "owner" || m.role === "admin");
}

export async function getRegularMembers() {
  const all = await getAllMembers();
  return all.filter((m) => m.role === "member");
}

export async function getResources() {
  return db
    .select()
    .from(resources)
    .orderBy(asc(resources.sortOrder), asc(resources.title));
}

export async function getGamesWithMembers() {
  const allGames = await db
    .select()
    .from(games)
    .orderBy(asc(games.sortOrder), asc(games.name));
  const links = await db.select().from(memberGames);
  const allMembers = await getAllMembers();
  const memberMap = new Map(allMembers.map((m) => [m.id, m]));

  return allGames.map((game) => {
    const memberIds = links.filter((l) => l.gameId === game.id).map((l) => l.memberId);
    const gameMembers = memberIds
      .map((id) => memberMap.get(id))
      .filter((m): m is NonNullable<typeof m> => !!m);
    return { ...game, members: gameMembers };
  });
}

export async function getOnlineMembers() {
  const all = await getAllMembers();
  return all.filter((m) => m.status === "online" || m.status === "in_game");
}

export async function setGameMembers(gameId: number, memberIds: number[]) {
  await db.delete(memberGames).where(eq(memberGames.gameId, gameId));
  if (memberIds.length > 0) {
    await db.insert(memberGames).values(
      memberIds.map((memberId) => ({ memberId, gameId })),
    );
  }
}
