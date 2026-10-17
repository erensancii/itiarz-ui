import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import type { ReactNode } from "react";

export type Crumb = { label: string; href?: string };

/** Page title with an optional breadcrumb trail and the page's primary actions on the right. */
export function PageHeader({ title, breadcrumbs, actions }: { title: string; breadcrumbs?: Crumb[]; actions?: ReactNode }) {
  return (
    <Box sx={{ mb: 2 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs aria-label="Konum" sx={{ mb: 0.5, fontSize: 13 }}>
          {breadcrumbs.map((c) =>
            c.href ? (
              <Link key={c.label} component={NextLink} href={c.href} underline="hover" color="inherit">{c.label}</Link>
            ) : (
              <Typography key={c.label} color="text.primary" sx={{ fontSize: 13 }}>{c.label}</Typography>
            ),
          )}
        </Breadcrumbs>
      )}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
        <Typography variant="h5" component="h1">{title}</Typography>
        {actions && <Box sx={{ display: "flex", gap: 1 }}>{actions}</Box>}
      </Box>
    </Box>
  );
}
