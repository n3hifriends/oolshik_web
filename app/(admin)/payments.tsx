import React, { useState } from "react";
import { Text, View } from "react-native";
import { COLORS } from "@/theme/tokens";
import { fmtDate, inr } from "@/lib/format";
import { usePayments } from "@/hooks/useAdmin";
import { PageHeader, FilterBar } from "@/components/PageHeader";
import { Select } from "@/components/inputs";
import { DataTable, Column } from "@/components/DataTable";
import { Pill, StatCard } from "@/components/ui";
import { Icon } from "@/components/Icon";
import type { AdminPaymentRow } from "@/api/types";

const PAGE_SIZE = 12;

export default function PaymentsScreen() {
  const [status, setStatus] = useState("ALL");
  const [mode, setMode] = useState("ALL");
  const [page, setPage] = useState(0);
  const { data, isFetching } = usePayments({ page, size: PAGE_SIZE, status, mode });

  const rows: AdminPaymentRow[] = data?.content ?? [];
  const paidMarked = rows
    .filter((p) => p.status === "PAID_MARKED")
    .reduce((s, p) => s + p.amountInr, 0);
  const disputedCount = rows.filter((p) => p.status === "DISPUTED").length;
  const cancelledCount = rows.filter((p) => p.status === "CANCELLED").length;

  const columns: Column<AdminPaymentRow>[] = [
    {
      key: "id",
      label: "Payment",
      flex: 1,
      render: (p) => (
        <Text
          style={{
            fontFamily: "JetBrains Mono",
            fontWeight: "600",
            color: COLORS.text,
            fontSize: 13,
          }}
        >
          {p.id}
        </Text>
      ),
    },
    {
      key: "requestId",
      label: "Request",
      flex: 1.1,
      render: (p) => (
        <Text style={{ fontFamily: "JetBrains Mono", fontSize: 12.5, color: COLORS.text2 }}>
          {p.requestId}
        </Text>
      ),
    },
    {
      key: "flow",
      label: "Flow",
      flex: 1.3,
      render: () => (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Pill tone="blue">Neta</Pill>
          <Icon name="chevR" size={13} color={COLORS.text3} />
          <Pill tone="green">Karyakarta</Pill>
        </View>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      flex: 0.8,
      align: "right",
      render: (p) => (
        <Text
          style={{
            fontFamily: "JetBrains Mono",
            fontWeight: "700",
            color: COLORS.text,
            fontSize: 13.5,
          }}
        >
          {inr(p.amountInr)}
        </Text>
      ),
    },
    { key: "mode", label: "Mode", flex: 0.8, render: (p) => <Pill tone="violet">{p.mode}</Pill> },
    { key: "status", label: "Status", flex: 1, render: (p) => <PayStatusPill status={p.status} /> },
    {
      key: "ref",
      label: "Reference",
      flex: 1,
      render: (p) => (
        <Text style={{ fontFamily: "JetBrains Mono", fontSize: 12, color: COLORS.text3 }}>
          {p.ref}
        </Text>
      ),
    },
    {
      key: "date",
      label: "Date",
      flex: 1.2,
      render: (p) => (
        <Text style={{ color: COLORS.text2, fontSize: 13 }}>{fmtDate(p.createdAt, true)}</Text>
      ),
    },
  ];

  return (
    <View>
      <PageHeader title="Payments" subtitle={`${data?.totalElements ?? 0} transactions`} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16, marginBottom: 16 }}>
        <StatCard
          label="Paid marked (page)"
          value={inr(paidMarked)}
          icon="payments"
          tone="green"
          sub="Marked as paid"
        />
        <StatCard
          label="Disputed (page)"
          value={disputedCount}
          icon="alert"
          tone="red"
          sub="Need follow-up"
        />
        <StatCard
          label="Cancelled (page)"
          value={cancelledCount}
          icon="close"
          tone="gray"
          sub="Cancelled requests"
        />
      </View>
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
            { value: "PENDING", label: "Pending" },
            { value: "INITIATED", label: "Initiated" },
            { value: "PAID_MARKED", label: "Paid marked" },
            { value: "DISPUTED", label: "Disputed" },
            { value: "CANCELLED", label: "Cancelled" },
          ]}
        />
        <Select
          value={mode}
          onChange={(v) => {
            setMode(v);
            setPage(0);
          }}
          width={150}
          options={[
            { value: "ALL", label: "All modes" },
            { value: "MERCHANT_QR", label: "Merchant QR" },
            { value: "PAY_HELPER_DIRECT", label: "Pay helper" },
            { value: "PAY_REQUESTER_DIRECT", label: "Pay requester" },
          ]}
        />
      </FilterBar>
      <DataTable
        columns={columns}
        rows={rows}
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

function PayStatusPill({ status }: { status: AdminPaymentRow["status"] }) {
  const map = {
    PENDING: "amber",
    INITIATED: "blue",
    PAID_MARKED: "green",
    DISPUTED: "red",
    CANCELLED: "gray",
  } as const;
  const label = {
    PENDING: "Pending",
    INITIATED: "Initiated",
    PAID_MARKED: "Paid marked",
    DISPUTED: "Disputed",
    CANCELLED: "Cancelled",
  };
  return (
    <Pill tone={map[status]} dot>
      {label[status]}
    </Pill>
  );
}
