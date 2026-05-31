"use server";


import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  getDefaultMemberRoleId,
  getUserWithRole,
  sendVerificationEmail,
  transitionToPendingReview,
} from "@/lib/auth/user-service";
import { isAdminEmail } from "@/lib/auth/staff";
import { isMemberAuthEnabled } from "@/lib/features";
import { purgeOrphanRosterByEmail, purgeUserCompletely } from "@/lib/auth/purge-user";
import { validateGmailForApplication } from "@/lib/validation/email";

export async function submitMemberApplication(data: {
  email: string;
  message: string;
}): Promise<{ ok: boolean; error?: string; redirectToSetup?: boolean; token?: string }> {
  if (!isMemberAuthEnabled()) {
    return { ok: false, error: "Membership applications are not open yet." };
  }

  const email = data.email.trim().toLowerCase();
  const message = data.message.trim();

  if (!email || !message) {
    return { ok: false, error: "Email and reason for joining are required." };
  }
  if (!isAdminEmail(email)) {
    const gmailError = await validateGmailForApplication(email);
    if (gmailError) {
      return { ok: false, error: gmailError };
    }
  }
  if (message.length < 10) {
    return { ok: false, error: "Please write a more detailed reason for joining (at least 10 characters)." };
  }

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing[0]) {
    const user = existing[0];
    if (user.status === "rejected") {
      await purgeUserCompletely(user.id, email);
    } else {
      if (user.status === "approved" && !user.phone?.trim()) {
        return {
          ok: false,
          error: "Your application is approved! Please log in with the temporary password (OTP) sent to your email to complete setup.",
        };
      }
      if (user.status === "applied") {
        return { ok: false, error: "Please check your inbox and verify your email to continue your application." };
      }
      if (user.status === "pending_review") {
        return { ok: false, error: "Your application is verified and pending Owner/Admin approval." };
      }
      return { ok: false, error: "An application or account with this email already exists." };
    }
  } else {
    await purgeOrphanRosterByEmail(email);
  }

  const memberRoleId = await getDefaultMemberRoleId();
  const isStaff = isAdminEmail(email);

  const inserted = await db
    .insert(users)
    .values({
      email,
      passwordHash: null,
      name: null,
      phone: null,
      applicationMessage: message,
      status: isStaff ? "approved" : "applied",
      emailVerified: isStaff,
      roleId: memberRoleId,
      authProvider: "credentials",
    })
    .returning();

  const user = inserted[0];
  if (!user) return { ok: false, error: "Could not submit application." };

  // Pre-verification gate: only the email-ownership challenge is sent now.
  // Admins are notified later, once the applicant verifies (status -> pending_review).
  await sendVerificationEmail(user);

  return { ok: true };
}

export async function completeOAuthProfile(data: {
  email: string;
  phone: string;
  message?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const email = data.email.trim().toLowerCase();
  const phone = data.phone.trim();
  const message = data.message?.trim() ?? "";

  if (!phone || phone.length < 8) {
    return { ok: false, error: "Phone number is required." };
  }

  const record = await getUserWithRole(email);
  if (!record?.user) {
    return { ok: false, error: "Account not found." };
  }

  if (record.user.status === "approved" && record.user.phone) {
    return { ok: true };
  }

  await db
    .update(users)
    .set({
      phone,
      applicationMessage: message || record.user.applicationMessage,
      updatedAt: new Date(),
    })
    .where(eq(users.id, record.user.id));

  const updated = await db.select().from(users).where(eq(users.id, record.user.id)).limit(1);
  const user = updated[0];
  if (!user) return { ok: false, error: "Update failed." };

  if (!user.emailVerified) {
    await sendVerificationEmail(user);
  } else if (user.status === "applied") {
    // OAuth applicants arrive email-verified; once their profile is complete
    // we move them into the review queue and alert the administrator.
    await transitionToPendingReview(user.id);
  }

  return { ok: true };
}
