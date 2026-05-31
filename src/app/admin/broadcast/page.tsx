import { redirect } from "next/navigation";

export default async function BroadcastPage() {
  redirect("/?tab=broadcast");
}

