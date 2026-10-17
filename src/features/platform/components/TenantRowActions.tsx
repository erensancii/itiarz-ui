"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { useState } from "react";
import { usePlatformActions } from "@/features/platform/api/platform.client";
import type { PlatformTenant } from "@/features/platform/model";
import { describeProblem } from "@/shared/api/problem";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { useNotify } from "@/shared/components/Notifications";
import { ProblemAlert } from "@/shared/components/ProblemAlert";
import { isEmail } from "@/shared/validation";

/** Suspend/activate (confirmed, naming the company) and "Yöneticiyi yeniden davet et" for one tenant. */
export function TenantRowActions({ tenant }: { tenant: PlatformTenant }) {
  const { suspend, activate, reinviteAdmin, busy, problem, clear } = usePlatformActions();
  const notify = useNotify();
  const suspended = tenant.status === "SUSPENDED";
  const [confirming, setConfirming] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const serverEmailError = problem ? describeProblem(problem, "tenant-reinvite").fieldErrors.email : undefined;
  const emailMsg = emailError ?? serverEmailError;

  async function toggle() {
    const ok = suspended ? await activate(tenant.id) : await suspend(tenant.id);
    if (ok) {
      setConfirming(false);
      notify(suspended ? `${tenant.name} etkinleştirildi.` : `${tenant.name} askıya alındı.`);
    }
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!isEmail(email)) { setEmailError("Geçerli bir e-posta adresi yazın."); return; }
    if (await reinviteAdmin(tenant.id, email.trim())) {
      notify(`${email.trim()} adresine davet gönderildi.`);
      setInviting(false);
      setEmail("");
    }
  }

  return (
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
      <Button color={suspended ? "primary" : "warning"} disabled={busy} onClick={() => { clear(); setConfirming(true); }}>
        {suspended ? "Etkinleştir" : "Askıya al"}
      </Button>
      <Button disabled={busy} onClick={() => { clear(); setInviting(true); }}>Yöneticiyi yeniden davet et</Button>

      <ConfirmDialog
        open={confirming}
        title={suspended ? "Şirketi etkinleştir" : "Şirketi askıya al"}
        body={
          <>
            <p>
              {suspended
                ? <><strong>{tenant.name}</strong> yeniden etkinleştirilecek; kullanıcıları tekrar giriş yapabilecek.</>
                : <><strong>{tenant.name}</strong> askıya alınacak; kullanıcıları bir sonraki istekte erişimini kaybeder. Veri silinmez.</>}
            </p>
            {problem && <ProblemAlert problem={problem} context="admin" onDismiss={clear} />}
          </>
        }
        confirmLabel={suspended ? "Şirketi etkinleştir" : "Şirketi askıya al"}
        destructive={!suspended}
        busy={busy}
        onConfirm={toggle}
        onClose={() => { setConfirming(false); clear(); }}
      />

      <Dialog open={inviting} onClose={busy ? undefined : () => setInviting(false)} fullWidth maxWidth="xs" aria-labelledby={`reinvite-${tenant.id}`}>
        <form onSubmit={invite} noValidate>
          <DialogTitle id={`reinvite-${tenant.id}`}>{tenant.name}: yöneticiyi yeniden davet et</DialogTitle>
          <DialogContent>
            <TextField
              label="Yönetici e-postası"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(null); if (problem) clear(); }}
              error={!!emailMsg}
              helperText={emailMsg}
              sx={{ mt: 1 }}
              slotProps={{ htmlInput: { autoComplete: "off" } }}
            />
            {problem && !emailMsg && <Box sx={{ mt: 2 }}><ProblemAlert problem={problem} context="tenant-reinvite" onDismiss={clear} /></Box>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setInviting(false)} disabled={busy}>Vazgeç</Button>
            <Button type="submit" variant="contained" disabled={busy}>Daveti gönder</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
