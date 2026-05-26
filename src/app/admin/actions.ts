"use server";

import { db } from "@/lib/db";
import { games, members, resources, siteContent } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import { setGameMembers } from "@/lib/queries";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function assertAdmin() {
  await requireAuth();
}

export async function updateSiteContent(formData: FormData) {
  await assertAdmin();
  const tagline = formData.get("tagline") as string;
  const aboutMarkdown = formData.get("aboutMarkdown") as string;
  const storyMarkdown = (formData.get("storyMarkdown") as string) || null;
  const foundedLabel = formData.get("foundedLabel") as string;
  const foundedHistory = formData.get("foundedHistory") as string;
  const pinnedNote = (formData.get("pinnedNote") as string) || null;

  const existing = await db.select().from(siteContent).limit(1);
  if (existing[0]) {
    await db
      .update(siteContent)
      .set({
        tagline,
        aboutMarkdown,
        storyMarkdown,
        foundedLabel,
        foundedHistory,
        pinnedNote,
      })
      .where(eq(siteContent.id, existing[0].id));
  } else {
    await db.insert(siteContent).values({
      tagline,
      aboutMarkdown,
      storyMarkdown,
      foundedLabel,
      foundedHistory,
      pinnedNote,
    });
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function upsertMember(formData: FormData) {
  await assertAdmin();
  const id = formData.get("id");
  const name = formData.get("name") as string;
  const tagline = (formData.get("tagline") as string) || null;
  const bio = (formData.get("bio") as string) || null;
  const role = formData.get("role") as "owner" | "admin" | "member";
  const status = formData.get("status") as "online" | "away" | "in_game" | "offline";
  const sortOrder = Number(formData.get("sortOrder") ?? 0);

  if (id) {
    await db
      .update(members)
      .set({ name, tagline, bio, role, status, sortOrder })
      .where(eq(members.id, Number(id)));
  } else {
    await db.insert(members).values({ name, tagline, bio, role, status, sortOrder });
  }

  revalidatePath("/");
  revalidatePath("/admin/members");
}

export async function deleteMember(id: number) {
  await assertAdmin();
  await db.delete(members).where(eq(members.id, id));
  revalidatePath("/");
  revalidatePath("/admin/members");
}

export async function upsertResource(formData: FormData) {
  await assertAdmin();
  const id = formData.get("id");
  const title = formData.get("title") as string;
  const url = formData.get("url") as string;
  const category = formData.get("category") as string;
  const description = (formData.get("description") as string) || null;
  const sortOrder = Number(formData.get("sortOrder") ?? 0);

  if (id) {
    await db
      .update(resources)
      .set({ title, url, category, description, sortOrder })
      .where(eq(resources.id, Number(id)));
  } else {
    await db.insert(resources).values({ title, url, category, description, sortOrder });
  }

  revalidatePath("/library");
  revalidatePath("/admin/resources");
}

export async function deleteResource(id: number) {
  await assertAdmin();
  await db.delete(resources).where(eq(resources.id, id));
  revalidatePath("/library");
  revalidatePath("/admin/resources");
}

export async function upsertGame(formData: FormData) {
  await assertAdmin();
  const id = formData.get("id");
  const name = formData.get("name") as string;
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const memberIdsRaw = formData.getAll("memberIds").map(Number);

  let gameId: number;
  if (id) {
    gameId = Number(id);
    await db.update(games).set({ name, sortOrder }).where(eq(games.id, gameId));
  } else {
    const inserted = await db.insert(games).values({ name, sortOrder }).returning();
    gameId = inserted[0]!.id;
  }

  await setGameMembers(gameId, memberIdsRaw);

  revalidatePath("/games");
  revalidatePath("/admin/games");
}

export async function deleteGame(id: number) {
  await assertAdmin();
  await db.delete(games).where(eq(games.id, id));
  revalidatePath("/games");
  revalidatePath("/admin/games");
}
