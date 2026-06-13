import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { COLORS } from "@/theme/tokens";
import { fmtDate } from "@/lib/format";
import { useTranscription } from "@/hooks/useAdmin";
import { PageHeader, FilterBar } from "@/components/PageHeader";
import { Select } from "@/components/inputs";
import { DataTable, Column } from "@/components/DataTable";
import { Button, Card, Pill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import type { AdminTranscriptionRow } from "@/api/types";

const PAGE_SIZE = 12;

export default function TranscriptionScreen() {
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data, isFetching } = useTranscription({ page, size: PAGE_SIZE, status });
  const rows: AdminTranscriptionRow[] = data?.content ?? [];

  const columns: Column<AdminTranscriptionRow>[] = [
    {
      key: "id",
      label: "Job ID",
      flex: 1,
      render: (t) => (
        <Text
          style={{
            fontFamily: "JetBrains Mono",
            fontWeight: "600",
            color: COLORS.text,
            fontSize: 13,
          }}
        >
          {t.id}
        </Text>
      ),
    },
    {
      key: "requestId",
      label: "Request",
      flex: 1.1,
      render: (t) => (
        <Text style={{ fontFamily: "JetBrains Mono", fontSize: 12.5, color: COLORS.text2 }}>
          {t.requestId}
        </Text>
      ),
    },
    {
      key: "engine",
      label: "Engine",
      flex: 1.3,
      render: (t) => (
        <Text style={{ fontFamily: "JetBrains Mono", fontSize: 12.5, color: COLORS.text }}>
          {t.engine}
        </Text>
      ),
    },
    {
      key: "language",
      label: "Lang",
      flex: 0.8,
      render: (t) => <Pill tone="blue">{t.language}</Pill>,
    },
    {
      key: "duration",
      label: "Duration",
      flex: 0.7,
      align: "right",
      render: (t) => (
        <Text style={{ fontFamily: "JetBrains Mono", color: COLORS.text, fontSize: 13.5 }}>
          {t.durationSec}s
        </Text>
      ),
    },
    { key: "status", label: "Status", flex: 1, render: (t) => <SttStatusPill status={t.status} /> },
    {
      key: "created",
      label: "Created",
      flex: 1.2,
      render: (t) => (
        <Text style={{ color: COLORS.text2, fontSize: 13 }}>{fmtDate(t.createdAt, true)}</Text>
      ),
    },
    {
      key: "exp",
      label: "",
      flex: 0.4,
      align: "right",
      render: (t) => (
        <Icon name="chevD" size={16} color={expanded === t.id ? COLORS.orange : COLORS.text3} />
      ),
    },
  ];

  const failed = rows.filter((t) => t.status === "FAILED").length;

  return (
    <View>
      <PageHeader
        title="Transcription Jobs"
        subtitle={`${data?.totalElements ?? 0} STT jobs`}
        actions={
          failed > 0 ? (
            <Button label="Retry all failed" icon="refresh" variant="default" />
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
          width={170}
          options={[
            { value: "ALL", label: "All statuses" },
            { value: "COMPLETED", label: "Completed" },
            { value: "PROCESSING", label: "Processing" },
            { value: "PENDING", label: "Pending" },
            { value: "FAILED", label: "Failed" },
          ]}
        />
        <Text style={{ fontSize: 13, color: COLORS.text3 }}>
          Tap a row to expand the transcript preview.
        </Text>
      </FilterBar>

      <DataTable
        columns={columns}
        rows={rows}
        loading={isFetching}
        onRowPress={(t) => setExpanded((e) => (e === t.id ? null : t.id))}
        page={page}
        pageSize={PAGE_SIZE}
        totalElements={data?.totalElements ?? 0}
        totalPages={data?.totalPages ?? 1}
        onPageChange={setPage}
      />

      {/* expanded preview rendered below the table for the selected row */}
      {expanded &&
        (() => {
          const t = rows.find((x) => x.id === expanded);
          if (!t) return null;
          return (
            <Card style={{ marginTop: 12 }} padding={16}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}
              >
                <Icon name="mic" size={15} color={COLORS.orange700} />
                <Text
                  style={{
                    fontFamily: "JetBrains Mono",
                    fontSize: 12.5,
                    fontWeight: "600",
                    color: COLORS.text,
                  }}
                >
                  {t.id}
                </Text>
                <SttStatusPill status={t.status} />
              </View>
              {t.status === "FAILED" ? (
                <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                  <Icon name="alert" size={16} color={COLORS.st.red} />
                  <Text style={{ color: COLORS.st.red, fontSize: 14 }}>Job failed: {t.error}</Text>
                </View>
              ) : t.status === "COMPLETED" ? (
                <Text
                  style={{
                    fontSize: 14.5,
                    lineHeight: 23,
                    fontStyle: "italic",
                    color: COLORS.text,
                  }}
                >
                  "{t.transcript}"
                </Text>
              ) : (
                <Text style={{ color: COLORS.text2, fontSize: 14 }}>
                  Transcript not ready — job is {t.status.toLowerCase()}.
                </Text>
              )}
            </Card>
          );
        })()}
    </View>
  );
}

export function SttStatusPill({ status }: { status: AdminTranscriptionRow["status"] }) {
  const map = { COMPLETED: "green", PROCESSING: "blue", PENDING: "gray", FAILED: "red" } as const;
  const label = {
    COMPLETED: "Completed",
    PROCESSING: "Processing",
    PENDING: "Pending",
    FAILED: "Failed",
  };
  return (
    <Pill tone={map[status]} dot>
      {label[status]}
    </Pill>
  );
}
