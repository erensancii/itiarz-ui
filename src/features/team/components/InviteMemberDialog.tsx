"use client";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useState } from "react";
import { useTeamActions } from "@/features/team/api/team.client";
import { isEmail, ROLE_OPTIONS } from "@/features/team/model";
import { describeProblem } from "@/shared/api/problem";
import type { Role } from "@/shared/auth/model";
import { FormAutoCompleteDropdown } from "@/shared/components/FormAutoCompleteDropdown";
import { useNotify } from "@/shared/components/Notifications";
import { ProblemAlert } from "@/shared/components/ProblemAlert";

/** "Üye davet et" button with its dialog: e-mail + role; Keycloak sends the invitation e-mail. */
export function InviteMemberDialog() {
  const { invite, busy, problem, clear } = useTeamActions();
  const notify = useNotify();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role | null>("VIEWER");
  const [errors, setErrors] = useState<{ email?: string; role?: string }>({});
  const server = problem ? describeProblem(problem, "admin").fieldErrors : {};
  const emailError = errors.email ?? server.email;
  const roleError = errors.role ?? server.role;

  function close() {
    setOpen(false);
    setEmail("");
    setRole("VIEWER");
    setErrors({});
    clear();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const found = {
      email: isEmail(email) ? undefined : "Geçerli bir e-posta adresi yazın.",
      role: role ? undefined : "Rol seçin.",
    };
    setErrors(found);
    if (found.email || found.role) return;
    const sent = email.trim();
    if (await invite({ email: sent, role: role! })) {
      notify(`${sent} adresine davet gönderildi.`);
      close();
    }
  }

  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>Üye davet et</Button>
      <Dialog open={open} onClose={busy ? undefined : close} fullWidth maxWidth="xs" aria-labelledby="invite-title">
        <form onSubmit={submit} noValidate>
          <DialogTitle id="invite-title">Üye davet et</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label="E-posta"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); if (problem) clear(); }}
                error={!!emailError}
                helperText={emailError ?? "Kişi bağlantıdan hesabını oluşturunca listede etkin görünür."}
                slotProps={{ htmlInput: { maxLength: 320, autoComplete: "off" } }}
              />
              <FormAutoCompleteDropdown
                label="Rol"
                required
                options={ROLE_OPTIONS}
                value={role}
                onChange={(v) => { setRole(v); setErrors((p) => ({ ...p, role: undefined })); }}
                error={!!roleError}
                helperText={roleError}
              />
              {problem && !emailError && !roleError && <ProblemAlert problem={problem} context="admin" onDismiss={clear} />}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={close} disabled={busy}>Vazgeç</Button>
            <Button type="submit" variant="contained" disabled={busy}>Daveti gönder</Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
