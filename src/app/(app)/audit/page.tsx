import { getAuditPage } from "@/features/audit/api/audit.server";
import { AuditTable } from "@/features/audit/components/AuditTable";
import { requirePermission } from "@/shared/auth/guards";
import { PageHeader } from "@/shared/components/PageHeader";
import { ProblemAlert } from "@/shared/components/ProblemAlert";
import { parsePaging } from "@/shared/paging";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit | itiarz" };

export default async function AuditRoute({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requirePermission("audit:read");
  const { page, size } = parsePaging(await searchParams);
  const result = await getAuditPage(page, size);
  return (
    <>
      <PageHeader title="Audit" />
      {result.ok ? <AuditTable data={result.data} /> : <ProblemAlert problem={result.problem} />}
    </>
  );
}
