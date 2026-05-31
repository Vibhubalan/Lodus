import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig = {
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: { params: { prompt: "consent" } },
          }),
        ]
      : []),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user?.email) {
        token.email = user.email;
      }
      if (trigger === "update" && session) {
        return { ...token, ...session };
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
      session.user.roleSlug = token.roleSlug as string | undefined;
      session.user.status = token.status as string | undefined;
      session.user.needsProfile = token.needsProfile as boolean | undefined;
      return session;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
