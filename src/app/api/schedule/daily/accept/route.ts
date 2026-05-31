import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { dailyPlanAcceptances, dailyPlans, users } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

function getTodayKey() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function POST(req: Request) {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  const userId = user[0]?.id;
  if (!userId) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as { planId?: number } | null;
  const planId = Number(body?.planId ?? 0);
  if (!planId) {
    return NextResponse.json({ error: "Plan id is required." }, { status: 400 });
  }

  const today = getTodayKey();
  const plan = await db
    .select()
    .from(dailyPlans)
    .where(and(eq(dailyPlans.id, planId), eq(dailyPlans.planDate, today)))
    .limit(1);
  if (!plan[0]) {
    return NextResponse.json({ error: "Plan not found for today." }, { status: 404 });
  }

  const existing = await db
    .select()
    .from(dailyPlanAcceptances)
    .where(and(eq(dailyPlanAcceptances.userId, userId), eq(dailyPlanAcceptances.planDate, today)))
    .limit(1);

  if (!existing[0]) {
    await db.insert(dailyPlanAcceptances).values({
      dailyPlanId: planId,
      userId,
      planDate: today,
    });
  } else if (existing[0].dailyPlanId !== planId) {
    await db
      .update(dailyPlanAcceptances)
      .set({ dailyPlanId: planId, acceptedAt: new Date() })
      .where(eq(dailyPlanAcceptances.id, existing[0].id));
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

