import { NextResponse } from "next/server";
import {
  approveUser,
  consumeToken,
  markTokenUsed,
  rejectUser,
} from "@/lib/auth/user-service";
import { getBaseUrl } from "@/lib/email/send";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const action = url.searchParams.get("action");
  const base = getBaseUrl();

  if (!token || (action !== "approve" && action !== "reject")) {
    return NextResponse.redirect(`${base}/login?error=invalid_decision`);
  }

  const row = await consumeToken(token, action);
  if (!row) {
    return NextResponse.redirect(`${base}/login?error=expired_token`);
  }

  await markTokenUsed(row.id);
  const actor = "email-link@lodus";

  if (action === "approve") {
    await approveUser(row.userId, actor, "email");
    return NextResponse.redirect(`${base}/login?approved=1`);
  }

  await rejectUser(row.userId, actor);
  return NextResponse.redirect(`${base}/login?rejected=1`);
}
