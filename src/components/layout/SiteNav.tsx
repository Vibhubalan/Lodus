import { auth } from "@/lib/auth";
import { AdminNav } from "@/components/layout/AdminNav";
import { PublicNav } from "@/components/layout/PublicNav";

/** Public nav when logged out; member hub tabs when logged in. */
export async function SiteNav({ activeTab = "" }: { activeTab?: string }) {
  const session = await auth();
  if (session) {
    return <AdminNav activeTab={activeTab} />;
  }
  return <PublicNav />;
}
