"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { games, memberGames, members, users } from "@/lib/db/schema";
import { consumeToken, markTokenUsed } from "@/lib/auth/user-service";
import { isAdminEmail, isOwnerEmail } from "@/lib/auth/staff";
import { auth } from "@/lib/auth";
import { validateBirthdateInput } from "@/lib/members/age";
import {
  SKILL_CATALOG,
  SKILL_CATEGORIES,
  serializeMemberSkills,
  type MemberSkills,
} from "@/lib/members/skill-catalog";
import { formatPhoneWithDialCode } from "@/lib/phone/country-codes";
import { saveImage } from "@/lib/uploads/save-image";

function parseSkillsFromForm(formData: FormData): MemberSkills {
  const skills: MemberSkills = { gaming: [], tech: [], social: [] };
  for (const category of SKILL_CATEGORIES) {
    const raw = formData.getAll(`skills_${category}`).map(String);
    skills[category] = raw.filter((s) =>
      (SKILL_CATALOG[category] as readonly string[]).includes(s),
    );
  }
  return skills;
}

function parseGamesFromForm(formData: FormData): string[] {
  return [...new Set(formData.getAll("games").map((v) => String(v).trim()).filter(Boolean))];
}

async function linkMemberGames(memberId: number, gameNames: string[]) {
  await db.delete(memberGames).where(eq(memberGames.memberId, memberId));
  if (gameNames.length === 0) return;

  const allSystemGames = await db.select().from(games);
  const gameIdByName = new Map(allSystemGames.map((g) => [g.name.toLowerCase(), g.id]));

  const links = gameNames
    .map((name) => gameIdByName.get(name.toLowerCase()))
    .filter((id): id is number => id != null)
    .map((gameId) => ({ memberId, gameId }));

  if (links.length > 0) {
    await db.insert(memberGames).values(links);
  }
}

export async function completeProfileSetup(
  prevState: unknown,
  formData: FormData,
): Promise<{ ok: boolean; error?: string; success?: boolean }> {
  const token = formData.get("token") as string;
  const name = (formData.get("name") as string)?.trim();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const dialCode = (formData.get("phoneDialCode") as string)?.trim() || "91";
  const phoneLocal = (formData.get("phoneLocal") as string)?.trim() ?? "";
  const birthdate = (formData.get("birthdate") as string)?.trim();
  const bio = (formData.get("bio") as string)?.trim();
  const profilePic = formData.get("profilePic") as File;
  const phone = formatPhoneWithDialCode(dialCode, phoneLocal);

  if (!name || !password || !confirmPassword || !phone || !bio) {
    return { ok: false, error: "Please fill in all required fields." };
  }
  if (!profilePic || profilePic.size === 0) {
    return { ok: false, error: "Profile picture is required." };
  }
  if (!/^[a-zA-Z\s]+$/.test(name)) {
    return { ok: false, error: "Display name can only contain letters and spaces." };
  }
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters long." };
  }
  if (password !== confirmPassword) {
    return { ok: false, error: "Passwords do not match." };
  }
  if (phone.replace(/\D/g, "").length < 10) {
    return { ok: false, error: "Enter a valid phone number with country code." };
  }

  const birthdateError = validateBirthdateInput(birthdate);
  if (birthdateError) {
    return { ok: false, error: birthdateError };
  }

  if (bio.length < 10) {
    return { ok: false, error: "About me should be at least 10 characters." };
  }
  if (bio.length > 2000) {
    return { ok: false, error: "About me is too long (max 2000 characters)." };
  }

  const skills = parseSkillsFromForm(formData);
  const gameNames = parseGamesFromForm(formData);

  let userId: number;
  let userEmail: string;
  let tokenRecordId: number | null = null;

  const session = await auth();
  if (session?.user?.email && isAdminEmail(session.user.email)) {
    return { ok: false, error: "Admin accounts do not use member profile setup." };
  }
  if (session?.user?.email && session.user.needsProfile) {
    const userList = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email.toLowerCase()))
      .limit(1);
    const dbUser = userList[0];
    if (!dbUser) return { ok: false, error: "User account not found." };
    if (dbUser.status !== "approved") {
      return {
        ok: false,
        error: "Your application must be approved before you can complete profile setup.",
      };
    }
    userId = dbUser.id;
    userEmail = dbUser.email;
  } else {
    if (!token) return { ok: false, error: "Authorization failed. Please log in first." };

    const tokenRecord = await consumeToken(token, "setup_profile");
    if (!tokenRecord) {
      return { ok: false, error: "Invalid or expired setup session." };
    }

    const userList = await db
      .select()
      .from(users)
      .where(eq(users.id, tokenRecord.userId))
      .limit(1);
    const dbUser = userList[0];
    if (!dbUser) return { ok: false, error: "User account not found." };
    if (dbUser.status !== "approved") {
      return {
        ok: false,
        error: "Your application must be approved before you can complete profile setup.",
      };
    }

    userId = dbUser.id;
    userEmail = dbUser.email;
    tokenRecordId = tokenRecord.id;
  }

  const phoneCheck = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  if (phoneCheck[0] && phoneCheck[0].id !== userId) {
    return { ok: false, error: "This phone number is already associated with another account." };
  }

  const nameCheck = await db.select().from(users).where(eq(users.name, name)).limit(1);
  if (nameCheck[0] && nameCheck[0].id !== userId) {
    return { ok: false, error: "This display name is already taken." };
  }

  try {
    let avatarUrl: string;
    try {
      avatarUrl = await saveImage(profilePic, "uploads", `${userId}_avatar`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save profile picture.";
      return { ok: false, error: message };
    }

    const newPasswordHash = await bcrypt.hash(password, 12);
    const skillsJson = serializeMemberSkills(skills);

    await db
      .update(users)
      .set({
        name,
        passwordHash: newPasswordHash,
        hasCustomPassword: true,
        phone,
        birthdate,
        avatarUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    const email = userEmail.toLowerCase();
    let memberRole: "owner" | "admin" | "member" = "member";
    if (isOwnerEmail(email)) {
      memberRole = "owner";
    } else if (isAdminEmail(email)) {
      memberRole = "admin";
    }

    const existingMember = await db
      .select()
      .from(members)
      .where(eq(members.email, email))
      .limit(1);

    let memberId: number;
    if (existingMember[0]) {
      memberId = existingMember[0].id;
      await db
        .update(members)
        .set({
          name,
          avatarUrl,
          bio,
          skills: skillsJson,
          role: memberRole,
        })
        .where(eq(members.id, memberId));
    } else {
      const all = await db.select().from(members);
      const inserted = await db
        .insert(members)
        .values({
          name,
          email,
          avatarUrl,
          bio,
          skills: skillsJson,
          role: memberRole,
          status: "offline",
          tagline:
            memberRole === "owner"
              ? "Founder"
              : memberRole === "admin"
                ? "Admins Layer"
                : "Member",
          sortOrder: all.length + 1,
        })
        .returning();
      if (!inserted[0]) {
        return { ok: false, error: "Could not create your roster profile." };
      }
      memberId = inserted[0].id;
    }

    await linkMemberGames(memberId, gameNames);

    if (tokenRecordId) {
      await markTokenUsed(tokenRecordId);
    }

    return { ok: true, success: true };
  } catch (err) {
    console.error("Failed to complete profile setup:", err);
    return { ok: false, error: "Server failed to complete setup. Please try again." };
  }
}
