import { redirect } from "next/navigation";
import { loadMe } from "../lib/me";
import { Brand } from "./components/Brand";
import { ProblemMessage } from "./components/ProblemMessage";

export const dynamic = "force-dynamic";

const AUTH_ERRORS: Record<string, string> = {
  login_state_missing:
    "Giriş işlemi zaman aşımına uğradı veya başka bir sekmede yeniden başlatıldı. Girişi bu sekmeden yeniden başlatın.",
  token_exchange_failed: "Giriş doğrulanamadı. Birkaç saniye sonra yeniden giriş yapmayı deneyin.",
  access_denied: "Giriş iptal edildi. Devam etmek için yeniden giriş yapın.",
};

/**
 * Entry point: no session → /auth/login; with a session → /cases (active tenant) or
 * /select-tenant. Callback failures arrive as ?auth_error=… and are explained here instead
 * of redirecting again (which could loop).
 */
export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const authError = typeof params.auth_error === "string" ? params.auth_error : null;
  if (authError) {
    return (
      <main className="center-page" id="main">
        <Brand />
        <h1>Giriş tamamlanamadı</h1>
        <div className="problem" role="alert">
          <p>{AUTH_ERRORS[authError] ?? "Giriş sırasında bir sorun oluştu. Yeniden giriş yapmayı deneyin; sorun sürerse destek ekibine bu kodu iletin."}</p>
          <p className="support-code">Destek kodu: <code>{authError}</code></p>
        </div>
        <a className="btn btn-primary" href="/auth/login">Yeniden giriş yap</a>
      </main>
    );
  }

  const result = await loadMe();
  if (result.kind === "anonymous") redirect("/auth/login");
  if (result.kind === "error") {
    return (
      <main className="center-page" id="main">
        <Brand />
        <ProblemMessage problem={result.problem} />
      </main>
    );
  }
  const me = result.me;
  if (me.activeTenant) redirect("/cases");
  if (me.platformAdmin && me.memberships.length === 0) redirect("/platform/tenants");
  redirect("/select-tenant");
}
