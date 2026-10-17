import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { autoSwitchTarget } from "@/shared/auth/model";
import { requireMe } from "@/shared/api/backend.server";
import { CenteredPage } from "@/shared/components/CenteredPage";
import { EmptyState } from "@/shared/components/EmptyState";
import { ProblemAlert } from "@/shared/components/ProblemAlert";
import { AutoSubmit } from "@/features/tenant-selection/components/AutoSubmit";
import { TenantCards } from "@/features/tenant-selection/components/TenantCards";

export const dynamic = "force-dynamic";
export const metadata = { title: "Şirket seçin | itiarz" };

const AUTH_ERRORS: Record<string, string> = {
  tenant_unavailable:
    "Seçtiğiniz şirkete şu anda geçilemedi. Üyeliğiniz kaldırılmış ya da şirket hesabı askıya alınmış olabilir. " +
    "Listeden başka bir şirket seçin; sorun sürerse şirket yöneticinize danışın.",
};

export default async function SelectTenantPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const authError = typeof params.auth_error === "string" ? params.auth_error : null;
  const result = await requireMe();
  if (!result.ok) {
    return (
      <CenteredPage>
        <ProblemAlert problem={result.problem} />
      </CenteredPage>
    );
  }
  const me = result.me;
  const autoSwitch = autoSwitchTarget(me, authError) !== null;

  return (
    <CenteredPage>
      <Typography variant="h5" component="h1" gutterBottom>Şirket seçin</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {me.user.email} olarak giriş yaptınız. Hangi şirketin itirazlarıyla çalışacağınızı seçin.
      </Typography>

      {authError && (
        <Alert severity="error" role="alert" sx={{ mb: 2 }}>
          <AlertTitle>Şirket değiştirilemedi</AlertTitle>
          {AUTH_ERRORS[authError] ?? "Şirket değiştirme tamamlanamadı. Listeden yeniden seçim yapın."}
        </Alert>
      )}

      {me.memberships.length === 0 ? (
        me.platformAdmin ? (
          <EmptyState
            title="Bir şirkete üye değilsiniz."
            description="Platform yöneticisi olarak şirketleri yönetebilirsiniz."
            action={<Button component={NextLink} href="/platform/tenants" variant="contained">Platform yönetimine git</Button>}
          />
        ) : (
          <EmptyState title="Henüz bir şirkete üye değilsiniz." description="Şirket yöneticinizden davet isteyin." />
        )
      ) : (
        <TenantCards me={me} autoSwitchFormId={autoSwitch ? "auto-switch" : undefined} />
      )}

      {me.platformAdmin && me.memberships.length > 0 && (
        <Button component={NextLink} href="/platform/tenants" sx={{ mt: 2 }}>Platform yönetimine git</Button>
      )}
      {autoSwitch && <AutoSubmit formId="auto-switch" />}
    </CenteredPage>
  );
}
