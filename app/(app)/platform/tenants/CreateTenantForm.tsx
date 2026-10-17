"use client";

import { useState } from "react";
import { useApiAction } from "../../../../lib/client-api";
import { describeProblem } from "../../../../lib/problem";
import { suggestSlug, type TenantCreated } from "../../../../lib/platform";
import { isEmail } from "../../../../lib/team";
import { ProblemMessage } from "../../../components/ProblemMessage";

type Errors = Partial<Record<"name" | "slug" | "adminEmail", string>>;

const INVITE_FAILED =
  "Şirket oluşturuldu ancak davet e-postası gönderilemedi. 'Yöneticiyi yeniden davet et' ile tekrar deneyin.";

export function CreateTenantForm() {
  const { run, busy, problem, clearProblem } = useApiAction();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [result, setResult] = useState<TenantCreated | null>(null);
  const serverErrors = problem ? describeProblem(problem, "tenant-create").fieldErrors : {};
  // The only 409 this call returns is a taken slug.
  const slugConflict = problem?.code === "CONFLICT" ? describeProblem(problem, "tenant-create").message : undefined;
  const errorFor = (f: keyof Errors) => errors[f] ?? serverErrors[f] ?? (f === "slug" ? slugConflict : undefined);

  function clear(f: keyof Errors) {
    if (errors[f]) setErrors((p) => ({ ...p, [f]: undefined }));
    if (problem) clearProblem();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const found: Errors = {};
    if (!name.trim()) found.name = "Şirket adını yazın.";
    if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(slug)) found.slug = "Yalnızca küçük harf, rakam ve tire kullanın (3–63 karakter).";
    if (!isEmail(adminEmail)) found.adminEmail = "Geçerli bir e-posta adresi yazın.";
    setErrors(found);
    setResult(null);
    if (Object.keys(found).length > 0) return;
    const created = await run<TenantCreated>("platform/tenants", "POST",
      { name: name.trim(), slug, adminEmail: adminEmail.trim() });
    if (created) {
      setResult(created);
      setName(""); setSlug(""); setSlugEdited(false); setAdminEmail("");
    }
  }

  const bind = (f: keyof Errors, id: string) => ({
    id, "aria-invalid": errorFor(f) ? true : undefined, "aria-describedby": errorFor(f) ? `${id}-error` : undefined,
  });
  const err = (f: keyof Errors, id: string) =>
    errorFor(f) ? <p id={`${id}-error`} className="field-error">{errorFor(f)}</p> : null;
  const fieldProblem = problem && (Object.keys(serverErrors).length > 0 || slugConflict);

  return (
    <form className="form-grid" onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor="tenant-name">Şirket adı</label>
        <input type="text" maxLength={200} autoComplete="off" value={name} {...bind("name", "tenant-name")}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugEdited) setSlug(suggestSlug(e.target.value));
            clear("name");
          }} />
        {err("name", "tenant-name")}
      </div>
      <div className="field">
        <label htmlFor="tenant-slug">Slug</label>
        <input type="text" maxLength={63} autoComplete="off" spellCheck={false} value={slug} {...bind("slug", "tenant-slug")}
          onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); clear("slug"); }} />
        <p className="hint">Addan önerilir, isterseniz değiştirin. Sonradan değiştirilemez.</p>
        {err("slug", "tenant-slug")}
      </div>
      <div className="field">
        <label htmlFor="tenant-admin">İlk yönetici e-postası</label>
        <input type="email" maxLength={320} autoComplete="off" value={adminEmail} {...bind("adminEmail", "tenant-admin")}
          onChange={(e) => { setAdminEmail(e.target.value); clear("adminEmail"); }} />
        {err("adminEmail", "tenant-admin")}
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={busy}>Şirket oluştur</button>
      </div>
      <div className="form-problem">
        {result && (result.inviteSent
          ? <p className="success" role="status">{result.name} oluşturuldu. {result.adminEmail} adresine yönetici daveti gönderildi.</p>
          : <div className="problem" role="alert"><p>{INVITE_FAILED}</p></div>)}
        {problem && !fieldProblem && <ProblemMessage problem={problem} context="tenant-create" onDismiss={clearProblem} />}
      </div>
    </form>
  );
}
