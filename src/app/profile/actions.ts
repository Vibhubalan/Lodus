"use server";

import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { authTokens, members, users } from "@/lib/db/schema";
import { purgeUserCompletely } from "@/lib/auth/purge-user";
import { saveImage } from "@/lib/uploads/save-image";
import { logAudit, markTokenUsed, verifyOTP } from "@/lib/auth/user-service";
import { issuePasswordResetOtp } from "@/lib/auth/password-reset";
import {
  canApproveMembers,
  canEditMemberNickname,
  isAdminEmail,
  isUndeletableStaffAccount,
} from "@/lib/auth/staff";
import {
  adminPasswordResetEmailContent,
  getBaseUrl,
  otpPasswordResetEmailContent,
  phoneVerificationEmailContent,
  sendEmail,
} from "@/lib/email/send";
import { validatePasswordComplexity } from "@/lib/validation/password";
import {
  serializeMemberSkills,
  type MemberSkills,
  SKILL_CATALOG,
  SKILL_CATEGORIES,
} from "@/lib/members/skill-catalog";
async function requireUser() {
  const session = await auth();
  if (!session?.user?.email) {
    return { error: "You must be logged in." as const, session: null, user: null };
  }
  const email = session.user.email.toLowerCase();
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];
  if (!user) return { error: "Account not found." as const, session: null, user: null };
  return { error: null as string | null, session, user };
}

export async function updatePersonalProfile(formData: FormData) {
  const gate = await requireUser();
  if (gate.error || !gate.user) return { ok: false, error: gate.error ?? undefined };

  const name = (formData.get("name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const discord = (formData.get("discord") as string)?.trim() || null;
  const instagram = (formData.get("instagram") as string)?.trim() || null;
  const linkedin = (formData.get("linkedin") as string)?.trim() || null;
  const profilePic = formData.get("profilePic") as File | null;

  if (!name || name.length < 2) {
    return { ok: false, error: "Display name is required." };
  }
  if (phone && phone.length < 8) {
    return { ok: false, error: "A valid phone number must be at least 8 characters." };
  }
  if (discord && discord.length < 2) {
    return { ok: false, error: "Discord handle must be at least 2 characters." };
  }

  // Strict rule: Display name should not have special characters or numbers (letters and spaces only)
  if (!/^[a-zA-Z\s]+$/.test(name)) {
    return { ok: false, error: "Display name can only contain letters and spaces." };
  }

  // Strict rule: Display name and phone number must be unique across all users
  const nameMatch = await db
    .select()
    .from(users)
    .where(and(eq(users.name, name), ne(users.id, gate.user.id)))
    .limit(1);
  if (nameMatch[0]) {
    return { ok: false, error: "Display name is already taken by another member." };
  }

  if (phone) {
    const phoneMatch = await db
      .select()
      .from(users)
      .where(and(eq(users.phone, phone), ne(users.id, gate.user.id)))
      .limit(1);
    if (phoneMatch[0]) {
      return { ok: false, error: "Phone number is already associated with another member." };
    }
  }

  // Strict rule: Display name can only be changed once every 7 days
  let nameUpdatedAt = gate.user.nameUpdatedAt;
  if (name !== gate.user.name) {
    if (gate.user.nameUpdatedAt) {
      const msDiff = Date.now() - new Date(gate.user.nameUpdatedAt).getTime();
      const daysDiff = msDiff / (1000 * 60 * 60 * 24);
      if (daysDiff < 7) {
        const daysRemaining = Math.ceil(7 - daysDiff);
        return {
          ok: false,
          error: `Display name can only be changed once every 7 days. Try again in ${daysRemaining} day(s).`,
        };
      }
    }
    nameUpdatedAt = new Date();
  }

  const roleSlug = gate.session?.user?.roleSlug;
  let nickname = gate.user.nickname;
  if (canEditMemberNickname(gate.user.email, roleSlug)) {
    nickname = (formData.get("nickname") as string)?.trim() || null;
  }

  let avatarUrl = gate.user.avatarUrl;
  if (profilePic && profilePic.size > 0) {
    try {
      avatarUrl = await saveImage(profilePic, "uploads", `${gate.user.id}_avatar`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save profile image.";
      return { ok: false, error: message };
    }
  }

  const phoneChanged = gate.user.phone !== phone;

  await db
    .update(users)
    .set({
      name,
      phone,
      avatarUrl,
      instagram,
      linkedin,
      nickname,
      nameUpdatedAt,
      phoneVerified: phoneChanged ? false : gate.user.phoneVerified,
      updatedAt: new Date(),
    })
    .where(eq(users.id, gate.user.id));

  const memberRows = await db
    .select()
    .from(members)
    .where(eq(members.email, gate.user.email))
    .limit(1);

  if (memberRows[0]) {
    await db
      .update(members)
      .set({ name, avatarUrl, discord, instagram, linkedin, nickname, nameUpdatedAt })
      .where(eq(members.id, memberRows[0].id));
  }

  revalidatePath("/profile");
  revalidatePath("/");
  return { ok: true, message: "Personal details updated." };
}

/** Avatar-only upload — avoids resubmitting the full profile form (and large payloads). */
export async function updateProfileAvatar(formData: FormData) {
  const gate = await requireUser();
  if (gate.error || !gate.user) return { ok: false, error: gate.error ?? undefined };

  const profilePic = formData.get("profilePic");
  if (!(profilePic instanceof File) || profilePic.size === 0) {
    return { ok: false, error: "Choose an image to upload." };
  }

  let avatarUrl: string;
  try {
    avatarUrl = await saveImage(profilePic, "uploads", `${gate.user.id}_avatar`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save profile image.";
    return { ok: false, error: message };
  }

  await db
    .update(users)
    .set({ avatarUrl, updatedAt: new Date() })
    .where(eq(users.id, gate.user.id));

  const memberRows = await db
    .select()
    .from(members)
    .where(eq(members.email, gate.user.email))
    .limit(1);

  if (memberRows[0]) {
    await db.update(members).set({ avatarUrl }).where(eq(members.id, memberRows[0].id));
  }

  revalidatePath("/profile");
  revalidatePath("/");
  return { ok: true, message: "Profile picture updated.", avatarUrl };
}

export async function updateMemberSkills(skills: MemberSkills) {
  const gate = await requireUser();
  if (gate.error || !gate.user) return { ok: false, error: gate.error ?? undefined };

  const serialized = serializeMemberSkills(skills);

  const memberRows = await db
    .select()
    .from(members)
    .where(eq(members.email, gate.user.email))
    .limit(1);

  if (memberRows[0]) {
    await db
      .update(members)
      .set({ skills: serialized })
      .where(eq(members.id, memberRows[0].id));
  } else {
    const all = await db.select().from(members);
    await db.insert(members).values({
      name: gate.user.name ?? gate.user.email.split("@")[0] ?? "Member",
      email: gate.user.email,
      avatarUrl: gate.user.avatarUrl,
      role: "member",
      status: "offline",
      skills: serialized,
      sortOrder: all.length + 1,
    });
  }

  revalidatePath("/profile");
  revalidatePath("/");
  return { ok: true, message: "Skills updated." };
}

export async function updateMemberSkillsFromForm(formData: FormData) {
  const skills: MemberSkills = { gaming: [], tech: [], social: [] };
  for (const category of SKILL_CATEGORIES) {
    const raw = formData.getAll(`skills_${category}`).map(String);
    skills[category] = raw.filter((s) =>
      (SKILL_CATALOG[category] as readonly string[]).includes(s),
    );
  }
  return updateMemberSkills(skills);
}

async function applyPasswordAfterOtp(userId: number, otpCode: string, next: string, confirm: string) {
  if (!otpCode || otpCode.length !== 6) {
    return { ok: false as const, error: "Enter the 6-digit verification code from your email." };
  }
  if (!next || !confirm) {
    return { ok: false as const, error: "New password and confirmation are required." };
  }
  const complexityError = validatePasswordComplexity(next);
  if (complexityError) {
    return { ok: false as const, error: complexityError };
  }
  if (next !== confirm) {
    return { ok: false as const, error: "New password and confirmation do not match." };
  }

  const isOtpValid = await verifyOTP(userId, otpCode);
  if (!isOtpValid) {
    return { ok: false as const, error: "Invalid or expired verification code." };
  }

  const passwordHash = await bcrypt.hash(next, 12);
  await db
    .update(users)
    .set({
      passwordHash,
      hasCustomPassword: true,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return { ok: true as const, message: "Password updated successfully." };
}

/** Member requests OTP for their own account (must be logged in). */
export async function sendPasswordResetOTP(userId: number) {
  const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const user = userRows[0];
  if (!user) return { ok: false, error: "User not found." };

  const session = await auth();
  if (!session?.user?.email) {
    return { ok: false, error: "Unauthorized." };
  }
  const actorEmail = session.user.email.trim().toLowerCase();
  const isSelf = userId === Number(session.user.id);
  const isAdminActor = canApproveMembers(actorEmail, session.user.roleSlug);

  if (!isSelf && !isAdminActor) {
    return { ok: false, error: "Forbidden." };
  }

  if (isUndeletableStaffAccount(user.email)) {
    return { ok: false, error: "The site admin account cannot use this reset flow." };
  }

  const code = await issuePasswordResetOtp(user.id);
  const loginUrl = `${getBaseUrl()}/login`;

  if (isSelf) {
    const resetMail = otpPasswordResetEmailContent(code, user.name ?? "there");
    await sendEmail({
      to: user.email,
      subject: "Your Lodus password reset code",
      html: resetMail.html,
      text: resetMail.text,
    });
    return {
      ok: true,
      message: "Verification code sent to your email. Enter it below with your new password.",
    };
  }

  const passwordHash = await bcrypt.hash(code, 12);
  await db
    .update(users)
    .set({
      passwordHash,
      hasCustomPassword: true,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  await logAudit(actorEmail, "member.password_reset_initiated", user.id, { email: user.email });

  const adminResetMail = adminPasswordResetEmailContent(code, user.name ?? "there", loginUrl);
  await sendEmail({
    to: user.email,
    subject: "Your Lodus account password was reset",
    html: adminResetMail.html,
    text: adminResetMail.text,
  });

  return {
    ok: true,
    message: `Reset email sent to ${user.email}. They must sign in with the OTP, then set a new password in Profile.`,
  };
}

/** Logged-in member: OTP email first, then new password + confirm. */
export async function changePassword(formData: FormData) {
  const gate = await requireUser();
  if (gate.error || !gate.user) return { ok: false, error: gate.error ?? undefined };

  const next = formData.get("newPassword") as string;
  const confirm = formData.get("confirmPassword") as string;
  const otpCode = (formData.get("otpCode") as string)?.trim();

  const result = await applyPasswordAfterOtp(gate.user.id, otpCode, next, confirm);
  if (!result.ok) return result;

  revalidatePath("/profile");
  return result;
}

/** Forgot password from login (no session): email → OTP → new password. */
export async function requestPasswordResetForEmail(email: string) {
  const emailLower = email.trim().toLowerCase();
  if (!emailLower) {
    return { ok: false, error: "Email is required." };
  }

  const userRows = await db.select().from(users).where(eq(users.email, emailLower)).limit(1);
  const user = userRows[0];

  if (user && !isAdminEmail(user.email) && user.status === "approved") {
    const code = await issuePasswordResetOtp(user.id);
    const resetMail = otpPasswordResetEmailContent(code, user.name ?? "there");
    await sendEmail({
      to: user.email,
      subject: "Your Lodus password reset code",
      html: resetMail.html,
      text: resetMail.text,
    });
  }

  return {
    ok: true,
    message: "If an approved account exists for that email, a verification code was sent.",
  };
}

export async function completePasswordResetByEmail(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const otpCode = (formData.get("otpCode") as string)?.trim();
  const next = formData.get("newPassword") as string;
  const confirm = formData.get("confirmPassword") as string;

  if (!email) {
    return { ok: false, error: "Email is required." };
  }

  const userRows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = userRows[0];
  if (!user) {
    return { ok: false, error: "Invalid email or verification code." };
  }
  if (isAdminEmail(user.email)) {
    return { ok: false, error: "Use Google sign-in for the admin account." };
  }
  if (user.status !== "approved") {
    return { ok: false, error: "This account is not approved yet." };
  }

  const result = await applyPasswordAfterOtp(user.id, otpCode, next, confirm);
  if (!result.ok) return result;

  return { ok: true, message: "Password updated. You can sign in with your new password." };
}

export async function sendPhoneVerificationCode() {
  const gate = await requireUser();
  if (gate.error || !gate.user) return { ok: false, error: gate.error ?? undefined };

  if (!gate.user.phone?.trim()) {
    return { ok: false, error: "Add a phone number in Personal settings first." };
  }

  const code = String(randomInt(100000, 999999));

  await db
    .delete(authTokens)
    .where(and(eq(authTokens.userId, gate.user.id), eq(authTokens.type, "phone_verify")));

  await db.insert(authTokens).values({
    userId: gate.user.id,
    type: "phone_verify",
    token: code,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });

  const phoneMail = phoneVerificationEmailContent(
    code,
    gate.user.phone,
    gate.user.name ?? "there",
  );
  await sendEmail({
    to: gate.user.email,
    subject: "Your Lodus phone verification code",
    html: phoneMail.html,
    text: phoneMail.text,
  });

  return { ok: true, message: "Verification code sent to your Gmail inbox." };
}

export async function verifyPhoneCode(formData: FormData) {
  const gate = await requireUser();
  if (gate.error || !gate.user) return { ok: false, error: gate.error ?? undefined };

  const code = (formData.get("code") as string)?.trim();
  if (!code || code.length !== 6) {
    return { ok: false, error: "Enter the 6-digit code from your email." };
  }

  const rows = await db
    .select()
    .from(authTokens)
    .where(and(eq(authTokens.userId, gate.user.id), eq(authTokens.type, "phone_verify")));

  const match = rows.find((t) => !t.usedAt && t.expiresAt > new Date() && t.token === code);

  if (!match) {
    return { ok: false, error: "Invalid or expired verification code." };
  }

  await markTokenUsed(match.id);
  await db
    .update(users)
    .set({ phoneVerified: true, updatedAt: new Date() })
    .where(eq(users.id, gate.user.id));

  revalidatePath("/profile");
  return { ok: true, message: "Phone number verified." };
}

export async function deleteAccount(formData: FormData) {
  const gate = await requireUser();
  if (gate.error || !gate.user) return { ok: false, error: gate.error ?? undefined };

  const confirmEmail = (formData.get("confirmEmail") as string)?.trim().toLowerCase();
  const accountEmail = gate.user.email.trim().toLowerCase();

  if (!confirmEmail) {
    return { ok: false, error: "Type your email address to confirm deletion." };
  }

  if (confirmEmail !== accountEmail) {
    return { ok: false, error: "Email does not match your account." };
  }

  if (isUndeletableStaffAccount(accountEmail)) {
    return { ok: false, error: "The site admin account cannot be deleted." };
  }

  await purgeUserCompletely(gate.user.id, gate.user.email);

  redirect("/login?deleted=1");
}

/** Unlink Discord OAuth and clear the handle everywhere (users + roster). */
export async function disconnectDiscord() {
  const gate = await requireUser();
  if (gate.error || !gate.user) return { ok: false, error: gate.error ?? undefined };

  const memberRows = await db
    .select()
    .from(members)
    .where(eq(members.email, gate.user.email))
    .limit(1);

  const hasOAuthLink = !!gate.user.providerAccountId?.trim();
  const hasRosterHandle = !!memberRows[0]?.discord?.trim();

  if (!hasOAuthLink && !hasRosterHandle) {
    return { ok: false, error: "No Discord account is linked." };
  }

  await db
    .update(users)
    .set({
      providerAccountId: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, gate.user.id));

  if (memberRows[0]) {
    await db
      .update(members)
      .set({ discord: null })
      .where(eq(members.id, memberRows[0].id));
  }

  revalidatePath("/profile", "layout");
  revalidatePath("/", "layout");
  return { ok: true, message: "Discord unlinked and removed from your profile." };
}
