import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { redirect } from "next/navigation";
import { loadMe } from "@/shared/auth/me";
import { describeAuthError } from "@/shared/api/problem";
import { CenteredPage } from "@/shared/components/CenteredPage";
import { ProblemAlert } from "@/shared/components/ProblemAlert";

export const dynamic = "force-dynamic";

/**
 * Entry point: no session → /auth/login; with a session → /cases (active tenant), /platform/tenants
 * (platform admin without memberships) or /select-tenant. Callback failures (?auth_error=…) and
 * rejected sessions are explained here with a login button instead of redirecting again, which could
 * loop through Keycloak SSO.
 */
export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const authError = typeof params.auth_error === "string" ? params.auth_error : null;
  if (authError) {
    const d = describeAuthError(authError);
    return (
      <CenteredPage showLogout={false}>
        <Typography variant="h5" component="h1" gutterBottom>Giriş tamamlanamadı</Typography>
        <Alert severity="error" role="alert" sx={{ mb: 3 }}>
          {d.message}
          {d.supportCode && <> Destek kodu: <code>{d.supportCode}</code></>}
        </Alert>
        <Button href="/auth/login" variant="contained">Yeniden giriş yap</Button>
      </CenteredPage>
    );
  }

  const result = await loadMe();
  if (result.kind === "anonymous") redirect("/auth/login");
  if (result.kind === "expired" || result.kind === "error") {
    const problem = result.kind === "expired" ? { status: 401, code: "UNAUTHENTICATED" } : result.problem;
    return (
      <CenteredPage>
        <ProblemAlert problem={problem} />
      </CenteredPage>
    );
  }
  const me = result.me;
  if (me.activeTenant) redirect("/cases");
  if (me.platformAdmin && me.memberships.length === 0) redirect("/platform/tenants");
  redirect("/select-tenant");
}
