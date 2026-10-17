"use client";

import { useRouter } from "next/navigation";
import { describeProblem, type Problem } from "../../lib/problem";

/** Turkish problem text with the next step and the trace id shown as "Destek kodu". */
export function ProblemMessage({ problem, onDismiss }: { problem: Problem; onDismiss?: () => void }) {
  const router = useRouter();
  const d = describeProblem(problem);
  return (
    <div className="problem" role="alert">
      <p className="problem-title">{d.title}</p>
      <p>{d.message}</p>
      {Object.keys(d.fieldErrors).length > 0 && (
        <ul className="problem-fields">
          {Object.entries(d.fieldErrors).map(([field, message]) => <li key={field}>{message}</li>)}
        </ul>
      )}
      <div className="problem-actions">
        {d.action === "login" && <a className="btn btn-small" href="/auth/login">Yeniden giriş yap</a>}
        {d.action === "select-tenant" && <a className="btn btn-small" href="/select-tenant">Şirket seç</a>}
        {d.action === "reload" && (
          // router.refresh re-renders the server data but keeps client state (e.g. a typed reason).
          <button type="button" className="btn btn-small" onClick={() => { router.refresh(); onDismiss?.(); }}>
            Güncel hâli yükle
          </button>
        )}
        {onDismiss && <button type="button" className="btn btn-small btn-quiet" onClick={onDismiss}>Mesajı kapat</button>}
        {d.supportCode && <span className="support-code">Destek kodu: <code>{d.supportCode}</code></span>}
      </div>
    </div>
  );
}
