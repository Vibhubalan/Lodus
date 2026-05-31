import type { RosterMember } from "@/lib/members/roster-types";

export const HOME_DECK_SLOT_COUNT = 4;

/** Deterministic first paint — matches on server and client (avoids hydration mismatch). */
export function pickStableSlots(
  pool: RosterMember[],
  slotCount = HOME_DECK_SLOT_COUNT,
): RosterMember[] {
  if (pool.length <= slotCount) return pool;
  return [...pool]
    .sort((a, b) => a.id.localeCompare(b.id))
    .slice(0, slotCount);
}

/** Pick up to `slotCount` members; pads with random picks when the pool is larger but odd-sized. */
export function pickRotatingSlots(
  pool: RosterMember[],
  slotCount = HOME_DECK_SLOT_COUNT,
): RosterMember[] {
  if (pool.length === 0) return [];
  if (pool.length <= slotCount) return pool;

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const picked: RosterMember[] = [];

  for (const member of shuffled) {
    if (picked.length >= slotCount) break;
    picked.push(member);
  }

  while (picked.length < slotCount) {
    picked.push(pool[Math.floor(Math.random() * pool.length)]);
  }

  return picked;
}
