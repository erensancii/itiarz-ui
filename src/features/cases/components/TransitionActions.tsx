"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useCaseActions } from "@/features/cases/api/cases.client";
import { STATUS_LABELS, type TransitionOption } from "@/features/cases/model";
import { useNotify } from "@/shared/components/Notifications";
import { ProblemAlert } from "@/shared/components/ProblemAlert";

const REASON_MAX = 500;

/** Status buttons for the transitions the user may perform; "Geri gönder" asks for a reason first. */
export function TransitionActions({ caseId, version, options, missingCount }: {
  caseId: string;
  version: number;
  options: TransitionOption[];
  missingCount: number;
}) {
  const { transition, busy, problem, clear } = useCaseActions();
  const notify = useNotify();
  const [reasonFor, setReasonFor] = useState<TransitionOption | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");

  async function go(option: TransitionOption, why?: string) {
    const ok = await transition(caseId, { to: option.to, reason: why || undefined, version });
    if (ok) {
      setReasonFor(null);
      setReason("");
      notify(`Dosya durumu: ${STATUS_LABELS[option.to]}.`);
    }
  }

  function submitReason(e: React.FormEvent) {
    e.preventDefault();
    if (!reasonFor) return;
    const trimmed = reason.trim();
    if (!trimmed) {
      setReasonError("Geri gönderme gerekçesini yazın; analist neyi düzelteceğini buradan görür.");
      return;
    }
    void go(reasonFor, trimmed);
  }

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        {options.map((o) => (
          <Button
            key={o.to}
            disabled={busy}
            variant={o.tone === "primary" ? "contained" : "outlined"}
            aria-expanded={o.needsReason ? reasonFor?.to === o.to : undefined}
            onClick={() => {
              clear();
              if (o.needsReason) { setReasonFor(reasonFor?.to === o.to ? null : o); setReasonError(""); }
              else void go(o);
            }}
          >
            {o.label}
          </Button>
        ))}
      </Box>
      {missingCount > 0 && options.some((o) => o.to === "Ready") && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Hazır olarak işaretlemek için önce {missingCount} eksik zorunlu kanıtı ekleyin.
        </Typography>
      )}
      {reasonFor && (
        <Box component="form" onSubmit={submitReason} noValidate sx={{ mt: 2 }}>
          <TextField
            label="Geri gönderme gerekçesi"
            multiline
            minRows={3}
            autoFocus
            value={reason}
            onChange={(e) => { setReason(e.target.value); if (reasonError) setReasonError(""); }}
            error={!!reasonError}
            helperText={reasonError || `En fazla ${REASON_MAX} karakter. Gerekçe geçiş geçmişinde görünür.`}
            slotProps={{ htmlInput: { maxLength: REASON_MAX } }}
          />
          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
            <Button type="submit" variant="contained" disabled={busy}>Gerekçeyle geri gönder</Button>
            <Button onClick={() => setReasonFor(null)}>Vazgeç</Button>
          </Box>
        </Box>
      )}
      {problem && <Box sx={{ mt: 2 }}><ProblemAlert problem={problem} onDismiss={clear} /></Box>}
    </Box>
  );
}
