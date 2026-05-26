import { LoginForm } from "@/components/auth/LoginForm";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicNav } from "@/components/layout/PublicNav";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;

  if (session) {
    redirect(callbackUrl ?? "/admin");
  }

  return (
    <>
      <PublicNav />
      <main className="flex min-h-[60vh] flex-grow items-center justify-center pb-16 pt-24">
        <div className="glass-card w-full max-w-md rounded-xl p-8">
          <h1 className="text-2xl font-semibold text-on-surface">Member login</h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Sign in with an approved Lodus member account.
          </p>
          <LoginForm callbackUrl={callbackUrl ?? "/admin"} />
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
