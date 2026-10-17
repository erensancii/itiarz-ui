import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { isSelectable, roleLabel, SUSPENDED_TENANT_NOTE, type Me } from "@/shared/auth/model";

/**
 * One card per membership. Choosing a company submits a POST form to /auth/switch-tenant; the
 * active company links back to /cases; a suspended company is shown but cannot be chosen.
 * `autoSwitchFormId` marks the single card that AutoSubmit submits on load.
 */
export function TenantCards({ me, autoSwitchFormId }: { me: Me; autoSwitchFormId?: string }) {
  return (
    <Stack spacing={1.5} component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
      {me.memberships.map((m) => {
        const current = me.activeTenant?.slug === m.slug;
        const body = (note: string) => (
          <CardContent>
            <Typography sx={{ fontWeight: 600 }}>{m.name}</Typography>
            <Typography variant="body2" color="text.secondary">{roleLabel(m.role)}</Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>{note}</Typography>
          </CardContent>
        );
        return (
          <li key={m.slug}>
            {!isSelectable(m) ? (
              <Card variant="outlined" aria-disabled="true" sx={{ opacity: 0.6 }}>{body(SUSPENDED_TENANT_NOTE)}</Card>
            ) : current ? (
              <Card variant="outlined" sx={{ borderColor: "primary.main" }}>
                <CardActionArea component={NextLink} href="/cases" aria-current="true">
                  {body("Şu an bu şirkettesiniz. İtirazlara dönmek için seçin.")}
                </CardActionArea>
              </Card>
            ) : (
              <form method="post" action="/auth/switch-tenant" id={autoSwitchFormId}>
                <input type="hidden" name="slug" value={m.slug} />
                <Card variant="outlined">
                  <CardActionArea type="submit" component="button">{body("Bu şirketle devam et")}</CardActionArea>
                </Card>
              </form>
            )}
          </li>
        );
      })}
    </Stack>
  );
}
