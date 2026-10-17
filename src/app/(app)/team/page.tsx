import { listMembers } from "@/features/team/api/team.server";
import { InviteMemberDialog } from "@/features/team/components/InviteMemberDialog";
import { TeamTable } from "@/features/team/components/TeamTable";
import { requirePermission } from "@/shared/auth/guards";
import { can } from "@/shared/auth/model";
import { PageHeader } from "@/shared/components/PageHeader";
import { ProblemAlert } from "@/shared/components/ProblemAlert";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ekip | itiarz" };

export default async function TeamPage() {
  const me = await requirePermission("member:read");
  const canManage = can(me, "member:manage");
  const result = await listMembers();
  return (
    <>
      <PageHeader title="Ekip" actions={canManage && <InviteMemberDialog />} />
      {result.ok ? (
        <TeamTable members={result.data} me={me} canManage={canManage} />
      ) : (
        <ProblemAlert problem={result.problem} context="admin" />
      )}
    </>
  );
}
