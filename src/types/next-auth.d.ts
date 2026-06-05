import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roleSlug?: string;
      status?: string;
      needsProfile?: boolean;
      isMainAdmin?: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roleSlug?: string;
    status?: string;
    needsProfile?: boolean;
    isMainAdmin?: boolean;
  }
}

