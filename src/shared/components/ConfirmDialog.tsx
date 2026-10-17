"use client";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import type { ReactNode } from "react";

type Props = {
  open: boolean;
  title: string;
  body: ReactNode;
  /** Verb-first label, e.g. "Üyeliği kaldır". */
  confirmLabel: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({ open, title, body, confirmLabel, destructive, busy, onConfirm, onClose }: Props) {
  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} aria-labelledby="confirm-dialog-title">
      <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
      <DialogContent>{body}</DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy} autoFocus>Vazgeç</Button>
        <Button onClick={onConfirm} disabled={busy} variant="contained" color={destructive ? "error" : "primary"}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
