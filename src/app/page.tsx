import { redirect } from "next/navigation";
import { loadMe } from "@/shared/auth/me";
import { describeAuthError, type Problem } from "@/shared/api/problem";
import { Brand, LogoutButton } from "@/shared/components/Brand";
import { ProblemAlert } from "@/shared/components/ProblemAlert";

export const dynamic = "force-dynamic";

function ErrorPage({ problem }: { problem: Problem }) {
  return (
    <main className="center-page" id="main">
      <div className="center-head"><Brand /><LogoutButton /></div>
      <ProblemAlert problem={problem} />
    </main>
  );
}

/**
 * Entry point: no session → /auth/login; with a session → /cases (active tenant) or
 * /select-tenant. Callback failures (?auth_error=…) and rejected sessions are explained here
 * with a login button instead of redirecting again, which could loop through Keycloak SSO.
 */
export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const authError = typeof params.auth_error === "string" ? params.auth_error : null;
  if (authError) {
    const d = describeAuthError(authError);
    return (
      <main className="center-page" id="main">
        <Brand />
        <h1>Giriş tamamlanamadı</h1>
        <div className="problem" role="alert">
          <p>{d.message}</p>
          {d.supportCode && <p className="support-code">Destek kodu: <code>{d.supportCode}</code></p>}
        </div>
        <a className="btn btn-primary" href="/auth/login">Yeniden giriş yap</a>
      </main>
    );
  }

  const result = await loadMe();
  if (result.kind === "anonymous") redirect("/auth/login");
  if (result.kind === "expired") return <ErrorPage problem={{ status: 401, code: "UNAUTHENTICATED" }} />;
  if (result.kind === "error") return <ErrorPage problem={result.problem} />;
  const me = result.me;
  if (me.activeTenant) redirect("/cases");
  if (me.platformAdmin && me.memberships.length === 0) redirect("/platform/tenants");
  redirect("/select-tenant");
}
