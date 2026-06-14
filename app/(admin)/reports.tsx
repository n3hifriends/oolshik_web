import React, { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "@/theme/tokens";
import { fmtDate } from "@/lib/format";
import { useReports } from "@/hooks/useAdmin";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, Column } from "@/components/DataTable";
import { Button, Pill, UserCell } from "@/components/ui";
import type { AdminReportRow } from "@/api/types";

const PAGE_SIZE = 12;

export default function ReportsScreen() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const { data, isFetching } = useReports({ page, size: PAGE_SIZE });

  const columns: Column<AdminReportRow>[] = [
    {
      key: "reporter",
      label: "Reporter",
      flex: 1.3,
      render: (r) => <UserCell name={r.reporter.displayName} sub={r.reporter.phoneNumber} />,
    },
    {
      key: "target",
      label: "Target",
      flex: 1.3,
      render: (r) => (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Pill tone={r.targetType === "USER" ? "blue" : "violet"}>
            {r.targetType === "USER" ? "User" : "Request"}
          </Pill>
          <Text style={{ fontFamily: "JetBrains Mono", fontSize: 12, color: COLORS.text2 }}>
            {r.targetId}
          </Text>
        </View>
      ),
    },
    {
      key: "reason",
      label: "Reason",
      flex: 1.5,
      render: (r) => (
        <Text style={{ fontWeight: "500", color: COLORS.text, fontSize: 13.5 }}>{r.reason}</Text>
      ),
    },
    {
      key: "at",
      label: "Reported",
      flex: 1.2,
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
          label="Open"
          icon="external"
          variant="ghost"
          size="sm"
          onPress={() =>
            router.push(
              r.targetType === "REQUEST"
                ? { pathname: "/requests/[id]", params: { id: r.targetId } }
                : { pathname: "/users/[id]", params: { id: r.targetId } }
            )
          }
        />
      ),
    },
  ];

  return (
    <View>
      <PageHeader title="Reports" subtitle={`${data?.totalElements ?? 0} reports`} />
      <DataTable
        columns={columns}
        rows={data?.content ?? []}
        loading={isFetching}
        page={page}
        pageSize={PAGE_SIZE}
        totalElements={data?.totalElements ?? 0}
        totalPages={data?.totalPages ?? 1}
        onPageChange={setPage}
      />
    </View>
  );
}
