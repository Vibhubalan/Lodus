"use server";

import { db } from "@/lib/db";
import { games, memberGames, members, resources, siteContent, users } from "@/lib/db/schema";
import { purgeOrphanRosterByEmail, purgeUserCompletely } from "@/lib/auth/purge-user";
import { auth, requireStaff } from "@/lib/auth";
import { canDeleteMembers, isUndeletableStaffAccount } from "@/lib/auth/staff";
import { saveImage } from "@/lib/uploads/save-image";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { setGameMembers } from "@/lib/queries";

async function assertAdmin() {
  await requireStaff();
}

export async function updateSiteContent(formData: FormData) {
  await assertAdmin();
  const tagline = formData.get("tagline") as string;
  const aboutTitle = formData.get("aboutTitle") as string;
  const aboutImageUrl = formData.get("aboutImageUrl") as string;
  const aboutMarkdown = formData.get("aboutMarkdown") as string;
  const storyMarkdown = (formData.get("storyMarkdown") as string) || null;
  const foundedLabel = formData.get("foundedLabel") as string;
  const foundedHistory = formData.get("foundedHistory") as string;
  const pinnedNote = (formData.get("pinnedNote") as string) || null;
  const highlightsJson = formData.get("highlightsJson") as string;
  const homepageJson = (formData.get("homepageJson") as string) || "{}";

  const existing = await db.select().from(siteContent).limit(1);
  if (existing[0]) {
    await db
      .update(siteContent)
      .set({
        tagline,
        aboutTitle,
        aboutImageUrl,
        aboutMarkdown,
        storyMarkdown,
        foundedLabel,
        foundedHistory,
        pinnedNote,
        highlightsJson,
        homepageJson,
      })
      .where(eq(siteContent.id, existing[0].id));
  } else {
    await db.insert(siteContent).values({
      tagline,
      aboutTitle,
      aboutImageUrl,
      aboutMarkdown,
      storyMarkdown,
      foundedLabel,
      foundedHistory,
      pinnedNote,
      highlightsJson,
      homepageJson,
    });
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function uploadSiteAboutImage(
  formData: FormData,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await assertAdmin();

  const file = formData.get("aboutImage");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose an image file to upload." };
  }

  try {
    const url = await saveImage(file, "images/about", "about");

    const existing = await db.select().from(siteContent).limit(1);
    if (existing[0]) {
      await db
        .update(siteContent)
        .set({ aboutImageUrl: url })
        .where(eq(siteContent.id, existing[0].id));
    } else {
      await db.insert(siteContent).values({
        tagline: "Our group. Our games. Our space.",
        aboutTitle: "About Lodus",
        aboutImageUrl: url,
        aboutMarkdown: "",
        foundedLabel: "March 2024",
        foundedHistory: "",
        highlightsJson: "[]",
        homepageJson: "{}",
      });
    }

    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true, url };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    return { ok: false, error: message };
  }
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
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase() ?? "";
  if (!canDeleteMembers(email)) {
    throw new Error("Only the admin account can delete members.");
  }
  const row = await db.select().from(members).where(eq(members.id, id)).limit(1);
  const member = row[0];
  if (!member) return;

  if (member.email?.trim()) {
    const memberEmail = member.email.trim().toLowerCase();
    if (isUndeletableStaffAccount(memberEmail)) {
      throw new Error("The site admin account cannot be deleted.");
    }
    const userRow = await db.select().from(users).where(eq(users.email, memberEmail)).limit(1);
    if (userRow[0]) {
      await purgeUserCompletely(userRow[0].id, memberEmail);
      revalidatePath("/");
      revalidatePath("/admin/members");
      return;
    }
    await purgeOrphanRosterByEmail(email);
  } else {
    await db.delete(memberGames).where(eq(memberGames.memberId, id));
    await db.delete(members).where(eq(members.id, id));
  }

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
