import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { requireMe } from "@/shared/api/backend.server";
import { AppShell } from "@/shared/components/AppShell/AppShell";
import { CenteredPage } from "@/shared/components/CenteredPage";
import { ProblemAlert } from "@/shared/components/ProblemAlert";

export const dynamic = "force-dynamic";

/** Signed-in area: resolves /api/me once, then renders the shell. Sections add their own permission guard. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const result = await requireMe();
  if (!result.ok) {
    return (
      <CenteredPage>
        <ProblemAlert problem={result.problem} />
      </CenteredPage>
    );
  }
  const me = result.me;
  if (!me.activeTenant && !me.platformAdmin) redirect("/select-tenant");
  return <AppShell me={me}>{children}</AppShell>;
}
