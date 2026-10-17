"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useState } from "react";
import { useTeamActions } from "@/features/team/api/team.client";
import { ROLE_OPTIONS, type Member } from "@/features/team/model";
import type { Role } from "@/shared/auth/model";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { FormAutoCompleteDropdown } from "@/shared/components/FormAutoCompleteDropdown";
import { useNotify } from "@/shared/components/Notifications";
import { ProblemAlert } from "@/shared/components/ProblemAlert";

/** Inline role change for one member row (saved on selection). */
export function MemberRoleSelect({ member }: { member: Member }) {
  const { changeRole, busy, problem, clear } = useTeamActions();
  const notify = useNotify();
  const [role, setRole] = useState<Role | null>(member.role as Role);
  return (
    <Box sx={{ width: "100%", py: 0.5 }}>
      <FormAutoCompleteDropdown
        label={`${member.email} rolü`}
        options={ROLE_OPTIONS}
        value={role}
        disabled={busy}
        onChange={async (next) => {
          if (!next || next === member.role) return;
          setRole(next);
          if (await changeRole(member.id, next)) notify("Rol güncellendi.");
          else setRole(member.role as Role);
        }}
      />
      {problem && <ProblemAlert problem={problem} context="admin" onDismiss={clear} />}
    </Box>
  );
}

/** "Üyeliği kaldır" with a confirmation that names the person. */
export function RemoveMemberButton({ member }: { member: Member }) {
  const { remove, busy, problem, clear } = useTeamActions();
  const notify = useNotify();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button color="error" disabled={busy} onClick={() => setOpen(true)}>Üyeliği kaldır</Button>
      <ConfirmDialog
        open={open}
        title="Üyeliği kaldır"
        body={
          <>
            <p><strong>{member.email}</strong> bu şirketten çıkarılacak ve artık itirazlara erişemeyecek. Kişi tekrar davet edilebilir.</p>
            {problem && <ProblemAlert problem={problem} context="admin" onDismiss={clear} />}
          </>
        }
        confirmLabel="Üyeliği kaldır"
        destructive
        busy={busy}
        onClose={() => { setOpen(false); clear(); }}
        onConfirm={async () => {
          if (await remove(member.id)) {
            setOpen(false);
            notify("Üyelik kaldırıldı.");
          }
        }}
      />
    </>
  );
}
