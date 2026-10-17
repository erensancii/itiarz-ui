import { roleLabel, type Me } from "../../lib/me";

/**
 * Tenant switch menu (only with more than one membership). Each entry is a form POST to
 * /auth/switch-tenant (same-origin, so the BFF's Origin check passes); no client JS needed.
 */
export function TenantSwitcher({ me }: { me: Me }) {
  if (me.memberships.length < 2) return null;
  const others = me.memberships.filter((m) => m.slug !== me.activeTenant?.slug);
  return (
    <details className="switcher">
      <summary>Şirket değiştir</summary>
      <div className="switcher-menu">
        <ul>
          {others.map((m) => (
            <li key={m.slug}>
              <form method="post" action="/auth/switch-tenant">
                <input type="hidden" name="slug" value={m.slug} />
                <button type="submit" className="switcher-option">
                  <span>{m.name}</span>
                  <small>{roleLabel(m.role)}</small>
                </button>
              </form>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
