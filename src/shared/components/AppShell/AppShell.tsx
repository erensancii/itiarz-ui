"use client";

import AssignmentOutlined from "@mui/icons-material/AssignmentOutlined";
import BusinessOutlined from "@mui/icons-material/BusinessOutlined";
import GroupOutlined from "@mui/icons-material/GroupOutlined";
import HistoryOutlined from "@mui/icons-material/HistoryOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { roleLabel, type Me } from "@/shared/auth/model";
import { Brand, LogoutButton } from "@/shared/components/Brand";
import { navItems, type NavIcon } from "./navItems";
import { TenantMenu } from "./TenantMenu";

const DRAWER_WIDTH = 220;

const ICONS: Record<NavIcon, ReactNode> = {
  cases: <AssignmentOutlined fontSize="small" />,
  team: <GroupOutlined fontSize="small" />,
  audit: <HistoryOutlined fontSize="small" />,
  platform: <BusinessOutlined fontSize="small" />,
};

/** Signed-in frame: top bar (brand, active tenant, switch, logout) and the permission-filtered side menu. */
export function AppShell({ me, children }: { me: Me; children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = navItems(me);

  const menu = (
    <List component="nav" aria-label="Ana menü" sx={{ px: 1 }}>
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <ListItemButton
            key={item.href}
            component={NextLink}
            href={item.href}
            selected={active}
            aria-current={active ? "page" : undefined}
            onClick={() => setMobileOpen(false)}
            sx={{ borderRadius: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 34 }}>{ICONS[item.icon]}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        );
      })}
    </List>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar position="fixed" color="default" elevation={0} sx={{ zIndex: (t) => t.zIndex.drawer + 1, borderBottom: 1, borderColor: "divider" }}>
        <Toolbar variant="dense" sx={{ gap: 2 }}>
          <IconButton edge="start" aria-label="Menüyü aç" onClick={() => setMobileOpen(true)} sx={{ display: { md: "none" } }}>
            <MenuIcon />
          </IconButton>
          <Brand href={me.activeTenant ? "/cases" : "/"} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 2, flexGrow: 1, minWidth: 0 }}>
            {me.activeTenant ? (
              <>
                <Typography noWrap sx={{ fontWeight: 600 }}>{me.activeTenant.name}</Typography>
                <Chip size="small" label={roleLabel(me.activeTenant.role)} />
              </>
            ) : (
              <Typography color="text.secondary">Platform yönetimi</Typography>
            )}
            <TenantMenu me={me} />
          </Box>
          <Typography variant="body2" color="text.secondary" noWrap sx={{ display: { xs: "none", sm: "block" } }} title={me.user.email}>
            {me.user.displayName || me.user.email}
          </Typography>
          <LogoutButton />
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { width: DRAWER_WIDTH } }}
        >
          <Toolbar variant="dense" />
          {menu}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{ display: { xs: "none", md: "block" }, "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" } }}
        >
          <Toolbar variant="dense" />
          {menu}
        </Drawer>
      </Box>

      <Box component="main" id="main" tabIndex={-1} sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, md: 3 } }}>
        <Toolbar variant="dense" />
        {children}
      </Box>
    </Box>
  );
}
