"use client";

import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useRouter } from "next/navigation";
import { describeProblem, type Problem, type ProblemContext } from "@/shared/api/problem";

/** Turkish problem text with the next step, field messages and the trace id as "Destek kodu". */
export function ProblemAlert({ problem, context, onDismiss }: { problem: Problem; context?: ProblemContext; onDismiss?: () => void }) {
  const router = useRouter();
  const d = describeProblem(problem, context);
  const fields = Object.entries(d.fieldErrors);
  return (
    <Alert severity="error" role="alert" onClose={onDismiss} sx={{ mb: 2 }}>
      <AlertTitle>{d.title}</AlertTitle>
      {d.message}
      {fields.length > 0 && (
        <Box component="ul" sx={{ m: 0, mt: 1, pl: 2 }}>
          {fields.map(([field, message]) => <li key={field}>{message}</li>)}
        </Box>
      )}
      <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 1, flexWrap: "wrap" }}>
        {d.action === "login" && <Button href="/auth/login" variant="outlined" color="inherit">Yeniden giriş yap</Button>}
        {d.action === "select-tenant" && <Button href="/select-tenant" variant="outlined" color="inherit">Şirket seç</Button>}
        {d.action === "reload" && (
          // router.refresh re-renders the server data but keeps client state (e.g. a typed reason).
          <Button variant="outlined" color="inherit" onClick={() => { router.refresh(); onDismiss?.(); }}>Güncel hâli yükle</Button>
        )}
        {d.supportCode && <Box component="span" sx={{ fontSize: 12 }}>Destek kodu: <code>{d.supportCode}</code></Box>}
      </Box>
    </Alert>
  );
}
