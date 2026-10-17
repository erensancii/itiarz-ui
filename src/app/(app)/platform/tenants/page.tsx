import { listTenants } from "@/features/platform/api/platform.server";
import { CreateTenantDialog } from "@/features/platform/components/CreateTenantDialog";
import { TenantsTable } from "@/features/platform/components/TenantsTable";
import { requirePlatformAdmin } from "@/shared/auth/guards";
import { PageHeader } from "@/shared/components/PageHeader";
import { ProblemAlert } from "@/shared/components/ProblemAlert";

export const dynamic = "force-dynamic";
export const metadata = { title: "Şirketler | itiarz" };

export default async function PlatformTenantsPage() {
  await requirePlatformAdmin();
  const result = await listTenants();
  return (
    <>
      <PageHeader title="Şirketler" breadcrumbs={[{ label: "Platform" }, { label: "Şirketler" }]} actions={<CreateTenantDialog />} />
      {result.ok ? <TenantsTable tenants={result.data} /> : <ProblemAlert problem={result.problem} context="admin" />}
    </>
  );
}
