import { getAdminLoginPath, isMemberAuthEnabled } from "@/lib/features";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth for legacy /admin/* pages is handled per-page or in middleware.
  // Secret login lives at /admin/{ADMIN_LOGIN_SLUG} without requiring a session.
  void isMemberAuthEnabled();
  void getAdminLoginPath();

  return <div className="min-h-screen bg-background">{children}</div>;
}
