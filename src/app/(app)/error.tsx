"use client";

import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Button from "@mui/material/Button";

/** Unexpected render failure in a section; the digest is the server log's correlation id. */
export default function SectionError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Alert severity="error" role="alert" action={<Button color="inherit" onClick={reset}>Tekrar dene</Button>}>
      <AlertTitle>Bir şeyler ters gitti</AlertTitle>
      Sayfayı yenileyip tekrar deneyin.
      {error.digest && <> Destek kodu: <code>{error.digest}</code></>}
    </Alert>
  );
}
