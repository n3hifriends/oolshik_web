import React, { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { COLORS, StatusTone } from "@/theme/tokens";
import { fmtDate } from "@/lib/format";
import { useReports } from "@/hooks/useAdmin";
import { FilterBar, PageHeader } from "@/components/PageHeader";
import { DataTable, Column } from "@/components/DataTable";
import { Button, Pill, UserCell } from "@/components/ui";
import type { AdminReportRow } from "@/api/types";

const PAGE_SIZE = 12;
const STATUSES = ["ALL", "OPEN", "REVIEWING", "RESOLVED", "DISMISSED"] as const;
const REASONS = ["ALL", "SPAM", "INAPPROPRIATE", "UNSAFE", "OTHER"] as const;
const TARGET_TYPES = ["ALL", "USER", "REQUEST"] as const;

export default function ReportsScreen() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("OPEN");
  const [reason, setReason] = useState<(typeof REASONS)[number]>("ALL");
  const [targetType, setTargetType] = useState<(typeof TARGET_TYPES)[number]>("ALL");
  const [search, setSearch] = useState("");

  const params = useMemo(
    () => ({
      page,
      size: PAGE_SIZE,
      status,
      reason,
      targetType,
      search: search.trim(),
    }),
    [page, status, reason, targetType, search],
  );
  const { data, isFetching } = useReports(params);

  function resetPage(next: () => void) {
    setPage(0);
    next();
  }

  const columns: Column<AdminReportRow>[] = [
    {
      key: "reporter",
      label: "Reporter",
      flex: 1.25,
      render: (r) => <UserCell name={r.reporter?.displayName ?? "Unknown"} sub={r.reporter?.phoneNumber} />,
    },
    {
      key: "target",
      label: "Target",
      flex: 1.7,
      render: (r) => (
        <View style={{ gap: 7, minWidth: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Pill tone={r.targetType === "USER" ? "blue" : "violet"}>
              {r.targetType === "USER" ? "User" : "Request"}
            </Pill>
            {r.targetStatus && <Pill tone="gray">{r.targetStatus}</Pill>}
          </View>
          <Text numberOfLines={1} style={{ fontWeight: "600", color: COLORS.text, fontSize: 13.5 }}>
            {r.targetType === "USER"
              ? r.targetUser?.displayName ?? r.targetId
              : r.targetTitle ?? r.targetId}
          </Text>
          <Text
            numberOfLines={1}
            style={{ fontFamily: "JetBrains Mono", fontSize: 11.5, color: COLORS.text3 }}
          >
            {r.targetId}
          </Text>
        </View>
      ),
    },
    {
      key: "reason",
      label: "Reason",
      flex: 1.35,
      render: (r) => (
        <View style={{ gap: 7, minWidth: 0 }}>
          <Pill tone={reasonTone(r.reason)}>{labelize(r.reason)}</Pill>
          <Text numberOfLines={2} style={{ color: COLORS.text2, fontSize: 12.5, lineHeight: 17 }}>
            {r.details || "No details provided"}
          </Text>
        </View>
      ),
    },
    {
      key: "triage",
      label: "Triage",
      flex: 1.2,
      render: (r) => (
        <View style={{ gap: 7 }}>
          <ReportStatusPill status={r.status ?? "OPEN"} />
          <Pill tone={priorityTone(r.priority)}>{labelize(r.priority)}</Pill>
        </View>
      ),
    },
    {
      key: "assigned",
      label: "Owner",
      flex: 1,
      render: (r) => (
        <Text numberOfLines={1} style={{ color: r.assignedAdmin ? COLORS.text : COLORS.text3, fontSize: 13 }}>
          {r.assignedAdmin?.displayName ?? "Unassigned"}
        </Text>
      ),
    },
    {
      key: "at",
      label: "Reported",
      flex: 1,
      render: (r) => (
        <Text style={{ color: COLORS.text2, fontSize: 13 }}>{fmtDate(r.reportedAt, true)}</Text>
      ),
    },
    {
      key: "act",
      label: "",
      flex: 0.7,
      align: "right",
      render: (r) => (
        <Button
          label="Review"
          icon="external"
          variant="ghost"
          size="sm"
          onPress={() => router.push({ pathname: "/reports/[id]", params: { id: r.id } })}
        />
      ),
    },
  ];

  return (
    <View>
      <PageHeader
        title="Reports"
        subtitle={`${data?.totalElements ?? 0} reports needing moderation`}
      />

      <FilterBar>
        <Segmented
          values={STATUSES}
          value={status}
          label={(v) => (v === "ALL" ? "All" : labelize(v))}
          onChange={(v) => resetPage(() => setStatus(v))}
        />
        <Segmented
          values={REASONS}
          value={reason}
          label={(v) => (v === "ALL" ? "All reasons" : labelize(v))}
          onChange={(v) => resetPage(() => setReason(v))}
        />
        <Segmented
          values={TARGET_TYPES}
          value={targetType}
          label={(v) => (v === "ALL" ? "All targets" : labelize(v))}
          onChange={(v) => resetPage(() => setTargetType(v))}
        />
        <TextInput
          value={search}
          onChangeText={(text) => resetPage(() => setSearch(text))}
          placeholder="Search details or UUID"
          placeholderTextColor={COLORS.text3}
          style={{
            minWidth: 240,
            height: 38,
            paddingHorizontal: 12,
            borderRadius: 9,
            borderWidth: 1,
            borderColor: COLORS.line,
            backgroundColor: COLORS.surface,
            color: COLORS.text,
            fontSize: 13.5,
          }}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={data?.content ?? []}
        loading={isFetching}
        page={page}
        pageSize={PAGE_SIZE}
        totalElements={data?.totalElements ?? 0}
        totalPages={data?.totalPages ?? 1}
        onPageChange={setPage}
        onRowPress={(row) => router.push({ pathname: "/reports/[id]", params: { id: row.id } })}
        rowHighlight={(row) => row.priority === "CRITICAL" || row.status === "OPEN"}
        empty="No reports match the current filters."
        minWidth={1120}
      />
    </View>
  );
}

function Segmented<T extends string>({
  values,
  value,
  label,
  onChange,
}: {
  values: readonly T[];
  value: T;
  label: (value: T) => string;
  onChange: (value: T) => void;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 4, padding: 3, borderRadius: 10, backgroundColor: COLORS.surface2, borderWidth: 1, borderColor: COLORS.line }}>
      {values.map((v) => {
        const active = v === value;
        return (
          <Pressable
            key={v}
            onPress={() => onChange(v)}
            style={{
              paddingHorizontal: 11,
              paddingVertical: 7,
              borderRadius: 8,
              backgroundColor: active ? COLORS.orange : "transparent",
            }}
          >
            <Text style={{ color: active ? "#fff" : COLORS.text2, fontWeight: "700", fontSize: 12 }}>
              {label(v)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ReportStatusPill({ status }: { status: string }) {
  return <Pill tone={statusTone(status)}>{labelize(status)}</Pill>;
}

function statusTone(status: string): StatusTone {
  if (status === "OPEN") return "red";
  if (status === "REVIEWING") return "amber";
  if (status === "RESOLVED") return "green";
  if (status === "DISMISSED") return "gray";
  return "gray";
}

function priorityTone(priority: string): StatusTone {
  if (priority === "CRITICAL") return "red";
  if (priority === "HIGH") return "amber";
  if (priority === "MEDIUM") return "blue";
  return "gray";
}

function reasonTone(reason: string): StatusTone {
  if (reason === "UNSAFE") return "red";
  if (reason === "INAPPROPRIATE") return "amber";
  if (reason === "SPAM") return "violet";
  return "gray";
}

function labelize(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}
