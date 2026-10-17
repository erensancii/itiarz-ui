import Button from "@mui/material/Button";
import NextLink from "next/link";
import { listCases } from "@/features/cases/api/cases.server";
import { CasesTable } from "@/features/cases/components/CasesTable";
import { requirePermission } from "@/shared/auth/guards";
import { can } from "@/shared/auth/model";
import { PageHeader } from "@/shared/components/PageHeader";
import { ProblemAlert } from "@/shared/components/ProblemAlert";

export const dynamic = "force-dynamic";
export const metadata = { title: "İtirazlar | itiarz" };

export default async function CasesPage() {
  const me = await requirePermission("case:read");
  const result = await listCases();
  return (
    <>
      <PageHeader
        title="İtirazlar"
        actions={can(me, "case:write") && <Button component={NextLink} href="/cases/new" variant="contained">Yeni itiraz</Button>}
      />
      {result.ok ? <CasesTable cases={result.data} /> : <ProblemAlert problem={result.problem} />}
    </>
  );
}
