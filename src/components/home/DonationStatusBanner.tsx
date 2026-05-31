"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function DonationStatusBanner() {
  const searchParams = useSearchParams();
  const donate = searchParams.get("donate");
  const [visible, setVisible] = useState(() => donate === "success" || donate === "cancelled");
  const [prevDonate, setPrevDonate] = useState(donate);

  if (donate !== prevDonate) {
    setPrevDonate(donate);
    if (donate === "success" || donate === "cancelled") {
      setVisible(true);
    }
  }

  if (!visible || !donate) return null;

  const isSuccess = donate === "success";

  return (
    <div
      className={`mb-3 max-w-[152px] rounded-lg border px-3 py-2 text-[10px] leading-snug ${
        isSuccess
          ? "border-[var(--color-status-success)]/30 bg-[var(--color-status-success-bg)] text-[var(--color-status-success)]"
          : "border-white/10 bg-white/5 text-on-surface-variant"
      }`}
      role="status"
    >
      {isSuccess
        ? "Thank you for supporting Lodus!"
        : "Donation cancelled — no charge was made."}
      <button
        type="button"
        className="ml-3 text-xs underline opacity-80"
        onClick={() => setVisible(false)}
      >
        Dismiss
      </button>
    </div>
  );
}
