import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { authConfig } from "./auth.config";
import { db } from "./db";
import { roles, users } from "./db/schema";
import {
  canUserLogin,
  getDefaultMemberRoleId,
  getUserWithRole,
  transitionToPendingReview,
} from "./auth/user-service";
import { canAdminSignInWithGmail, isAdminEmail } from "@/lib/auth/staff";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      id: "credentials",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string)?.toLowerCase()?.trim();
        const password = credentials?.password as string;
        if (!email || !password) return null;

        const record = await getUserWithRole(email);
        if (!record?.user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, record.user.passwordHash);
        if (!valid) return null;

        const gate = canUserLogin(record.user, record.role?.slug);
        if (!gate.ok) {
          throw new Error(gate.reason ?? "Login not allowed");
        }

        return {
          id: String(record.user.id),
          email: record.user.email,
          name: record.user.name ?? email.split("@")[0],
          image: record.user.avatarUrl ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      const email = user.email?.toLowerCase();
      if (!email) return false;

      if (account?.provider === "credentials") {
        const record = await getUserWithRole(email);
        if (!record?.user) return false;
        const gate = canUserLogin(record.user, record.role?.slug);
        return gate.ok;
      }

      const jar = await cookies();
      const adminOAuth = jar.get("lodus_admin_oauth")?.value === "1";

      if (adminOAuth && account?.provider === "google") {
        jar.delete("lodus_admin_oauth");
        if (!canAdminSignInWithGmail(email)) {
          return "/login?admin=denied";
        }

        const oauthProfile = profile as { picture?: string; image_url?: string };
        const avatarUrl = user.image ?? oauthProfile?.picture ?? oauthProfile?.image_url ?? null;
        const providerAccountId = account.providerAccountId ?? null;

        let record = await getUserWithRole(email);
        if (!record?.user) {
          const roleRow = await db.select().from(roles).where(eq(roles.slug, "admin")).limit(1);
          const memberRoleId = await getDefaultMemberRoleId();
          const inserted = await db
            .insert(users)
            .values({
              email,
              passwordHash: await bcrypt.hash(`oauth-staff-${email}-${Date.now()}`, 12),
              name: user.name ?? email.split("@")[0],
              avatarUrl,
              status: "approved",
              emailVerified: true,
              roleId: roleRow[0]?.id ?? memberRoleId,
              authProvider: "google",
              providerAccountId,
            })
            .returning();
          if (inserted[0]) {
            record = { user: inserted[0], role: roleRow[0] ?? null };
          }
        } else {
          const roleRow = await db.select().from(roles).where(eq(roles.slug, "admin")).limit(1);
          await db
            .update(users)
            .set({
              name: user.name ?? record.user.name,
              avatarUrl: avatarUrl ?? record.user.avatarUrl,
              authProvider: "google",
              providerAccountId: providerAccountId ?? record.user.providerAccountId,
              emailVerified: true,
              status: "approved",
              roleId: roleRow[0]?.id ?? record.user.roleId,
              updatedAt: new Date(),
            })
            .where(eq(users.id, record.user.id));
          record = (await getUserWithRole(email)) ?? record;
        }

        if (!record?.user) return "/login?admin=denied";

        const gate = canUserLogin(record.user, record.role?.slug);
        if (!gate.ok) return "/login?admin=denied";

        return true;
      }

      if (adminOAuth) {
        jar.delete("lodus_admin_oauth");
        return "/login?admin=gmail-only";
      }

      const oauthProfile = profile as {
        picture?: string;
        image_url?: string;
        phone?: string;
      };
      const avatarUrl = user.image ?? oauthProfile?.picture ?? oauthProfile?.image_url ?? null;
      const provider = "google";
      const providerAccountId = account?.providerAccountId ?? null;

      let record = await getUserWithRole(email);
      const memberRoleId = await getDefaultMemberRoleId();
      const staff = isAdminEmail(email);

      if (!record?.user) {
        const inserted = await db
          .insert(users)
          .values({
            email,
            passwordHash: await bcrypt.hash(`oauth-${email}-${Date.now()}`, 12),
            name: user.name ?? email.split("@")[0],
            phone: oauthProfile?.phone ?? null,
            avatarUrl,
            status: staff ? "approved" : "applied",
            emailVerified: true,
            roleId: memberRoleId,
            authProvider: provider,
            providerAccountId,
            applicationMessage: "",
          })
          .returning();
        if (inserted[0]) {
          record = { user: inserted[0], role: null };
        }

        if (record?.user && !staff) {
          if (!record.user.phone) {
            return `/login/complete?email=${encodeURIComponent(email)}`;
          }
          // Email is provider-verified; move straight into the review queue.
          await transitionToPendingReview(record.user.id);
          record = (await getUserWithRole(email)) ?? record;
        }
      } else {
        await db
          .update(users)
          .set({
            name: user.name ?? record.user.name,
            avatarUrl: avatarUrl ?? record.user.avatarUrl,
            authProvider: provider,
            providerAccountId: providerAccountId ?? record.user.providerAccountId,
            updatedAt: new Date(),
          })
          .where(eq(users.id, record.user.id));

        record = (await getUserWithRole(email)) ?? record;
      }

      if (!record?.user) return false;

      if (!record.user.phone?.trim() && !staff) {
        return `/login/complete?email=${encodeURIComponent(email)}`;
      }

      const gate = canUserLogin(record.user, record.role?.slug);
      if (!gate.ok) {
        return gate.reason?.includes("pending")
          ? `/login?pending=1`
          : gate.reason?.includes("verify")
            ? `/login?verify=1`
            : false;
      }

      return true;
    },
    async jwt({ token, user, account }) {
      const email = (user?.email ?? token.email)?.toLowerCase();
      if (!email) return token;

      const record = await getUserWithRole(email);
      if (record?.user) {
        token.sub = String(record.user.id);
        token.roleSlug = record.role?.slug;
        token.status = record.user.status;
        token.needsProfile =
          !isAdminEmail(email) &&
          (!record.user.phone?.trim() ||
            !record.user.birthdate?.trim() ||
            !record.user.hasCustomPassword);
      }

      if (account && user) {
        token.email = email;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email as string;
      }
      if (token.sub) {
        session.user.id = token.sub;
      }

      const email = (token.email as string | undefined)?.toLowerCase();
      if (email) {
        const record = await getUserWithRole(email);
        if (record?.user) {
          session.user.roleSlug = record.role?.slug;
          session.user.status = record.user.status;
          session.user.needsProfile =
            !isAdminEmail(email) &&
            (!record.user.phone?.trim() ||
              !record.user.birthdate?.trim() ||
              !record.user.hasCustomPassword);
        } else {
          session.user.roleSlug = token.roleSlug as string | undefined;
          session.user.status = token.status as string | undefined;
          session.user.needsProfile = token.needsProfile as boolean | undefined;
        }
      }

      return session;
    },
  },
});

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireStaff() {
  const session = await requireAuth();
  const email = session.user.email ?? "";
  if (
    !isAdminEmail(email) &&
    session.user.roleSlug !== "admin" &&
    session.user.roleSlug !== "owner"
  ) {
    throw new Error("Forbidden");
  }
  return session;
}
