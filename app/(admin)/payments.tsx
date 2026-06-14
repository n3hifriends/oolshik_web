import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "@/theme/tokens";
import { fmtDate, inr } from "@/lib/format";
import { usePayments } from "@/hooks/useAdmin";
import { PageHeader, FilterBar } from "@/components/PageHeader";
import { Select } from "@/components/inputs";
import { DataTable, Column } from "@/components/DataTable";
import { Pill, StatCard } from "@/components/ui";
import type { AdminPaymentRow, PaymentMode, PaymentPayerRole, PaymentStatus } from "@/api/types";

const PAGE_SIZE = 12;

const MODE_LABEL: Record<PaymentMode, string> = {
  MERCHANT_QR: "QR scan",
  PAY_HELPER_DIRECT: "Pay helper",
  PAY_REQUESTER_DIRECT: "Pay requester",
};

const MODE_TONE: Record<PaymentMode, "violet" | "teal" | "blue"> = {
  MERCHANT_QR: "violet",
  PAY_HELPER_DIRECT: "teal",
  PAY_REQUESTER_DIRECT: "blue",
};

export default function PaymentsScreen() {
  const router = useRouter();
  const [status, setStatus] = useState("ALL");
  const [mode, setMode] = useState("ALL");
  const [page, setPage] = useState(0);
  const { data, isFetching } = usePayments({ page, size: PAGE_SIZE, status, mode });

  const rows: AdminPaymentRow[] = data?.content ?? [];
  const paidMarked = rows
    .filter((p) => p.status === "PAID_MARKED")
    .reduce((s, p) => s + (p.amountInr ?? 0), 0);
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
          {p.id.slice(0, 8)}…
        </Text>
      ),
    },
    {
      key: "requestId",
      label: "Task",
      flex: 1,
      render: (p) => (
        <Pressable
          onPress={() => router.push({ pathname: "/requests/[id]", params: { id: p.requestId } })}
        >
          <Text
            style={{
              fontFamily: "JetBrains Mono",
              fontSize: 12.5,
              color: COLORS.orange,
              textDecorationLine: "underline",
            }}
          >
            {p.requestId.slice(0, 8)}…
          </Text>
        </Pressable>
      ),
    },
    {
      key: "flow",
      label: "Flow",
      flex: 1.2,
      render: (p) => <FlowCell payerRole={p.payerRole} />,
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
          {p.amountInr != null ? inr(p.amountInr) : "—"}
        </Text>
      ),
    },
    {
      key: "mode",
      label: "Mode",
      flex: 1,
      render: (p) => (
        <Pill tone={p.mode ? MODE_TONE[p.mode] : "gray"}>{p.mode ? MODE_LABEL[p.mode] : "—"}</Pill>
      ),
    },
    { key: "status", label: "Status", flex: 1, render: (p) => <PayStatusPill status={p.status} /> },
    {
      key: "ref",
      label: "Reference",
      flex: 1,
      render: (p) => (
        <Text style={{ fontFamily: "JetBrains Mono", fontSize: 12, color: COLORS.text3 }}>
          {p.ref || "—"}
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
          sub="Current page only"
        />
        <StatCard
          label="Disputed (page)"
          value={disputedCount}
          icon="alert"
          tone="red"
          sub="Current page only"
        />
        <StatCard
          label="Cancelled (page)"
          value={cancelledCount}
          icon="close"
          tone="gray"
          sub="Current page only"
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
          width={160}
          options={[
            { value: "ALL", label: "All modes" },
            { value: "MERCHANT_QR", label: "QR scan" },
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
        onRowPress={(p) => router.push({ pathname: "/payments/[id]", params: { id: p.id } })}
      />
    </View>
  );
}

function FlowCell({ payerRole }: { payerRole: PaymentPayerRole }) {
  if (payerRole === "REQUESTER") {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Pill tone="blue">Neta pays</Pill>
        <Pill tone="green">Karyakarta</Pill>
      </View>
    );
  }
  if (payerRole === "HELPER") {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Pill tone="green">Karyakarta pays</Pill>
        <Pill tone="blue">Neta</Pill>
      </View>
    );
  }
  return <Text style={{ color: COLORS.text3, fontSize: 13 }}>—</Text>;
}

function PayStatusPill({ status }: { status: PaymentStatus }) {
  const map: Record<PaymentStatus, "amber" | "blue" | "green" | "red" | "gray"> = {
    PENDING: "amber",
    INITIATED: "blue",
    PAID_MARKED: "green",
    DISPUTED: "red",
    CANCELLED: "gray",
  };
  const label: Record<PaymentStatus, string> = {
    PENDING: "Pending",
    INITIATED: "Initiated",
    PAID_MARKED: "Paid",
    DISPUTED: "Disputed",
    CANCELLED: "Cancelled",
  };
  return (
    <Pill tone={map[status]} dot>
      {label[status]}
    </Pill>
  );
}
