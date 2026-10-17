import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { LinkButton } from "@/shared/components/LinkButton";

export default function NotFound() {
  return (
    <Paper variant="outlined" sx={{ p: 4, maxWidth: 560 }}>
      <Typography variant="h5" component="h1" gutterBottom>Aradığınız kayıt bulunamadı.</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Kayıt silinmiş ya da başka bir şirkete ait olabilir.
      </Typography>
      <LinkButton href="/cases" variant="contained">İtirazlara dön</LinkButton>
    </Paper>
  );
}
