"use client";

import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { isSelf, memberStatusLabel, type Member } from "@/features/team/model";
import { roleLabel, type Me } from "@/shared/auth/model";
import { DataTable } from "@/shared/components/DataTable";
import { MemberRoleSelect, RemoveMemberButton } from "./MemberRowActions";

/** Members and invitations; with member:manage, role and removal are edited inline (not on your own row). */
export function TeamTable({ members, me, canManage }: { members: Member[]; me: Me; canManage: boolean }) {
  const columns = useMemo<GridColDef<Member>[]>(() => {
    const cols: GridColDef<Member>[] = [
      {
        field: "email",
        headerName: "E-posta",
        minWidth: 220,
        flex: 1.2,
        renderCell: ({ row }) => (
          <>
            {row.email}
            {isSelf(row, me) && <Chip size="small" label="Siz" sx={{ ml: 1 }} />}
          </>
        ),
      },
      { field: "displayName", headerName: "Ad", minWidth: 150, flex: 1, valueGetter: (v: string | null) => v ?? "—" },
      {
        field: "role",
        headerName: "Rol",
        minWidth: 200,
        flex: 1,
        valueGetter: (v: string) => roleLabel(v),
        renderCell: ({ row }) =>
          canManage && !isSelf(row, me) ? <MemberRoleSelect member={row} /> : roleLabel(row.role),
      },
      { field: "status", headerName: "Durum", minWidth: 130, valueGetter: (v: string) => memberStatusLabel(v) },
    ];
    if (canManage) {
      cols.push({
        field: "actions",
        headerName: "İşlemler",
        minWidth: 160,
        sortable: false,
        filterable: false,
        renderCell: ({ row }) =>
          isSelf(row, me) ? (
            <Typography variant="body2" color="text.secondary">Kendi üyeliğiniz</Typography>
          ) : (
            <RemoveMemberButton member={row} />
          ),
      });
    }
    return cols;
  }, [me, canManage]);

  return (
    <DataTable rows={members} columns={columns} ariaLabel="Şirket üyeleri" emptyText="Bu şirkette henüz üye yok." />
  );
}
