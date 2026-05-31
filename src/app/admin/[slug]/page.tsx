import { AuthGateway } from "@/components/auth/AuthGateway";
import { getAdminLoginSlug } from "@/lib/features";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";

export default async function AdminPortalLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ admin?: string; callbackUrl?: string }>;
}) {
  const { slug } = await params;
  if (slug !== getAdminLoginSlug()) {
    notFound();
  }

  const session = await auth();
  const { admin, callbackUrl } = await searchParams;

  if (session) {
    redirect(callbackUrl ?? "/?tab=site");
  }

  const googleAuthEnabled = !!(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );

  return (
    <AuthGateway
      session={session}
      callbackUrl={callbackUrl ?? "/?tab=site"}
      googleAuthEnabled={googleAuthEnabled}
      adminError={admin ?? null}
      mode="admin-only"
    />
  );
}
