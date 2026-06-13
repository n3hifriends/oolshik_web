import React, { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { COLORS, HELP_STATUSES, STATUS_META } from "@/theme/tokens";
import { fmtDate } from "@/lib/format";
import { useRequests, useStats } from "@/hooks/useAdmin";
import { PageHeader, FilterBar } from "@/components/PageHeader";
import { SearchInput, Select, FilterChip } from "@/components/inputs";
import { DataTable, Column } from "@/components/DataTable";
import { Button, StatusBadge, UserCell } from "@/components/ui";
import { Icon } from "@/components/Icon";
import type { AdminRequestSummary } from "@/api/types";

const PAGE_SIZE = 12;

export default function RequestsScreen() {
  const router = useRouter();
  const { data: stats } = useStats();
  const [search, setSearch] = useState("");
  const [statuses, setStatuses] = useState<string[]>([]);
  const [range, setRange] = useState("ALL");
  const [page, setPage] = useState(0);

  const days = range === "ALL" ? undefined : Number(range);
  const { data, isFetching } = useRequests({ page, size: PAGE_SIZE, search, statuses, days });

  function toggleStatus(s: string) {
    setPage(0);
    setStatuses((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  }

  const columns: Column<AdminRequestSummary>[] = [
    {
      key: "title",
      label: "Request",
      flex: 1.8,
      render: (r) => (
        <View>
          <Text numberOfLines={1} style={{ fontWeight: "600", color: COLORS.text, fontSize: 13.5 }}>
            {r.title}
          </Text>
          <Text style={{ fontFamily: "JetBrains Mono", fontSize: 11.5, color: COLORS.text3 }}>
            {r.id}
          </Text>
        </View>
      ),
    },
    {
      key: "requester",
      label: "Requester",
      flex: 1.2,
      render: (r) => <UserCell name={r.requester.displayName} sub={r.requester.phoneNumber} />,
    },
    {
      key: "helper",
      label: "Helper",
      flex: 1.2,
      render: (r) =>
        r.helper ? (
          <UserCell name={r.helper.displayName} sub={r.helper.phoneNumber} />
        ) : (
          <Text style={{ color: COLORS.text3, fontSize: 13 }}>Unassigned</Text>
        ),
    },
    { key: "status", label: "Status", flex: 1.1, render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "geo",
      label: "Location",
      flex: 1.1,
      render: (r) => (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Icon name="pin" size={13} color={COLORS.orange} />
          <Text style={{ fontFamily: "JetBrains Mono", fontSize: 12, color: COLORS.text2 }}>
            {r.geo.lat}, {r.geo.lng}
          </Text>
        </View>
      ),
    },
    {
      key: "created",
      label: "Created",
      flex: 0.9,
      render: (r) => (
        <Text style={{ color: COLORS.text2, fontSize: 13 }}>{fmtDate(r.createdAt)}</Text>
      ),
    },
  ];

  return (
    <View>
      <PageHeader
        title="Help Requests"
        subtitle={
          stats
            ? `${data?.totalElements ?? 0} requests · ${stats.reviewRequired} need review`
            : "Loading…"
        }
      />
      <FilterBar>
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(0);
          }}
          placeholder="Search title, requester or ID…"
          width={320}
        />
        <Select
          value={range}
          onChange={(v) => {
            setRange(v);
            setPage(0);
          }}
          width={160}
          options={[
            { value: "ALL", label: "All time" },
            { value: "7", label: "Last 7 days" },
            { value: "30", label: "Last 30 days" },
            { value: "90", label: "Last 90 days" },
          ]}
        />
        {statuses.length > 0 && (
          <Button
            label={`Clear ${statuses.length}`}
            icon="close"
            variant="ghost"
            size="sm"
            onPress={() => setStatuses([])}
          />
        )}
      </FilterBar>
      <View style={{ flexDirection: "row", gap: 7, marginBottom: 16, flexWrap: "wrap" }}>
        {HELP_STATUSES.map((s) => (
          <FilterChip
            key={s}
            label={STATUS_META[s].label}
            active={statuses.includes(s)}
            tone={COLORS.st[STATUS_META[s].tone]}
            onPress={() => toggleStatus(s)}
          />
        ))}
      </View>
      <DataTable
        columns={columns}
        rows={data?.content ?? []}
        loading={isFetching}
        onRowPress={(r) => router.push({ pathname: "/requests/[id]", params: { id: r.id } })}
        page={page}
        pageSize={PAGE_SIZE}
        totalElements={data?.totalElements ?? 0}
        totalPages={data?.totalPages ?? 1}
        onPageChange={setPage}
      />
    </View>
  );
}
