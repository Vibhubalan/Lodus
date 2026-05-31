import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";
import {
  getAdminLoginPath,
  getAdminLoginSlug,
  isMemberAuthEnabled,
} from "@/lib/features";

const { auth } = NextAuth(authConfig);

const MEMBER_AUTH_PATHS = [
  "/login",
  "/login/complete",
  "/profile",
  "/profile/setup",
  "/library",
  "/games",
];

function isAdminPortalPath(pathname: string): boolean {
  const slug = getAdminLoginSlug();
  return pathname === `/admin/${slug}` || pathname === `/admin/${slug}/`;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const memberAuth = isMemberAuthEnabled();

  if (!memberAuth) {
    if (pathname === "/login") {
      const tab = req.nextUrl.searchParams.get("tab");
      if (tab === "admin") {
        return NextResponse.redirect(new URL(getAdminLoginPath(), req.nextUrl.origin));
      }
      return NextResponse.rewrite(new URL("/404", req.nextUrl.origin));
    }

    if (MEMBER_AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      if (pathname.startsWith("/profile") && isLoggedIn) {
        return NextResponse.redirect(new URL("/", req.nextUrl.origin));
      }
      return NextResponse.rewrite(new URL("/404", req.nextUrl.origin));
    }

    if (isAdminPortalPath(pathname)) {
      return NextResponse.next();
    }

    if (pathname.startsWith("/admin") && !isLoggedIn) {
      return NextResponse.rewrite(new URL("/404", req.nextUrl.origin));
    }
  } else if (pathname.startsWith("/admin") && !isLoggedIn && !isAdminPortalPath(pathname)) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/login",
    "/login/:path*",
    "/profile/:path*",
    "/library/:path*",
    "/games/:path*",
  ],
};
