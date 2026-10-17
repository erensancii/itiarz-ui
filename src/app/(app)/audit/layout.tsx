import type { ReactNode } from "react";
import { requirePermission } from "@/shared/auth/guards";

export default async function Layout({ children }: { children: ReactNode }) {
  await requirePermission("audit:read");
  return children;
}
