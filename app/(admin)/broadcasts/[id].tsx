import React, { useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { COLORS } from "@/theme/tokens";
import { fmtDate } from "@/lib/format";
import { useBroadcast, useBroadcastDeliveries } from "@/hooks/useAdmin";
import { PageHeader, FilterBar } from "@/components/PageHeader";
import { DataTable, Column } from "@/components/DataTable";
import { Button, Card, Field, Pill } from "@/components/ui";
import type { BroadcastDeliveryRow, BroadcastStatus } from "@/api/types";

const PAGE_SIZE = 50;

export default function BroadcastDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: broadcast, isLoading } = useBroadcast(id ?? "");
  const [page, setPage] = useState(0);
  const { data: deliveriesPage, isFetching } = useBroadcastDeliveries(id ?? "", {
    page,
    size: PAGE_SIZE,
  });

  if (isLoading || !broadcast) {
    return (
      <View>
        <PageHeader title="Broadcast Detail" onBack={() => router.push("/broadcasts")} />
        <Text style={{ color: COLORS.text3, fontSize: 14 }}>Loading…</Text>
      </View>
    );
  }

  const deliveries: BroadcastDeliveryRow[] = deliveriesPage?.content ?? [];
  const channels = broadcast.channels.split(",").map((c: string) => c.trim());

  const columns: Column<BroadcastDeliveryRow>[] = [
    {
      key: "userId",
      label: "User ID",
      flex: 1.6,
      render: (d) => (
        <Text
          numberOfLines={1}
          style={{ fontFamily: "JetBrains Mono", fontSize: 12, color: COLORS.text }}
        >
          {d.userId}
        </Text>
      ),
    },
    {
      key: "channel",
      label: "Channel",
      flex: 0.7,
      render: (d) => <ChannelPill channel={d.channel} />,
    },
    {
      key: "status",
      label: "Status",
      flex: 0.8,
      render: (d) => <DeliveryStatusPill status={d.status} />,
    },
    {
      key: "error",
      label: "Error",
      flex: 1.5,
      render: (d) => (
        <Text
          numberOfLines={2}
          style={{ fontSize: 12.5, color: d.error ? COLORS.st.red : COLORS.text3 }}
        >
          {d.error ?? "—"}
        </Text>
      ),
    },
    {
      key: "sentAt",
      label: "Sent",
      flex: 1.1,
      render: (d) => (
        <Text style={{ fontSize: 13, color: COLORS.text2 }}>{fmtDate(d.sentAt, true)}</Text>
      ),
    },
  ];

  return (
    <View>
      <PageHeader
        title="Broadcast Detail"
        onBack={() => router.push("/broadcasts")}
        actions={
          <Button
            label="Send another"
            icon="bell"
            variant="primary"
            onPress={() => router.push("/send-notification")}
          />
        }
      />

      {/* Summary */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 20, marginBottom: 28 }}>
        <Card style={{ flex: 1, minWidth: 320 }}>
          <View style={{ gap: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <BroadcastStatusPill status={broadcast.status as BroadcastStatus} />
            </View>
            <Field label="Title">{broadcast.title}</Field>
            <Field label="Body">
              <Text style={{ fontSize: 14, color: COLORS.text, lineHeight: 21 }}>
                {broadcast.body}
              </Text>
            </Field>
            <View style={{ flexDirection: "row", gap: 24, flexWrap: "wrap" }}>
              <Field label="Target">{broadcast.targetType}{broadcast.targetValue ? ` · ${broadcast.targetValue}` : ""}</Field>
              <Field label="Channels">
                <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                  {channels.map((ch: string) => (
                    <ChannelPill key={ch} channel={ch} />
                  ))}
                </View>
              </Field>
            </View>
            <View style={{ flexDirection: "row", gap: 24, flexWrap: "wrap" }}>
              <Field label="Created">{fmtDate(broadcast.createdAt, true)}</Field>
              {broadcast.completedAt && (
                <Field label="Completed">{fmtDate(broadcast.completedAt, true)}</Field>
              )}
            </View>
          </View>
        </Card>

        <Card style={{ flex: 1, minWidth: 280 }}>
          <View style={{ gap: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.text2 }}>
              Delivery Counts
            </Text>
            <StatRow label="Total recipients" value={broadcast.totalRecipients} />
            {channels.includes("PUSH") && (
              <>
                <StatRow label="Push sent" value={broadcast.pushSent} tone="green" />
                <StatRow label="Push failed" value={broadcast.pushFailed} tone="red" />
              </>
            )}
            {channels.includes("SMS") && (
              <>
                <StatRow label="SMS sent" value={broadcast.smsSent} tone="green" />
                <StatRow label="SMS failed" value={broadcast.smsFailed} tone="red" />
              </>
            )}
            {channels.includes("IN_APP") && (
              <StatRow label="In-app created" value={broadcast.inAppCreated} tone="blue" />
            )}
          </View>
        </Card>
      </View>

      {/* Delivery rows */}
      <FilterBar>
        <Text style={{ fontSize: 13, fontWeight: "600", color: COLORS.text }}>
          Per-user delivery log
        </Text>
        <Text style={{ fontSize: 13, color: COLORS.text3 }}>
          {deliveriesPage?.totalElements ?? 0} rows
        </Text>
      </FilterBar>
      <DataTable
        columns={columns}
        rows={deliveries}
        loading={isFetching}
        empty="No delivery records yet — broadcast may still be processing."
        minWidth={860}
        rowHighlight={(d) => d.status === "FAILED"}
        page={page}
        pageSize={PAGE_SIZE}
        totalElements={deliveriesPage?.totalElements ?? 0}
        totalPages={deliveriesPage?.totalPages ?? 1}
        onPageChange={setPage}
      />
    </View>
  );
}

function StatRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "green" | "red" | "blue";
}) {
  const color = tone
    ? COLORS.st[tone]
    : COLORS.text;
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <Text style={{ fontSize: 13.5, color: COLORS.text2 }}>{label}</Text>
      <Text style={{ fontFamily: "JetBrains Mono", fontWeight: "700", fontSize: 14, color }}>
        {value}
      </Text>
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
  return <Pill tone={map[channel] ?? "gray"}>{channel}</Pill>;
}

function DeliveryStatusPill({ status }: { status: string }) {
  const map: Record<string, "green" | "red" | "gray"> = {
    SENT: "green",
    FAILED: "red",
    SKIPPED: "gray",
  };
  return (
    <Pill tone={map[status] ?? "gray"} dot>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Pill>
  );
}
