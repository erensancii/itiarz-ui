import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import type { ReactNode } from "react";
import { Brand, LogoutButton } from "./Brand";

/** Narrow page outside the app shell (entry, tenant selection, sign-in problems). */
export function CenteredPage({ children, showLogout = true }: { children: ReactNode; showLogout?: boolean }) {
  return (
    <Container component="main" id="main" maxWidth="sm" sx={{ py: 6 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 4 }}>
        <Brand />
        {showLogout && <LogoutButton />}
      </Box>
      {children}
    </Container>
  );
}
