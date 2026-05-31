import { db } from "@/lib/db";
import { authTokens, games, users } from "@/lib/db/schema";
import { and, asc, eq, gt, isNull } from "drizzle-orm";
import { ProfileSetupForm } from "./ProfileSetupForm";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/auth/staff";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function ProfileSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const session = await auth();

  if (session?.user?.email && isAdminEmail(session.user.email)) {
    redirect("/");
  }

  let isValid = false;
  let userEmail = "";

  if (session?.user?.email && session.user.needsProfile) {
    isValid = true;
    userEmail = session.user.email;
  } else if (token) {
    // 1. Select token details from DB
    const tokenList = await db
      .select()
      .from(authTokens)
      .where(
        and(
          eq(authTokens.token, token),
          eq(authTokens.type, "setup_profile"),
          isNull(authTokens.usedAt),
          gt(authTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    const tokenRecord = tokenList[0];

    if (tokenRecord) {
      // 2. Fetch associated user email
      const userList = await db
        .select()
        .from(users)
        .where(eq(users.id, tokenRecord.userId))
        .limit(1);
      const userRecord = userList[0];
      if (userRecord) {
        isValid = true;
        userEmail = userRecord.email;
      }
    }
  }

  const allGames = await db.select().from(games).orderBy(asc(games.sortOrder));
  const gameNames = allGames.map((g) => g.name);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0B0B0F] px-4 py-16">
      {/* Immersive Crimson Glow */}
      <div 
        className="pointer-events-none absolute left-0 right-0 top-0 h-[50vh] opacity-80"
        style={{
          backgroundImage: "radial-gradient(circle at 50% 0%, rgba(239, 68, 68, 0.12) 0%, transparent 60%)",
        }}
      />

      {/* Brand Header */}
      <header className="absolute left-6 top-6 z-10 md:left-16 lg:left-24">
        <Link
          href="/"
          className="font-tech text-3xl font-bold tracking-widest text-[#ece8ea] hover:opacity-85 transition-opacity duration-200"
        >
          Lodus
        </Link>
      </header>

      <div className="relative z-10 w-full max-w-lg">
        {isValid ? (
          <ProfileSetupForm token={token ?? ""} email={userEmail} gameNames={gameNames} />
        ) : (
          <div className="relative overflow-hidden rounded-2xl border border-red-950/80 bg-[#0d1118]/85 p-8 shadow-[0_0_50px_rgba(239,68,68,0.15)] backdrop-blur-xl text-center space-y-6">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
            
            <div className="mx-auto rounded-full bg-red-950/60 p-3 text-red-500 w-16 h-16 flex items-center justify-center ring-2 ring-red-500/25">
              <AlertCircle className="h-8 w-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h2 className="font-tech text-2xl tracking-wider text-red-400 uppercase">
                Access Denied or Link Expired
              </h2>
              <p className="font-mono text-[10px] text-on-surface-variant/80 uppercase tracking-wide leading-relaxed max-w-xs mx-auto">
                Please log in with the temporary password (OTP) sent to your email to complete your registration.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/login"
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-white/5 bg-[#121620]/60 hover:bg-[#121620]/90 py-3 text-xs font-semibold uppercase tracking-wider text-[#ece8ea] transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4" />
                Go to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
