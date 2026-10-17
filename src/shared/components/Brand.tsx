import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Box
      component={NextLink}
      href={href}
      aria-label="itiarz ana sayfa"
      sx={{ display: "inline-flex", alignItems: "center", gap: 1, color: "inherit", textDecoration: "none" }}
    >
      <Box
        aria-hidden="true"
        sx={{
          width: 28, height: 28, borderRadius: 1, display: "grid", placeItems: "center",
          bgcolor: "primary.main", color: "primary.contrastText", fontWeight: 700,
        }}
      >
        i
      </Box>
      <Typography component="span" sx={{ fontWeight: 700, fontSize: 18, letterSpacing: 0.2 }}>itiarz</Typography>
    </Box>
  );
}

/** POST form: the BFF's logout route checks Origin, so it is never a plain link. */
export function LogoutButton() {
  return (
    <form method="post" action="/auth/logout">
      <Button type="submit" color="inherit">Çıkış yap</Button>
    </form>
  );
}
