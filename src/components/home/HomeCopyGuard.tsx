import type { ReactNode } from "react";
import { NoCopyGuard } from "@/components/layout/NoCopyGuard";

export function HomeCopyGuard({ children }: { children: ReactNode }) {
  return <NoCopyGuard>{children}</NoCopyGuard>;
}
