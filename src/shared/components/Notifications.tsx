"use client";

import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

const NotifyContext = createContext<(message: string) => void>(() => {});

/** Short success messages after a change ("Kanıt eklendi."); errors use ProblemAlert instead. */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const notify = useCallback((text: string) => setMessage(text), []);
  return (
    <NotifyContext.Provider value={notify}>
      {children}
      <Snackbar open={message !== null} autoHideDuration={4000} onClose={() => setMessage(null)}>
        <Alert severity="success" variant="filled" onClose={() => setMessage(null)}>{message}</Alert>
      </Snackbar>
    </NotifyContext.Provider>
  );
}

export const useNotify = () => useContext(NotifyContext);
