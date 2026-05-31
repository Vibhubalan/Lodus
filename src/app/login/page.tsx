import { AuthGateway } from "@/components/auth/AuthGateway";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; admin?: string; tab?: string }>;
}) {
  const session = await auth();
  const { callbackUrl, admin, tab } = await searchParams;

  if (session) {
    redirect(callbackUrl ?? "/");
  }

  const googleAuthEnabled = !!(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );

  return (
    <AuthGateway
      session={session}
      callbackUrl={callbackUrl ?? "/"}
      googleAuthEnabled={googleAuthEnabled}
      adminError={admin ?? null}
      initialTab={(tab as "signin" | "signup" | "admin") ?? "signin"}
    />
  );
}
