import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { requireMe } from "@/shared/api/backend.server";

export const metadata = { title: "Erişim yok | itiarz" };

export default async function ForbiddenPage() {
  const result = await requireMe();
  const platformOnly = result.ok && result.me.platformAdmin && !result.me.activeTenant;
  return (
    <Paper variant="outlined" sx={{ p: 4, maxWidth: 560 }}>
      <Typography variant="h5" component="h1" gutterBottom>Bu sayfaya erişim yetkiniz yok</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Bu işlem için gereken yetkiniz bulunmuyor. Gerekirse şirket yöneticinizden yetki isteyin.
      </Typography>
      {platformOnly ? (
        <Button component={NextLink} href="/platform/tenants" variant="contained">Platforma dön</Button>
      ) : (
        <Button component={NextLink} href="/cases" variant="contained">İtirazlara dön</Button>
      )}
    </Paper>
  );
}
