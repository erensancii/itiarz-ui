"use client";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import type { ReactNode } from "react";
import { NotificationProvider } from "@/shared/components/Notifications";
import { theme } from "./theme";

/** Client boundary for the MUI theme; server pages render inside it unchanged. */
export function ThemeRegistry({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <NotificationProvider>{children}</NotificationProvider>
    </ThemeProvider>
  );
}
