import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { LinkButton } from "@/shared/components/LinkButton";
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
        <LinkButton href="/platform/tenants" variant="contained">Platforma dön</LinkButton>
      ) : (
        <LinkButton href="/cases" variant="contained">İtirazlara dön</LinkButton>
      )}
    </Paper>
  );
}
