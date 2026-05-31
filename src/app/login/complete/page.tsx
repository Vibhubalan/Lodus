import { CompleteProfileForm } from "@/components/auth/CompleteProfileForm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function CompleteProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const session = await auth();
  const { email: emailParam } = await searchParams;
  const email = (session?.user?.email ?? emailParam ?? "").toLowerCase();

  if (!email) {
    redirect("/login");
  }

  return <CompleteProfileForm email={email} name={session?.user?.name ?? ""} />;
}
