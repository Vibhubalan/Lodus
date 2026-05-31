import { redirect } from "next/navigation";

export default async function LeaderboardPage() {
  redirect("/?tab=leaderboard");
}

