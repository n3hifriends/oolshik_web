import React, { useState } from "react";
import { Text, View } from "react-native";
import { COLORS } from "@/theme/tokens";
import { fmtDate, maskPhone } from "@/lib/format";
import { useOtpAudit } from "@/hooks/useAdmin";
import { PageHeader, FilterBar } from "@/components/PageHeader";
import { SearchInput, Select } from "@/components/inputs";
import { DataTable, Column } from "@/components/DataTable";
import { OtpStatusPill } from "./users/[id]";
import type { AdminOtpAuditRow } from "@/api/types";

const PAGE_SIZE = 14;

export default function OtpAuditScreen() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(0);
  const { data, isFetching } = useOtpAudit({ page, size: PAGE_SIZE, search, status });

  const columns: Column<AdminOtpAuditRow>[] = [
    {
      key: "phone",
      label: "Phone (masked)",
      flex: 1.3,
      render: (o) => (
        <Text
          style={{
            fontFamily: "JetBrains Mono",
            fontWeight: "600",
            color: COLORS.text,
            fontSize: 13.5,
          }}
        >
          {o.maskedPhone ?? maskPhone(o.phoneNumber ?? "")}
        </Text>
      ),
    },
    {
      key: "purpose",
      label: "Purpose",
      flex: 1.1,
      render: (o) => (
        <Text style={{ fontFamily: "JetBrains Mono", fontSize: 12.5, color: COLORS.text2 }}>
          {o.action ?? o.purpose ?? "—"}
        </Text>
      ),
    },
    {
      key: "provider",
      label: "Provider",
      flex: 1,
      render: (o) => <Text style={{ color: COLORS.text2, fontSize: 13.5 }}>{o.provider}</Text>,
    },
    {
      key: "attempts",
      label: "Attempts",
      flex: 0.7,
      align: "center",
      render: (o) => (
        <Text style={{ fontFamily: "JetBrains Mono", color: COLORS.text, fontSize: 13.5 }}>
          {o.attempts ?? "—"}
        </Text>
      ),
    },
    { key: "status", label: "Status", flex: 1, render: (o) => <OtpStatusPill status={o.status} /> },
    {
      key: "at",
      label: "Attempted at",
      flex: 1.3,
      render: (o) => (
        <Text style={{ color: COLORS.text2, fontSize: 13 }}>
          {fmtDate(o.createdAt ?? o.attemptedAt ?? "", true)}
        </Text>
      ),
    },
  ];

  return (
    <View>
      <PageHeader
        title="OTP Audit Log"
        subtitle={`${data?.totalElements ?? 0} verification attempts · phone numbers masked`}
      />
      <FilterBar>
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(0);
          }}
          placeholder="Search phone or purpose…"
          width={300}
        />
        <Select
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(0);
          }}
          width={170}
          options={[
            { value: "ALL", label: "All statuses" },
            { value: "VERIFIED", label: "Verified" },
            { value: "EXPIRED", label: "Expired" },
            { value: "FAILED", label: "Failed" },
            { value: "RATE_LIMITED", label: "Rate-limited" },
          ]}
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
      />
    </View>
  );
}
