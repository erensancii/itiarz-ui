import type { ReactNode } from "react";
import { requirePlatformAdmin } from "@/shared/auth/guards";

export default async function Layout({ children }: { children: ReactNode }) {
  await requirePlatformAdmin();
  return children;
}
