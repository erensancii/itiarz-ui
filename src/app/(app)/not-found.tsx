import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";

export default function NotFound() {
  return (
    <Paper variant="outlined" sx={{ p: 4, maxWidth: 560 }}>
      <Typography variant="h5" component="h1" gutterBottom>Aradığınız kayıt bulunamadı.</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Kayıt silinmiş ya da başka bir şirkete ait olabilir.
      </Typography>
      <Button component={NextLink} href="/cases" variant="contained">İtirazlara dön</Button>
    </Paper>
  );
}
