import React, { useState } from "react";
import { Text, View } from "react-native";
import { COLORS } from "@/theme/tokens";
import { fmtDate } from "@/lib/format";
import { useNotifications } from "@/hooks/useAdmin";
import { PageHeader, FilterBar } from "@/components/PageHeader";
import { Select } from "@/components/inputs";
import { DataTable, Column } from "@/components/DataTable";
import { Button, Pill } from "@/components/ui";
import type { AdminNotificationRow } from "@/api/types";

const PAGE_SIZE = 12;

export default function NotificationsScreen() {
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(0);
  const { data, isFetching } = useNotifications({ page, size: PAGE_SIZE, status });

  const rows: AdminNotificationRow[] = data?.content ?? [];
  const failed = rows.filter((n) => ["FAILED", "DEAD"].includes(n.status)).length;

  const columns: Column<AdminNotificationRow>[] = [
    {
      key: "event",
      label: "Event",
      flex: 1.5,
      render: (n) => (
        <Text
          numberOfLines={1}
          style={{
            fontFamily: "JetBrains Mono",
            fontSize: 12.5,
            fontWeight: "600",
            color: COLORS.text,
          }}
        >
          {n.event}
        </Text>
      ),
    },
    {
      key: "aggregate",
      label: "Aggregate",
      flex: 1.3,
      render: (n) => (
        <Text
          numberOfLines={1}
          style={{ fontFamily: "JetBrains Mono", color: COLORS.text3, fontSize: 12 }}
        >
          {n.aggregateId ?? "—"}
        </Text>
      ),
    },
    {
      key: "attempts",
      label: "Attempts",
      flex: 0.8,
      align: "center",
      render: (n) => {
        const maxAttempts = n.maxAttempts;
        const perm = n.status === "DEAD" || (maxAttempts !== undefined && n.attempts >= maxAttempts);
        return (
          <Text
            style={{
              fontFamily: "JetBrains Mono",
              fontWeight: "700",
              color: perm ? COLORS.st.red : COLORS.text,
              fontSize: 13.5,
            }}
          >
            {maxAttempts === undefined ? n.attempts : `${n.attempts} / ${maxAttempts}`}
          </Text>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      flex: 1,
      render: (n) => <NotiStatusPill status={n.status} />,
    },
    {
      key: "lastError",
      label: "Last error",
      flex: 1.5,
      render: (n) => (
        <Text numberOfLines={1} style={{ color: n.lastError ? COLORS.st.red : COLORS.text3, fontSize: 13 }}>
          {n.lastError ?? "—"}
        </Text>
      ),
    },
    {
      key: "updated",
      label: "Updated",
      flex: 1.1,
      render: (n) => (
        <Text style={{ color: COLORS.text2, fontSize: 13 }}>
          {fmtDate(n.updatedAt ?? n.lastAttemptAt ?? n.createdAt ?? "", true)}
        </Text>
      ),
    },
  ];

  return (
    <View>
      <PageHeader
        title="Notification Outbox"
        subtitle={`${data?.totalElements ?? 0} messages`}
        actions={
          failed > 0 ? (
            <Button label="Requeue failed" icon="refresh" variant="default" />
          ) : undefined
        }
      />
      <FilterBar>
        <Select
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(0);
          }}
          width={160}
          options={[
            { value: "ALL", label: "All statuses" },
            { value: "SENT", label: "Sent" },
            { value: "PENDING", label: "Pending" },
            { value: "RETRYING", label: "Retrying" },
            { value: "FAILED", label: "Failed" },
            { value: "DEAD", label: "Dead" },
          ]}
        />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 3,
              backgroundColor: COLORS.st.red + "1A",
              borderWidth: 1,
              borderColor: COLORS.st.red + "59",
            }}
          />
          <Text style={{ fontSize: 13, color: COLORS.text3 }}>
            Failed and dead messages are highlighted for operational review.
          </Text>
        </View>
      </FilterBar>
      <DataTable
        columns={columns}
        rows={rows}
        loading={isFetching}
        empty="No notification records match these filters."
        minWidth={1060}
        rowHighlight={(n) => n.status === "DEAD" || n.status === "FAILED"}
        page={page}
        pageSize={PAGE_SIZE}
        totalElements={data?.totalElements ?? 0}
        totalPages={data?.totalPages ?? 1}
        onPageChange={setPage}
      />
    </View>
  );
}

function NotiStatusPill({ status }: { status: AdminNotificationRow["status"] }) {
  const normalized = status.toUpperCase();
  const map = {
    SENT: "green",
    PENDING: "amber",
    RETRYING: "blue",
    FAILED: "red",
    DEAD: "red",
  } as const;
  const label = normalized
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  return (
    <Pill tone={map[normalized as keyof typeof map] ?? "gray"} dot>
      {label}
    </Pill>
  );
}
