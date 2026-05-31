import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function POST() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = session.user.email.toLowerCase();
  await db
    .update(users)
    .set({ lastSeenAt: new Date(), updatedAt: new Date() })
    .where(eq(users.email, email));

  return NextResponse.json({ ok: true });
}
