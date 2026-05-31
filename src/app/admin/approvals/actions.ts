"use server";

import { auth } from "@/lib/auth";
import { canApproveMembers } from "@/lib/auth/staff";
import { approveUser } from "@/lib/auth/user-service";
import { revalidatePath } from "next/cache";

export type ApproveActionResult = { ok: boolean; message: string };

/**
 * Channel 1 (Admin Dashboard) approval.
 * Authorization + an atomic compare-and-swap inside `approveUser` guarantee a
 * single winner across both channels and prevent double-approval races.
 */
export async function approveMemberAction(userId: number): Promise<ApproveActionResult> {
  const session = await auth();
  const email = session?.user?.email ?? "";
  if (!canApproveMembers(email, session?.user?.roleSlug)) {
    return { ok: false, message: "You are not authorized to approve members." };
  }
  if (!Number.isInteger(userId) || userId <= 0) {
    return { ok: false, message: "Invalid applicant." };
  }

  const result = await approveUser(userId, email, "dashboard");

  revalidatePath("/admin/approvals");
  revalidatePath("/");
  revalidatePath("/?tab=approvals");

  if (result.ok) {
    return { ok: true, message: "Member approved — welcome email with temporary password sent." };
  }
  if (result.reason === "already_approved") {
    return {
      ok: false,
      message:
        result.channel === "email"
          ? "This application was already approved via the secure email link."
          : "This application has already been approved.",
    };
  }
  return { ok: false, message: "Applicant not found." };
}
