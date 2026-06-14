import React, { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "@/theme/tokens";
import { fmtDate } from "@/lib/format";
import { useUsers } from "@/hooks/useAdmin";
import { PageHeader, FilterBar } from "@/components/PageHeader";
import { SearchInput, Select } from "@/components/inputs";
import { DataTable, Column } from "@/components/DataTable";
import { RoleBadges, UserCell } from "@/components/ui";
import type { AdminUserSummary } from "@/api/types";

const PAGE_SIZE = 12;

export default function UsersScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("ALL");
  const [page, setPage] = useState(0);

  const { data, isFetching } = useUsers({ page, size: PAGE_SIZE, search, role });

  const columns: Column<AdminUserSummary>[] = [
    {
      key: "name",
      label: "User",
      flex: 1.3,
      render: (u) => <UserCell name={u.displayName || "Unnamed user"} sub={u.phoneNumber ?? undefined} />,
    },
    {
      key: "email",
      label: "Email",
      flex: 1.4,
      render: (u) => (
        <Text
          numberOfLines={1}
          style={{ color: u.email ? COLORS.text2 : COLORS.text3, fontSize: 13.5 }}
        >
          {u.email ?? "—"}
        </Text>
      ),
    },
    { key: "roles", label: "Roles", flex: 1.1, render: (u) => <RoleBadges roles={u.roles} /> },
    {
      key: "joined",
      label: "Joined",
      flex: 0.9,
      render: (u) => (
        <Text numberOfLines={1} style={{ color: COLORS.text2, fontSize: 13.5 }}>
          {fmtDate(u.joinedAt)}
        </Text>
      ),
    },
  ];

  return (
    <View>
      <PageHeader
        title="Users"
        subtitle={data ? `${data.totalElements} users matching filters` : "Loading users…"}
      />
      <FilterBar>
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(0);
          }}
          placeholder="Search name, phone or email…"
          width={320}
        />
        <Select
          value={role}
          onChange={(v) => {
            setRole(v);
            setPage(0);
          }}
          width={180}
          options={[
            { value: "ALL", label: "All roles" },
            { value: "NETA", label: "Neta (requester)" },
            { value: "KARYAKARTA", label: "Karyakarta (helper)" },
            { value: "ADMIN", label: "Admin" },
          ]}
        />
      </FilterBar>
      <DataTable
        columns={columns}
        rows={data?.content ?? []}
        loading={isFetching}
        empty="No users match these filters."
        minWidth={920}
        onRowPress={(u) => router.push({ pathname: "/users/[id]", params: { id: u.id } })}
        page={page}
        pageSize={PAGE_SIZE}
        totalElements={data?.totalElements ?? 0}
        totalPages={data?.totalPages ?? 1}
        onPageChange={setPage}
      />
    </View>
  );
}
