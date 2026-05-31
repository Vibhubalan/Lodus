import { NextResponse } from "next/server";
import {
  consumeToken,
  markTokenUsed,
  transitionToPendingReview,
  verifyUserEmail,
} from "@/lib/auth/user-service";
import { getBaseUrl } from "@/lib/email/send";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  const base = getBaseUrl();

  if (!token) {
    return NextResponse.redirect(`${base}/login?error=missing_token`);
  }

  const row = await consumeToken(token, "email_verify");
  if (!row) {
    return NextResponse.redirect(`${base}/login?error=invalid_token`);
  }

  await markTokenUsed(row.id);
  await verifyUserEmail(row.userId);

  // Email ownership confirmed -> enter the review queue and alert the admin.
  await transitionToPendingReview(row.userId);

  return NextResponse.redirect(`${base}/login?verified=1`);
}
