import { getCase, listAssignableMembers } from "@/features/cases/api/cases.server";
import { CaseDetailView } from "@/features/cases/components/CaseDetailView";
import { requirePermission } from "@/shared/auth/guards";
import { PageHeader } from "@/shared/components/PageHeader";
import { ProblemAlert } from "@/shared/components/ProblemAlert";

export const dynamic = "force-dynamic";
export const metadata = { title: "İtiraz dosyası | itiarz" };

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requirePermission("case:read");
  const result = await getCase(id);
  if (!result.ok) {
    return (
      <>
        <PageHeader title="İtiraz dosyası" breadcrumbs={[{ label: "İtirazlar", href: "/cases" }]} />
        <ProblemAlert problem={result.problem} />
      </>
    );
  }
  const c = result.data;
  // Sequential on purpose (after /api/me and the case); a failure only hides the member picker.
  const members = await listAssignableMembers(me);
  return (
    <>
      <PageHeader title={c.providerCaseId} breadcrumbs={[{ label: "İtirazlar", href: "/cases" }, { label: c.providerCaseId }]} />
      <CaseDetailView c={c} me={me} members={members.map((m) => ({ userId: m.userId, email: m.email, displayName: m.displayName }))} />
    </>
  );
}
