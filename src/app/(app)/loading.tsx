import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";

/** Skeleton while a section's server data loads. */
export default function Loading() {
  return (
    <Box aria-busy="true" aria-label="Yükleniyor">
      <Skeleton variant="text" width={220} height={40} />
      <Skeleton variant="rounded" height={40} sx={{ my: 1 }} />
      {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} variant="rounded" height={32} sx={{ mb: 0.5 }} />)}
    </Box>
  );
}
