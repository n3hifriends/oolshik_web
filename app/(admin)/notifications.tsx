import React, { useState } from "react";
import { Text, View } from "react-native";
import { COLORS } from "@/theme/tokens";
import { fmtDate } from "@/lib/format";
import { useNotifications } from "@/hooks/useAdmin";
import { PageHeader, FilterBar } from "@/components/PageHeader";
import { Select } from "@/components/inputs";
import { DataTable, Column } from "@/components/DataTable";
import { Button, Pill, UserCell } from "@/components/ui";
import type { AdminNotificationRow } from "@/api/types";

const PAGE_SIZE = 12;

export default function NotificationsScreen() {
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(0);
  const { data, isFetching } = useNotifications({ page, size: PAGE_SIZE, status });

  const rows: AdminNotificationRow[] = data?.content ?? [];
  const failed = rows.filter((n) => n.status === "FAILED").length;

  const columns: Column<AdminNotificationRow>[] = [
    {
      key: "event",
      label: "Event",
      flex: 1.4,
      render: (n) => (
        <Text
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
      key: "channel",
      label: "Channel",
      flex: 0.8,
      render: (n) => <Pill tone={n.channel === "PUSH" ? "violet" : "blue"}>{n.channel}</Pill>,
    },
    {
      key: "recipient",
      label: "Recipient",
      flex: 1.4,
      render: (n) => <UserCell name={n.recipient.displayName} sub={n.recipient.phoneNumber} />,
    },
    {
      key: "attempts",
      label: "Attempts",
      flex: 0.8,
      align: "center",
      render: (n) => {
        const perm = n.attempts >= n.maxAttempts;
        return (
          <Text
            style={{
              fontFamily: "JetBrains Mono",
              fontWeight: "700",
              color: perm ? COLORS.st.red : COLORS.text,
              fontSize: 13.5,
            }}
          >
            {n.attempts} / {n.maxAttempts}
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
      key: "at",
      label: "Last attempt",
      flex: 1.2,
      render: (n) => (
        <Text style={{ color: COLORS.text2, fontSize: 13 }}>{fmtDate(n.lastAttemptAt, true)}</Text>
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
            Rows at max attempts are highlighted as permanent failures.
          </Text>
        </View>
      </FilterBar>
      <DataTable
        columns={columns}
        rows={rows}
        loading={isFetching}
        rowHighlight={(n) => n.attempts >= n.maxAttempts}
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
  const map = { SENT: "green", PENDING: "amber", RETRYING: "blue", FAILED: "red" } as const;
  const label = { SENT: "Sent", PENDING: "Pending", RETRYING: "Retrying", FAILED: "Failed" };
  return (
    <Pill tone={map[status]} dot>
      {label[status]}
    </Pill>
  );
}
