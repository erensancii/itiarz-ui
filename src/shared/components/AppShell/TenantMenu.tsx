"use client";

import Button from "@mui/material/Button";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useState } from "react";
import { isSelectable, roleLabel, SUSPENDED_TENANT_NOTE, type Me } from "@/shared/auth/model";

/**
 * Tenant switch menu (only with more than one membership). Each entry submits a POST form to
 * /auth/switch-tenant (same-origin, so the BFF's Origin check passes). Suspended tenants are listed
 * but disabled.
 */
export function TenantMenu({ me }: { me: Me }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  if (me.memberships.length < 2) return null;
  const others = me.memberships.filter((m) => m.slug !== me.activeTenant?.slug);
  return (
    <>
      <Button color="inherit" aria-haspopup="menu" aria-expanded={anchor !== null} onClick={(e) => setAnchor(e.currentTarget)}>
        Şirket değiştir
      </Button>
      <Menu anchorEl={anchor} open={anchor !== null} onClose={() => setAnchor(null)}>
        {others.map((m) =>
          isSelectable(m) ? (
            <form key={m.slug} method="post" action="/auth/switch-tenant">
              <input type="hidden" name="slug" value={m.slug} />
              <MenuItem component="button" type="submit" sx={{ width: "100%" }}>
                <ListItemText primary={m.name} secondary={roleLabel(m.role)} />
              </MenuItem>
            </form>
          ) : (
            <MenuItem key={m.slug} disabled>
              <ListItemText primary={m.name} secondary={SUSPENDED_TENANT_NOTE} />
            </MenuItem>
          ),
        )}
      </Menu>
    </>
  );
}
