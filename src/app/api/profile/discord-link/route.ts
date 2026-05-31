import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) {
    return NextResponse.json({ linked: false }, { status: 200 });
  }

  const user = await db
    .select({
      authProvider: users.authProvider,
      providerAccountId: users.providerAccountId,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const linked = !!user[0]?.providerAccountId?.trim();

  return NextResponse.json({ linked }, { status: 200 });
}

