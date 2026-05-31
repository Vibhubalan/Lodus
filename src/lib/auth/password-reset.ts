import { randomInt } from "crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { authTokens } from "@/lib/db/schema";

export const PASSWORD_RESET_OTP_TTL_MS = 10 * 60 * 1000;

/** Creates a fresh 6-digit password-reset OTP for the user (replaces any prior code). */
export async function issuePasswordResetOtp(userId: number): Promise<string> {
  const code = String(randomInt(100000, 999999));

  await db
    .delete(authTokens)
    .where(and(eq(authTokens.userId, userId), eq(authTokens.type, "password_reset_otp")));

  await db.insert(authTokens).values({
    userId,
    type: "password_reset_otp",
    token: code,
    expiresAt: new Date(Date.now() + PASSWORD_RESET_OTP_TTL_MS),
  });

  return code;
}
