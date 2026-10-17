"use client";

import { useEffect, useRef, useState } from "react";
import { useApiAction } from "@/shared/api/apiClient";
import type { RoleOption } from "@/features/team/model";
import { ProblemMessage } from "@/shared/components/ProblemMessage";

/** Role change and removal for one member row. Removal asks for confirmation in a native modal dialog. */
export function MemberActions({ id, email, role, roles }: { id: string; email: string; role: string; roles: RoleOption[] }) {
  const { run, busy, problem, clearProblem } = useApiAction();
  const [selected, setSelected] = useState(role);
  const [confirming, setConfirming] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);

  useEffect(() => setSelected(role), [role]);

  async function changeRole(e: React.FormEvent) {
    e.preventDefault();
    if (selected !== role) await run(`members/${id}`, "PATCH", { role: selected });
  }

  async function remove() {
    const done = await run(`members/${id}`, "DELETE");
    if (done) dialog.current?.close();
  }

  const closeDialog = () => { dialog.current?.close(); clearProblem(); };

  return (
    <div className="member-actions">
      <form className="role-form" onSubmit={changeRole}>
        <label className="sr-only" htmlFor={`role-${id}`}>{email} rolü</label>
        <select id={`role-${id}`} value={selected} onChange={(e) => { setSelected(e.target.value); clearProblem(); }}>
          {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <button type="submit" className="btn btn-small" disabled={busy || selected === role}>Rolü kaydet</button>
      </form>
      <button ref={opener} type="button" className="btn btn-small btn-danger" disabled={busy}
        onClick={() => { setConfirming(true); dialog.current?.showModal(); }}>
        Üyeliği kaldır
      </button>
      {problem && !confirming && <ProblemMessage problem={problem} context="admin" onDismiss={clearProblem} />}

      <dialog ref={dialog} className="confirm" aria-labelledby={`confirm-title-${id}`}
        onClose={() => { setConfirming(false); opener.current?.focus(); }}>
        <h2 id={`confirm-title-${id}`}>Üyeliği kaldır</h2>
        <p><strong>{email}</strong> bu şirketten çıkarılacak ve artık itirazlara erişemeyecek. Kişi tekrar davet edilebilir.</p>
        {problem && confirming && <ProblemMessage problem={problem} context="admin" onDismiss={clearProblem} />}
        <div className="button-row">
          <button type="button" className="btn btn-danger" disabled={busy} onClick={remove}>Üyeliği kaldır</button>
          <button type="button" className="btn" autoFocus onClick={closeDialog}>Vazgeç</button>
        </div>
      </dialog>
    </div>
  );
}
