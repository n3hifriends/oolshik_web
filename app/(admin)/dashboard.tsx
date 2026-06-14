import React from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "@/theme/tokens";
import { fmtDate, inr, timeAgo } from "@/lib/format";
import { useRequests, useStats } from "@/hooks/useAdmin";
import { PageHeader } from "@/components/PageHeader";
import { Button, Card, Field, Pill, StatCard, StatusBadge, UserCell } from "@/components/ui";
import { Icon } from "@/components/Icon";
import type { AdminRequestSummary } from "@/api/types";

export default function Dashboard() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { data: stats } = useStats();
  const { data: recent } = useRequests({ page: 0, size: 6 });
  const twoCol = width >= 1040;

  const recentRequests: AdminRequestSummary[] = recent?.content ?? [];
  const reviewItems = recentRequests.filter((r) => r.status === "REVIEW_REQUIRED").slice(0, 5);

  return (
    <View>
      <PageHeader
        title="Dashboard"
        subtitle="Operational overview of the Oolshik network — Bengaluru region"
        actions={
          <>
            <Button label="Refresh" icon="refresh" variant="default" />
            <Button label="Export report" icon="trend" variant="primary" />
          </>
        }
      />

      {/* stat cards */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
        <StatCard
          label="Total users"
          value={stats?.totalUsers ?? "—"}
          icon="users"
          tone="blue"
          sub={stats ? `${stats.netas} netas · ${stats.karyakartas} karyakartas` : undefined}
          onPress={() => router.push("/users")}
        />
        <StatCard
          label="Active requests"
          value={stats?.activeRequests ?? "—"}
          icon="requests"
          tone="violet"
          sub={stats ? `${stats.openRequests} open right now` : undefined}
          onPress={() => router.push("/requests")}
        />
        <StatCard
          label="Review required"
          value={stats?.reviewRequired ?? "—"}
          icon="alert"
          tone="red"
          alert
          sub="Needs manual attention"
          onPress={() => router.push("/requests")}
        />
        <StatCard
          label="STT failures"
          value={stats?.sttFailures ?? "—"}
          icon="mic"
          tone="amber"
          sub="Failed transcription jobs"
          onPress={() => router.push("/transcription")}
        />
        <StatCard
          label="Notification failures"
          value={stats?.notificationFailures ?? "—"}
          icon="bell"
          tone="red"
          alert={!!stats && stats.notificationFailures > 0}
          sub="Permanent send failures"
          onPress={() => router.push("/notifications")}
        />
      </View>

      {/* trend + review queue */}
      <View
        style={{
          flexDirection: twoCol ? "row" : "column",
          gap: 16,
          marginTop: 16,
          alignItems: "flex-start",
        }}
      >
        <Card
          style={{ flex: twoCol ? 1.6 : undefined, width: twoCol ? undefined : "100%" }}
          padding={20}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 18,
            }}
          >
            <View>
              <Text style={{ fontSize: 16, fontWeight: "700", color: COLORS.text }}>
                Request volume
              </Text>
              <Text style={{ fontSize: 13, color: COLORS.text2, marginTop: 3 }}>
                Last 14 days · created vs completed
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 16 }}>
              <Legend color={COLORS.st.violet} label="Created" />
              <Legend color={COLORS.st.green} label="Completed" />
            </View>
          </View>
          <TrendChart data={stats?.trend ?? []} />
          <View
            style={{
              flexDirection: "row",
              gap: 28,
              marginTop: 18,
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: COLORS.lineSoft,
              flexWrap: "wrap",
            }}
          >
            <Field label="Completed (total)" mono>
              {stats?.completed ?? "—"}
            </Field>
            <Field label="Payments captured">{stats ? inr(stats.paymentsCapturedInr) : "—"}</Field>
            <Field label="Open reports" mono>
              {stats?.openReports ?? "—"}
            </Field>
            <Field label="Admins" mono>
              {stats?.admins ?? "—"}
            </Field>
          </View>
        </Card>

        <Card
          style={{ flex: twoCol ? 1 : undefined, width: twoCol ? undefined : "100%" }}
          padding={20}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: COLORS.text }}>
              Review queue
            </Text>
            <Pill tone="red" dot>
              {reviewItems.length} pending
            </Pill>
          </View>
          {reviewItems.length === 0 && (
            <Text style={{ color: COLORS.text3, fontSize: 14 }}>Nothing to review right now.</Text>
          )}
          {reviewItems.map((r, i) => (
            <Pressable
              key={r.id}
              onPress={() => router.push({ pathname: "/requests/[id]", params: { id: r.id } })}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingVertical: 11,
                borderTopWidth: i ? 1 : 0,
                borderTopColor: COLORS.lineSoft,
              }}
            >
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  backgroundColor: COLORS.st.red + "1F",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="alert" size={17} color={COLORS.st.red} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  numberOfLines={1}
                  style={{ fontSize: 13.5, fontWeight: "600", color: COLORS.text }}
                >
                  {r.title}
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.text3 }}>
                  {r.requester.displayName} · {timeAgo(r.updatedAt ?? r.createdAt)}
                </Text>
              </View>
              <Icon name="chevR" size={16} color={COLORS.text3} />
            </Pressable>
          ))}
        </Card>
      </View>

      {/* recent activity */}
      <Card style={{ marginTop: 16 }} padding={20}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: COLORS.text }}>
            Recent request activity
          </Text>
          <Button
            label="View all"
            icon="external"
            variant="ghost"
            size="sm"
            onPress={() => router.push("/requests")}
          />
        </View>
        {recentRequests.map((r, i) => (
          <Pressable
            key={r.id}
            onPress={() => router.push({ pathname: "/requests/[id]", params: { id: r.id } })}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              paddingVertical: 12,
              borderTopWidth: i ? 1 : 0,
              borderTopColor: COLORS.lineSoft,
            }}
          >
            <View style={{ flex: 1.6 }}>
              <Text
                numberOfLines={1}
                style={{ fontWeight: "600", color: COLORS.text, fontSize: 14 }}
              >
                {r.title}
              </Text>
              <Text style={{ fontFamily: "JetBrains Mono", fontSize: 11.5, color: COLORS.text3 }}>
                {r.id}
              </Text>
            </View>
            <View style={{ flex: 1.2 }}>
              <UserCell name={r.requester.displayName} sub={r.requester.phoneNumber} />
            </View>
            <View style={{ flex: 1 }}>
              <StatusBadge status={r.status} />
            </View>
            <Text style={{ flex: 0.8, color: COLORS.text2, fontSize: 13, textAlign: "right" }}>
              {timeAgo(r.updatedAt ?? r.createdAt)}
            </Text>
          </Pressable>
        ))}
      </Card>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: color }} />
      <Text style={{ fontSize: 12.5, color: COLORS.text2 }}>{label}</Text>
    </View>
  );
}

function TrendChart({ data }: { data: { day: number; created: number; completed: number }[] }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.created, d.completed]));
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6, height: 150 }}>
      {data.map((d, i) => (
        <View key={i} style={{ flex: 1, height: "100%", justifyContent: "flex-end" }}>
          <View
            style={{
              flexDirection: "row",
              gap: 2,
              alignItems: "flex-end",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <View
              style={{
                width: "42%",
                height: `${(d.created / max) * 100}%`,
                backgroundColor: COLORS.st.violet,
                borderTopLeftRadius: 4,
                borderTopRightRadius: 4,
              }}
            />
            <View
              style={{
                width: "42%",
                height: `${(d.completed / max) * 100}%`,
                backgroundColor: COLORS.st.green,
                borderTopLeftRadius: 4,
                borderTopRightRadius: 4,
              }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}
