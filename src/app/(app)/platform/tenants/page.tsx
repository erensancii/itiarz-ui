import { formatDateTime } from "@/features/cases/model";
import { can } from "@/shared/auth/me";
import type { PlatformTenant } from "@/features/platform/model";
import { apiGet, requireMe } from "@/shared/api/backend.server";
import { ProblemAlert } from "@/shared/components/ProblemAlert";
import { CreateTenantForm } from "@/features/platform/components/CreateTenantForm";
import { TenantActions } from "@/features/platform/components/TenantActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Şirketler | itiarz" };

export default async function PlatformTenantsPage() {
  const meResult = await requireMe();
  if (!meResult.ok) return <ProblemAlert problem={meResult.problem} />;
  if (!meResult.me.platformAdmin || !can(meResult.me, "tenant:create")) {
    return <ProblemAlert problem={{ status: 403, detail: "Şirket yönetimi yalnızca platform yöneticilerine açık." }} />;
  }

  const result = await apiGet<PlatformTenant[]>("/api/platform/tenants");
  const tenants = result.ok ? result.data : [];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Şirketler</h1>
          {result.ok && <p className="page-sub">{tenants.length} şirket</p>}
        </div>
      </div>

      <section className="panel section" aria-labelledby="create-title">
        <h2 id="create-title">Şirket oluştur</h2>
        <CreateTenantForm />
      </section>

      {!result.ok ? (
        <ProblemAlert problem={result.problem} context="admin" />
      ) : tenants.length === 0 ? (
        <div className="empty"><p>Henüz şirket yok. Yukarıdaki formdan ilk şirketi oluşturun.</p></div>
      ) : (
        <div className="table-wrap">
          <table className="cases team">
            <caption className="sr-only">Şirketler</caption>
            <thead>
              <tr>
                <th scope="col">Ad</th>
                <th scope="col">Slug</th>
                <th scope="col">Durum</th>
                <th scope="col" className="num">Üye sayısı</th>
                <th scope="col">Oluşturulma</th>
                <th scope="col">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id}>
                  <td><strong>{t.name}</strong></td>
                  <td><code>{t.slug}</code></td>
                  <td>
                    <span className={`status-pill status-${t.status}`}>
                      {t.status === "ACTIVE" ? "Etkin" : t.status === "SUSPENDED" ? "Askıda" : t.status}
                    </span>
                  </td>
                  <td className="num">{t.memberCount}</td>
                  <td className="nowrap">{formatDateTime(t.createdAt)}</td>
                  <td><TenantActions id={t.id} name={t.name} status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
