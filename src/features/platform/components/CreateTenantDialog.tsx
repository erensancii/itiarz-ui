"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useState } from "react";
import { usePlatformActions } from "@/features/platform/api/platform.client";
import { suggestSlug } from "@/features/platform/model";
import { describeProblem } from "@/shared/api/problem";
import { useNotify } from "@/shared/components/Notifications";
import { ProblemAlert } from "@/shared/components/ProblemAlert";
import { isEmail } from "@/shared/validation";

type Field = "name" | "slug" | "adminEmail";

const SLUG = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
const INVITE_FAILED =
  "Şirket oluşturuldu ancak davet e-postası gönderilemedi. 'Yöneticiyi yeniden davet et' ile tekrar deneyin.";

/** "Şirket oluştur": the slug is suggested from the name until the user edits it. */
export function CreateTenantDialog() {
  const { createTenant, busy, problem, clear } = usePlatformActions();
  const notify = useNotify();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [inviteFailed, setInviteFailed] = useState(false);
  // Server field errors, including a 409 for a taken name or slug (shown under that field).
  const server: Partial<Record<Field, string>> = problem ? describeProblem(problem, "tenant-create").fieldErrors : {};
  const errorFor = (f: Field) => errors[f] ?? server[f];
  const fieldProblem = Object.keys(server).length > 0;

  function touch(f: Field) {
    if (errors[f]) setErrors((p) => ({ ...p, [f]: undefined }));
    if (problem) clear();
  }

  function close() {
    setOpen(false);
    setName(""); setSlug(""); setSlugEdited(false); setAdminEmail(""); setErrors({}); setInviteFailed(false);
    clear();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const found: Partial<Record<Field, string>> = {};
    if (!name.trim()) found.name = "Şirket adını yazın.";
    if (!SLUG.test(slug)) found.slug = "Yalnızca küçük harf, rakam ve tire kullanın (3–63 karakter).";
    if (!isEmail(adminEmail)) found.adminEmail = "Geçerli bir e-posta adresi yazın.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const created = await createTenant({ name: name.trim(), slug, adminEmail: adminEmail.trim() });
    if (!created) return;
    if (created.inviteSent) {
      notify(`${created.name} oluşturuldu. ${created.adminEmail} adresine yönetici daveti gönderildi.`);
      close();
    } else {
      setInviteFailed(true);
    }
  }

  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>Şirket oluştur</Button>
      <Dialog open={open} onClose={busy ? undefined : close} fullWidth maxWidth="sm" aria-labelledby="create-tenant-title">
        <form onSubmit={submit} noValidate>
          <DialogTitle id="create-tenant-title">Şirket oluştur</DialogTitle>
          <DialogContent>
            {inviteFailed ? (
              <Alert severity="warning" role="alert">{INVITE_FAILED}</Alert>
            ) : (
              <Stack spacing={2} sx={{ pt: 1 }}>
                <TextField
                  label="Şirket adı"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (!slugEdited) setSlug(suggestSlug(e.target.value)); touch("name"); }}
                  error={!!errorFor("name")}
                  helperText={errorFor("name")}
                  slotProps={{ htmlInput: { maxLength: 200, autoComplete: "off" } }}
                />
                <TextField
                  label="Slug"
                  required
                  value={slug}
                  onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); touch("slug"); }}
                  error={!!errorFor("slug")}
                  helperText={errorFor("slug") ?? "Addan önerilir, isterseniz değiştirin. Sonradan değiştirilemez."}
                  slotProps={{ htmlInput: { maxLength: 63, autoComplete: "off", spellCheck: false } }}
                />
                <TextField
                  label="İlk yönetici e-postası"
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => { setAdminEmail(e.target.value); touch("adminEmail"); }}
                  error={!!errorFor("adminEmail")}
                  helperText={errorFor("adminEmail")}
                  slotProps={{ htmlInput: { maxLength: 320, autoComplete: "off" } }}
                />
                {problem && !fieldProblem && <ProblemAlert problem={problem} context="tenant-create" onDismiss={clear} />}
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            {inviteFailed ? (
              <Button onClick={close} variant="contained">Kapat</Button>
            ) : (
              <>
                <Button onClick={close} disabled={busy}>Vazgeç</Button>
                <Button type="submit" variant="contained" disabled={busy}>Şirket oluştur</Button>
              </>
            )}
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
