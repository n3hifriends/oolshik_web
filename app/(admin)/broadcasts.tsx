import React, { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "@/theme/tokens";
import { fmtDate } from "@/lib/format";
import { useBroadcasts } from "@/hooks/useAdmin";
import { PageHeader, FilterBar } from "@/components/PageHeader";
import { DataTable, Column } from "@/components/DataTable";
import { Button, Pill } from "@/components/ui";
import type { BroadcastSummary, BroadcastStatus } from "@/api/types";

const PAGE_SIZE = 15;

export default function BroadcastsScreen() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const { data, isFetching } = useBroadcasts({ page, size: PAGE_SIZE });
  const rows: BroadcastSummary[] = data?.content ?? [];

  const columns: Column<BroadcastSummary>[] = [
    {
      key: "created",
      label: "Created",
      flex: 1.1,
      render: (b) => (
        <Text style={{ fontSize: 13, color: COLORS.text2 }}>{fmtDate(b.createdAt, true)}</Text>
      ),
    },
    {
      key: "target",
      label: "Target",
      flex: 1.2,
      render: (b) => (
        <View style={{ gap: 2 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: COLORS.text }}>
            {b.targetType}
          </Text>
          {b.targetValue && (
            <Text
              numberOfLines={1}
              style={{ fontSize: 11.5, color: COLORS.text3, fontFamily: "JetBrains Mono" }}
            >
              {b.targetValue}
            </Text>
          )}
        </View>
      ),
    },
    {
      key: "channels",
      label: "Channels",
      flex: 1.1,
      render: (b) => (
        <View style={{ flexDirection: "row", gap: 5, flexWrap: "wrap" }}>
          {b.channels.split(",").map((ch) => (
            <ChannelPill key={ch} channel={ch.trim()} />
          ))}
        </View>
      ),
    },
    {
      key: "status",
      label: "Status",
      flex: 0.9,
      render: (b) => <BroadcastStatusPill status={b.status} />,
    },
    {
      key: "recipients",
      label: "Recipients",
      flex: 0.8,
      align: "center",
      render: (b) => (
        <Text
          style={{ fontFamily: "JetBrains Mono", fontWeight: "700", fontSize: 13, color: COLORS.text }}
        >
          {b.totalRecipients}
        </Text>
      ),
    },
    {
      key: "push",
      label: "Push",
      flex: 0.9,
      align: "center",
      render: (b) =>
        b.channels.includes("PUSH") ? (
          <DeliveryStat sent={b.pushSent} failed={b.pushFailed} />
        ) : (
          <Text style={{ color: COLORS.text3, fontSize: 13 }}>—</Text>
        ),
    },
    {
      key: "sms",
      label: "SMS",
      flex: 0.9,
      align: "center",
      render: (b) =>
        b.channels.includes("SMS") ? (
          <DeliveryStat sent={b.smsSent} failed={b.smsFailed} />
        ) : (
          <Text style={{ color: COLORS.text3, fontSize: 13 }}>—</Text>
        ),
    },
    {
      key: "inApp",
      label: "In-App",
      flex: 0.8,
      align: "center",
      render: (b) =>
        b.channels.includes("IN_APP") ? (
          <Text
            style={{
              fontFamily: "JetBrains Mono",
              fontWeight: "600",
              fontSize: 13,
              color: COLORS.st.blue,
            }}
          >
            {b.inAppCreated}
          </Text>
        ) : (
          <Text style={{ color: COLORS.text3, fontSize: 13 }}>—</Text>
        ),
    },
  ];

  return (
    <View>
      <PageHeader
        title="Broadcast History"
        subtitle={`${data?.totalElements ?? 0} broadcasts`}
        actions={
          <Button
            label="Send notification"
            icon="bell"
            variant="primary"
            onPress={() => router.push("/send-notification")}
          />
        }
      />
      <FilterBar>
        <Text style={{ fontSize: 13, color: COLORS.text3 }}>
          Click a row to see per-user delivery details.
        </Text>
      </FilterBar>
      <DataTable
        columns={columns}
        rows={rows}
        loading={isFetching}
        empty="No broadcasts yet. Send your first notification to get started."
        minWidth={1000}
        rowHighlight={(b) => b.status === "PARTIAL_FAILURE"}
        onRowPress={(b) => router.push(`/broadcasts/${b.id}`)}
        page={page}
        pageSize={PAGE_SIZE}
        totalElements={data?.totalElements ?? 0}
        totalPages={data?.totalPages ?? 1}
        onPageChange={setPage}
      />
    </View>
  );
}

function BroadcastStatusPill({ status }: { status: BroadcastStatus }) {
  const map: Record<BroadcastStatus, "gray" | "amber" | "blue" | "green" | "red"> = {
    QUEUED: "gray",
    PROCESSING: "blue",
    COMPLETED: "green",
    PARTIAL_FAILURE: "red",
  };
  const labels: Record<BroadcastStatus, string> = {
    QUEUED: "Queued",
    PROCESSING: "Processing",
    COMPLETED: "Completed",
    PARTIAL_FAILURE: "Partial Failure",
  };
  return (
    <Pill tone={map[status] ?? "gray"} dot>
      {labels[status] ?? status}
    </Pill>
  );
}

function ChannelPill({ channel }: { channel: string }) {
  const map: Record<string, "blue" | "amber" | "green"> = {
    PUSH: "blue",
    SMS: "amber",
    IN_APP: "green",
  };
  return (
    <Pill tone={map[channel] ?? "gray"}>
      {channel}
    </Pill>
  );
}

function DeliveryStat({ sent, failed }: { sent: number; failed: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
      <Text style={{ fontFamily: "JetBrains Mono", fontWeight: "700", fontSize: 13, color: COLORS.st.green }}>
        {sent}
      </Text>
      {failed > 0 && (
        <>
          <Text style={{ color: COLORS.text3, fontSize: 12 }}>/</Text>
          <Text style={{ fontFamily: "JetBrains Mono", fontWeight: "700", fontSize: 13, color: COLORS.st.red }}>
            {failed}
          </Text>
        </>
      )}
    </View>
  );
}
