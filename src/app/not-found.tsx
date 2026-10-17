import Typography from "@mui/material/Typography";
import { CenteredPage } from "@/shared/components/CenteredPage";
import { LinkButton } from "@/shared/components/LinkButton";

/** Unknown URL (outside the signed-in sections, which have their own not-found page). */
export default function NotFound() {
  return (
    <CenteredPage showLogout={false}>
      <Typography variant="h5" component="h1" gutterBottom>Aradığınız sayfa bulunamadı.</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Adres yanlış yazılmış ya da sayfa kaldırılmış olabilir.</Typography>
      <LinkButton href="/" variant="contained">Ana sayfaya dön</LinkButton>
    </CenteredPage>
  );
}
