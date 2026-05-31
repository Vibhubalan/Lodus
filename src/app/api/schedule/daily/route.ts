import { NextResponse } from "next/server";
import { and, asc, count, eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { canAccessAdminHub } from "@/lib/auth/staff";
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

type DailyPlanPayload = {
  title?: string;
  meetingDate?: string | null;
  meetingTime?: string | null;
  place?: string | null;
  notes?: string | null;
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = getTodayKey();
  const email = session.user.email.toLowerCase();
  const isStaff = canAccessAdminHub(email, session.user.roleSlug);

  const plans = await db
    .select({
      id: dailyPlans.id,
      title: dailyPlans.title,
      meetingDate: dailyPlans.meetingDate,
      meetingTime: dailyPlans.meetingTime,
      place: dailyPlans.place,
      notes: dailyPlans.notes,
      planDate: dailyPlans.planDate,
      createdAt: dailyPlans.createdAt,
      updatedAt: dailyPlans.updatedAt,
      setByUserId: dailyPlans.setByUserId,
      setByName: users.name,
      setByEmail: users.email,
    })
    .from(dailyPlans)
    .innerJoin(users, eq(users.id, dailyPlans.setByUserId))
    .where(eq(dailyPlans.planDate, today))
    .orderBy(asc(dailyPlans.createdAt));

  const user = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  const userId = user[0]?.id ?? null;

  const planIds = plans.map((p) => p.id);
  const acceptCounts = planIds.length
    ? await db
        .select({
          dailyPlanId: dailyPlanAcceptances.dailyPlanId,
          total: count(dailyPlanAcceptances.id),
        })
        .from(dailyPlanAcceptances)
        .where(inArray(dailyPlanAcceptances.dailyPlanId, planIds))
        .groupBy(dailyPlanAcceptances.dailyPlanId)
    : [];
  const countMap = new Map(acceptCounts.map((row) => [row.dailyPlanId, row.total]));

  const acceptedByMe = userId
    ? await db
        .select({
          dailyPlanId: dailyPlanAcceptances.dailyPlanId,
        })
        .from(dailyPlanAcceptances)
        .where(
          and(eq(dailyPlanAcceptances.userId, userId), eq(dailyPlanAcceptances.planDate, today)),
        )
        .limit(1)
    : [];
  const acceptedPlanId = acceptedByMe[0]?.dailyPlanId ?? null;

  const myCreatedCount = userId
    ? await db
        .select({ total: count(dailyPlans.id) })
        .from(dailyPlans)
        .where(and(eq(dailyPlans.planDate, today), eq(dailyPlans.setByUserId, userId)))
    : [{ total: 0 }];

  return NextResponse.json(
    {
      today,
      isStaff,
      canCreatePlan: isStaff && (myCreatedCount[0]?.total ?? 0) < 3,
      createdTodayByMe: myCreatedCount[0]?.total ?? 0,
      plans: plans.map((plan) => ({
        id: plan.id,
        title: plan.title,
        meetingDate: plan.meetingDate,
        meetingTime: plan.meetingTime,
        place: plan.place,
        notes: plan.notes,
        createdAt: plan.createdAt?.toISOString() ?? null,
        updatedAt: plan.updatedAt?.toISOString() ?? null,
        setByName: plan.setByName ?? plan.setByEmail.split("@")[0],
        setByEmail: plan.setByEmail,
        acceptCount: countMap.get(plan.id) ?? 0,
        acceptedByMe: acceptedPlanId === plan.id,
      })),
    },
    { status: 200 },
  );
}

export async function POST(req: Request) {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!session || !email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canAccessAdminHub(email, session.user.roleSlug)) {
    return NextResponse.json({ error: "Only owner/admin can create plans." }, { status: 403 });
  }

  const user = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  const userId = user[0]?.id;
  if (!userId) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const today = getTodayKey();
  const existing = await db
    .select({ total: count(dailyPlans.id) })
    .from(dailyPlans)
    .where(and(eq(dailyPlans.planDate, today), eq(dailyPlans.setByUserId, userId)));
  if ((existing[0]?.total ?? 0) >= 3) {
    return NextResponse.json(
      { error: "You can only create up to 3 plans per day." },
      { status: 429 },
    );
  }

  const body = (await req.json().catch(() => null)) as DailyPlanPayload | null;
  const title = body?.title?.trim() ?? "";
  if (!title) {
    return NextResponse.json({ error: "Plan title is required." }, { status: 400 });
  }

  await db.insert(dailyPlans).values({
    planDate: today,
    title,
    meetingDate: body?.meetingDate?.trim() || null,
    meetingTime: body?.meetingTime?.trim() || null,
    place: body?.place?.trim() || null,
    notes: body?.notes?.trim() || null,
    setByUserId: userId,
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function PATCH(req: Request) {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!session || !email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canAccessAdminHub(email, session.user.roleSlug)) {
    return NextResponse.json({ error: "Only owner/admin can update plans." }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as (DailyPlanPayload & { id?: number }) | null;
  const id = Number(body?.id ?? 0);
  if (!id) {
    return NextResponse.json({ error: "Plan id is required." }, { status: 400 });
  }

  const title = body?.title?.trim() ?? "";
  if (!title) {
    return NextResponse.json({ error: "Plan title is required." }, { status: 400 });
  }

  const existing = await db.select().from(dailyPlans).where(eq(dailyPlans.id, id)).limit(1);
  if (!existing[0]) {
    return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  }

  await db
    .update(dailyPlans)
    .set({
      title,
      meetingDate: body?.meetingDate?.trim() || null,
      meetingTime: body?.meetingTime?.trim() || null,
      place: body?.place?.trim() || null,
      notes: body?.notes?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(dailyPlans.id, id));

  await db.delete(dailyPlanAcceptances).where(eq(dailyPlanAcceptances.dailyPlanId, id));

  return NextResponse.json({ ok: true }, { status: 200 });
}

