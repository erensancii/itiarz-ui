"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useCaseActions } from "@/features/cases/api/cases.client";
import { evidenceOptions, nextEvidenceKind, type CaseStatus } from "@/features/cases/model";
import { FormAutoCompleteDropdown } from "@/shared/components/FormAutoCompleteDropdown";
import { useNotify } from "@/shared/components/Notifications";
import { ProblemAlert } from "@/shared/components/ProblemAlert";

/** Adds an evidence record; defaults to the first missing required kind. */
export function EvidenceForm({ caseId, missing, status }: { caseId: string; missing: string[]; status: CaseStatus }) {
  const { addEvidence, busy, problem, clear } = useCaseActions();
  const notify = useNotify();
  const [kind, setKind] = useState<string | null>(missing[0] ?? "PaymentRecord");
  const [note, setNote] = useState("");
  const [kindError, setKindError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!kind) {
      setKindError("Kanıt türünü seçin.");
      return;
    }
    const ok = await addEvidence(caseId, { kind, note: note.trim() || undefined });
    if (ok) {
      setNote("");
      setKind(nextEvidenceKind(missing, kind));
      notify("Kanıt eklendi.");
    }
  }

  return (
    <Box component="form" onSubmit={submit} noValidate sx={{ mt: 2 }}>
      <Typography variant="subtitle2" component="h3" gutterBottom>Kanıt ekle</Typography>
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { sm: "220px 1fr" } }}>
        <FormAutoCompleteDropdown
          label="Kanıt türü"
          options={evidenceOptions(missing)}
          value={kind}
          onChange={(v) => { setKind(v); setKindError(""); }}
          required
          error={!!kindError}
          helperText={kindError || undefined}
        />
        <TextField
          label="Not (isteğe bağlı)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          slotProps={{ htmlInput: { maxLength: 500 } }}
        />
      </Box>
      {(status === "Ready" || status === "Open") && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {status === "Ready"
            ? "Kanıt eklemek dosyayı yeniden Hazırlanıyor durumuna alır; onay için tekrar hazır olarak işaretlenmesi gerekir."
            : "Kanıt eklemek dosyayı Hazırlanıyor durumuna alır."}
        </Typography>
      )}
      <Button type="submit" variant="outlined" disabled={busy} sx={{ mt: 1.5 }}>Kanıtı ekle</Button>
      {problem && <Box sx={{ mt: 2 }}><ProblemAlert problem={problem} onDismiss={clear} /></Box>}
    </Box>
  );
}
