"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useCaseActions } from "@/features/cases/api/cases.client";
import type { UserRef } from "@/features/cases/model";
import { describeProblem } from "@/shared/api/problem";
import { FormAutoCompleteDropdown } from "@/shared/components/FormAutoCompleteDropdown";
import { useNotify } from "@/shared/components/Notifications";
import { ProblemAlert } from "@/shared/components/ProblemAlert";

export type AssigneeOption = { userId: string; email: string; displayName: string | null };

/**
 * Assignment: pick an active member (loaded server-side when the user may read members), take the
 * case yourself, or clear the assignee. Role eligibility is the backend's call; its 422
 * errors[userId] message is shown under the field.
 */
export function AssigneeControl({ caseId, assignee, myId, canTakeCase, members }: {
  caseId: string;
  assignee: UserRef | null;
  myId: string;
  canTakeCase: boolean;
  members: AssigneeOption[];
}) {
  const { assign, busy, problem, clear } = useCaseActions();
  const notify = useNotify();
  const [selected, setSelected] = useState<string | null>(assignee?.id ?? null);
  const mine = assignee?.id === myId;
  const userIdError = problem ? describeProblem(problem).fieldErrors.userId : undefined;

  async function assignTo(userId: string | null) {
    if (await assign(caseId, userId)) notify(userId ? "Dosya atandı." : "Atama kaldırıldı.");
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 1.5 }}>
        {assignee ? <>Atanan: <strong>{mine ? "Siz" : assignee.email}</strong></> : "Dosya kimseye atanmadı."}
      </Typography>
      {members.length > 0 && (
        <Box
          component="form"
          onSubmit={(e: React.FormEvent) => {
            e.preventDefault();
            if (selected && selected !== assignee?.id) void assignTo(selected);
          }}
          sx={{ display: "grid", gap: 1 }}
        >
          <FormAutoCompleteDropdown
            label="Atanacak kişi"
            options={members.map((m) => ({ value: m.userId, label: m.displayName ? `${m.displayName} (${m.email})` : m.email }))}
            value={selected}
            onChange={(v) => { setSelected(v); if (problem) clear(); }}
            error={!!userIdError}
            helperText={userIdError}
          />
          <Button type="submit" variant="outlined" disabled={busy || !selected || selected === assignee?.id}>
            Seçilen kişiye ata
          </Button>
        </Box>
      )}
      <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
        {canTakeCase && !mine && (
          <Button disabled={busy} onClick={() => { setSelected(myId); void assignTo(myId); }}>Dosyayı üstlen</Button>
        )}
        {assignee && (
          <Button disabled={busy} onClick={() => { setSelected(null); void assignTo(null); }}>Atamayı kaldır</Button>
        )}
      </Box>
      {problem && !userIdError && <Box sx={{ mt: 2 }}><ProblemAlert problem={problem} onDismiss={clear} /></Box>}
    </Box>
  );
}
