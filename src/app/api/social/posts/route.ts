import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { socialPosts, users } from "@/lib/db/schema";
import { isAdminEmail } from "@/lib/auth/staff";

export const dynamic = "force-dynamic";

function roleLabel(email: string | null) {
  if (!email) return "member";
  if (isAdminEmail(email)) return "admin";
  return "member";
}

export async function GET() {
  const rows = await db
    .select({
      id: socialPosts.id,
      content: socialPosts.content,
      createdAt: socialPosts.createdAt,
      authorName: users.name,
      authorEmail: users.email,
      authorAvatar: users.avatarUrl,
    })
    .from(socialPosts)
    .innerJoin(users, eq(users.id, socialPosts.authorUserId))
    .orderBy(desc(socialPosts.createdAt))
    .limit(60);

  const data = rows.map((row) => ({
    id: row.id,
    content: row.content,
    createdAt: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString(),
    author: {
      name: row.authorName ?? row.authorEmail.split("@")[0],
      email: row.authorEmail,
      avatarUrl: row.authorAvatar,
      role: roleLabel(row.authorEmail),
    },
  }));

  return NextResponse.json(data, { status: 200 });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { content?: string } | null;
  const content = body?.content?.trim() ?? "";
  if (!content) {
    return NextResponse.json({ error: "Post content is required." }, { status: 400 });
  }
  if (content.length > 1200) {
    return NextResponse.json({ error: "Post is too long." }, { status: 400 });
  }

  const author = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, session.user.email.toLowerCase()))
    .limit(1);
  if (!author[0]) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  await db.insert(socialPosts).values({
    authorUserId: author[0].id,
    content,
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}

