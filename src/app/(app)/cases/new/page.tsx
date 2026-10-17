import { NewCaseForm } from "@/features/cases/components/NewCaseForm";
import { requirePermission } from "@/shared/auth/guards";
import { PageHeader } from "@/shared/components/PageHeader";

export const dynamic = "force-dynamic";
export const metadata = { title: "Yeni itiraz | itiarz" };

export default async function NewCasePage() {
  await requirePermission("case:write");
  return (
    <>
      <PageHeader title="Yeni itiraz" breadcrumbs={[{ label: "İtirazlar", href: "/cases" }, { label: "Yeni itiraz" }]} />
      <NewCaseForm />
    </>
  );
}
