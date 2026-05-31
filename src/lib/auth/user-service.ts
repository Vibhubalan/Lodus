import { randomBytes } from "crypto";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLogs, authTokens, roles, users, type User } from "@/lib/db/schema";
import bcrypt from "bcryptjs";
import {
  adminApprovalAlertEmailContent,
  applicationResultEmailContent,
  getBaseUrl,
  otpApprovalEmailContent,
  sendEmail,
  verificationEmailContent,
} from "@/lib/email/send";
import { getApprovalRecipientEmails, isAdminEmail } from "@/lib/auth/staff";
import { buildSignedApprovalToken } from "@/lib/auth/approval-token";

export type ApprovalChannel = "dashboard" | "email";

export type ApproveResult =
  | { ok: true; user: User; otp: string }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "already_approved"; channel: ApprovalChannel | null };

const TOKEN_TTL_HOURS = 24;

function newToken() {
  return randomBytes(32).toString("hex");
}

function expiresInHours(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export async function getUserWithRole(email: string) {
  const row = await db
    .select({
      user: users,
      role: roles,
    })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return row[0] ?? null;
}

export async function getDefaultMemberRoleId() {
  const row = await db.select().from(roles).where(eq(roles.slug, "member")).limit(1);
  return row[0]?.id ?? null;
}

export async function logAudit(
  actorEmail: string,
  action: string,
  targetUserId?: number,
  metadata?: Record<string, unknown>,
  channel?: ApprovalChannel,
) {
  await db.insert(auditLogs).values({
    actorEmail: actorEmail.toLowerCase(),
    action,
    targetUserId: targetUserId ?? null,
    channel: channel ?? null,
    metadata: metadata ? JSON.stringify(metadata) : null,
  });
}

export async function createAuthToken(
  userId: number,
  type: "email_verify" | "approve" | "reject" | "setup_profile" | "phone_verify",
) {
  const token = newToken();
  await db.insert(authTokens).values({
    userId,
    type,
    token,
    expiresAt: expiresInHours(TOKEN_TTL_HOURS),
  });
  return token;
}

export async function sendVerificationEmail(user: User) {
  const token = await createAuthToken(user.id, "email_verify");
  const url = `${getBaseUrl()}/api/auth/verify-email?token=${token}`;
  const verifyMail = verificationEmailContent(url, user.name ?? "there");
  await sendEmail({
    to: user.email,
    subject: "Verify your Lodus account",
    html: verifyMail.html,
    text: verifyMail.text,
  });
}

/**
 * Admin Alert Dispatcher — fired the moment an applicant enters `pending_review`.
 * Emails the system administrator the full applicant details plus a
 * cryptographically signed, single-use, time-decay direct-approval link
 * (Channel 2) and a link to the dashboard review panel (Channel 1).
 */
export async function dispatchAdminApprovalAlert(user: User) {
  const rawToken = await createAuthToken(user.id, "approve");
  const signedToken = buildSignedApprovalToken(user.id, rawToken);
  const base = getBaseUrl();
  const directApproveUrl = `${base}/api/admin/direct-approve?token=${encodeURIComponent(
    signedToken,
  )}&userId=${user.id}`;
  const dashboardUrl = `${base}/admin/approvals`;

  const alertMail = adminApprovalAlertEmailContent({
    applicantName: user.name ?? user.email,
    applicantEmail: user.email,
    phone: user.phone ?? "—",
    message: user.applicationMessage ?? "",
    directApproveUrl,
    dashboardUrl,
  });
  await sendEmail({
    to: getApprovalRecipientEmails(),
    subject: `New application ready for review: ${user.name ?? user.email}`,
    html: alertMail.html,
    text: alertMail.text,
  });
}

/**
 * Atomically move an applicant from `applied` -> `pending_review` and fire the
 * admin alert. Safe to call repeatedly: the guarded update only matches an
 * applicant who has not already progressed, so the alert is dispatched once.
 */
export async function transitionToPendingReview(userId: number) {
  const moved = await db
    .update(users)
    .set({ status: "pending_review", updatedAt: new Date() })
    .where(and(eq(users.id, userId), eq(users.status, "applied")))
    .returning();

  if (moved[0]) {
    await dispatchAdminApprovalAlert(moved[0]);
    return moved[0];
  }

  const current = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return current[0] ?? null;
}

export function canUserLogin(user: User, _roleSlug?: string | null): { ok: boolean; reason?: string } {
  if (isAdminEmail(user.email)) return { ok: true };

  if (user.status === "invited") {
    return { ok: false, reason: "This profile has not been activated yet." };
  }
  if (user.status === "rejected") {
    return { ok: false, reason: "Your member application was rejected." };
  }
  if (user.status === "applied" || !user.emailVerified) {
    return { ok: false, reason: "Please verify your email before logging in." };
  }
  if (user.status !== "approved") {
    return { ok: false, reason: "Your application is pending Owner/Admin approval." };
  }
  return { ok: true };
}

export async function consumeToken(token: string, expectedType: "email_verify" | "approve" | "reject" | "setup_profile") {
  const rows = await db
    .select()
    .from(authTokens)
    .where(
      and(
        eq(authTokens.token, token),
        eq(authTokens.type, expectedType),
        isNull(authTokens.usedAt),
        gt(authTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function markTokenUsed(tokenId: number) {
  await db.update(authTokens).set({ usedAt: new Date() }).where(eq(authTokens.id, tokenId));
}

export async function verifyUserEmail(userId: number) {
  await db
    .update(users)
    .set({ emailVerified: true, updatedAt: new Date() })
    .where(eq(users.id, userId));
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user[0];
}

function generateOTP(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `LDS-${code}`;
}

/**
 * Approve an applicant through a specific channel (`dashboard` or `email`).
 *
 * Uses an atomic compare-and-swap (`UPDATE ... WHERE status='pending_review'
 * RETURNING`) so two concurrent approvals (one per channel) can never both
 * win — exactly one transition succeeds, the other reports `already_approved`.
 * The winning transition records `approvedAt` + `approvedByChannel`, writes a
 * channel-tagged audit row, and dispatches the welcome OTP email.
 */
export async function approveUser(
  userId: number,
  actorEmail: string,
  channel: ApprovalChannel,
): Promise<ApproveResult> {
  const existing = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const current = existing[0];
  if (!current) return { ok: false, reason: "not_found" };
  if (current.status === "approved") {
    return { ok: false, reason: "already_approved", channel: current.approvedByChannel };
  }

  const memberRoleId = await getDefaultMemberRoleId();
  const otp = generateOTP();
  const passwordHash = await bcrypt.hash(otp, 12);
  const approvedAt = new Date();

  const claimed = await db
    .update(users)
    .set({
      status: "approved",
      emailVerified: true,
      roleId: memberRoleId,
      passwordHash,
      approvedAt,
      approvedByChannel: channel,
      updatedAt: approvedAt,
    })
    .where(and(eq(users.id, userId), eq(users.status, "pending_review")))
    .returning();

  const u = claimed[0];
  if (!u) {
    // Lost the race — re-read to report who actually won.
    const after = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const winner = after[0];
    if (winner?.status === "approved") {
      return { ok: false, reason: "already_approved", channel: winner.approvedByChannel };
    }
    return { ok: false, reason: "not_found" };
  }

  await logAudit(
    actorEmail,
    "USER_APPROVAL",
    userId,
    { email: u.email, approvedAt: approvedAt.toISOString() },
    channel,
  );

  const loginUrl = `${getBaseUrl()}/login`;
  const welcomeMail = otpApprovalEmailContent(otp, loginUrl, u.name ?? "Member", u.email);
  await sendEmail({
    to: u.email,
    subject: "Your Lodus membership was approved",
    html: welcomeMail.html,
    text: welcomeMail.text,
  });

  return { ok: true, user: u, otp };
}

export async function rejectUser(userId: number, actorEmail: string) {
  await db
    .update(users)
    .set({ status: "rejected", updatedAt: new Date() })
    .where(eq(users.id, userId));

  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const u = user[0];
  if (u) {
    await logAudit(actorEmail, "member.rejected", userId, { email: u.email });
    const rejectedMail = applicationResultEmailContent(false, u.name ?? "Applicant");
    await sendEmail({
      to: u.email,
      subject: "Update on your Lodus application",
      html: rejectedMail.html,
      text: rejectedMail.text,
    });
  }
  return u;
}

export async function listPendingApplications() {
  return db
    .select({
      user: users,
      role: roles,
    })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.status, "pending_review"))
    .orderBy(desc(users.createdAt));
}

export async function listAuditLogs(limit = 50) {
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
}

export async function verifyOTP(userId: number, code: string): Promise<boolean> {
  const now = new Date();
  const rows = await db
    .select()
    .from(authTokens)
    .where(and(
      eq(authTokens.userId, userId),
      eq(authTokens.type, "password_reset_otp"),
      isNull(authTokens.usedAt)
    ));

  const match = rows.find((t) => t.expiresAt > now && t.token === code);
  if (!match) return false;

  await db
    .update(authTokens)
    .set({ usedAt: now })
    .where(eq(authTokens.id, match.id));

  return true;
}
