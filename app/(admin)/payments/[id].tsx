import React from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { COLORS } from "@/theme/tokens";
import { fmtDate, inr } from "@/lib/format";
import { usePayment } from "@/hooks/useAdmin";
import { PageHeader } from "@/components/PageHeader";
import { Button, Card, Field, Pill, UserCell } from "@/components/ui";
import type { AdminPaymentDetail, PaymentMode, PaymentPayerRole, PaymentStatus } from "@/api/types";

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

const STATUS_TONE: Record<PaymentStatus, "amber" | "blue" | "green" | "red" | "gray"> = {
  PENDING: "amber",
  INITIATED: "blue",
  PAID_MARKED: "green",
  DISPUTED: "red",
  CANCELLED: "gray",
};

const STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  INITIATED: "Initiated",
  PAID_MARKED: "Paid",
  DISPUTED: "Disputed",
  CANCELLED: "Cancelled",
};

export default function PaymentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const twoCol = width >= 1100;
  const { data: payment, isLoading } = usePayment(id ?? "");

  if (isLoading || !payment) {
    return (
      <View>
        <PageHeader title="Payment" onBack={() => router.push("/payments")} />
        <Text style={{ color: COLORS.text3, fontSize: 14 }}>Loading…</Text>
      </View>
    );
  }

  const paymentStatus = payment.status as PaymentStatus;
  const paymentMode = payment.mode as PaymentMode | null;

  return (
    <View>
      <PageHeader
        title="Payment detail"
        subtitle={
          <Text style={{ fontFamily: "JetBrains Mono", color: COLORS.text2, fontSize: 13 }}>
            {payment.id}
          </Text>
        }
        onBack={() => router.push("/payments")}
        actions={
          <Button
            label="Open task"
            icon="external"
            variant="default"
            onPress={() =>
              router.push({ pathname: "/requests/[id]", params: { id: payment.taskId } })
            }
          />
        }
      />

      <View style={{ flexDirection: twoCol ? "row" : "column", gap: 16, alignItems: "flex-start" }}>
        <View style={{ flex: twoCol ? 1.2 : undefined, width: twoCol ? undefined : "100%", gap: 16 }}>
          <Card padding={20}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
              {paymentStatus && (
                <Pill tone={STATUS_TONE[paymentStatus]} dot>
                  {STATUS_LABEL[paymentStatus]}
                </Pill>
              )}
              {paymentMode && (
                <Pill tone={MODE_TONE[paymentMode]}>{MODE_LABEL[paymentMode]}</Pill>
              )}
              <PayerRolePill payerRole={payment.payerRole} />
            </View>

            <View style={{ gap: 16 }}>
              <View style={{ flexDirection: "row", gap: 24, flexWrap: "wrap" }}>
                <Field label="Amount">
                  <Text style={{ fontFamily: "JetBrains Mono", fontWeight: "700", fontSize: 18, color: COLORS.text }}>
                    {payment.amountInr != null ? inr(payment.amountInr) : "—"}
                  </Text>
                  <Text style={{ fontSize: 12, color: COLORS.text3, marginTop: 2 }}>
                    {payment.currency ?? "INR"}
                  </Text>
                </Field>
                <Field label="Reference">
                  <Text style={{ fontFamily: "JetBrains Mono", fontSize: 13.5, color: COLORS.text }}>
                    {payment.ref || "—"}
                  </Text>
                </Field>
                <Field label="Format">
                  <Text style={{ fontFamily: "JetBrains Mono", fontSize: 13, color: COLORS.text2 }}>
                    {payment.format || "—"}
                  </Text>
                </Field>
              </View>

              {payment.payeeVpa && (
                <Field label="Payee VPA">
                  <Text style={{ fontFamily: "JetBrains Mono", fontSize: 13.5, color: COLORS.text }}>
                    {payment.payeeVpa}
                  </Text>
                  {payment.payeeName && (
                    <Text style={{ fontSize: 12.5, color: COLORS.text2, marginTop: 3 }}>
                      {payment.payeeName}
                    </Text>
                  )}
                </Field>
              )}

              {payment.note && (
                <Field label="Note">
                  <Text style={{ color: COLORS.text2, fontSize: 14, lineHeight: 21 }}>
                    {payment.note}
                  </Text>
                </Field>
              )}

              <View style={{ flexDirection: "row", gap: 18, flexWrap: "wrap" }}>
                <Field label="Created">{fmtDate(payment.createdAt, true)}</Field>
                <Field label="Updated">{fmtDate(payment.updatedAt, true)}</Field>
                <Field label="Expires">
                  {payment.expiresAt ? fmtDate(payment.expiresAt, true) : "—"}
                </Field>
              </View>
            </View>
          </Card>

          {payment.status === "DISPUTED" && (
            <Card padding={20}>
              <View
                style={{
                  backgroundColor: COLORS.st.red + "14",
                  borderWidth: 1,
                  borderColor: COLORS.st.red + "40",
                  borderRadius: 10,
                  padding: 14,
                  gap: 6,
                }}
              >
                <Text style={{ fontSize: 13.5, fontWeight: "700", color: COLORS.st.red }}>
                  Disputed
                </Text>
                <Text style={{ fontSize: 13, color: COLORS.text2 }}>
                  This payment has been marked as disputed by a participant. Contact both parties to resolve.
                </Text>
              </View>
            </Card>
          )}
        </View>

        <View style={{ flex: twoCol ? 1 : undefined, width: twoCol ? undefined : "100%", gap: 16 }}>
          <Card padding={20}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: COLORS.text, marginBottom: 14 }}>
              Participants
            </Text>
            <View style={{ gap: 14 }}>
              {payment.payerUser && (
                <Field label={`Payer (${payerRoleLabel(payment.payerRole)})`}>
                  <Pressable
                    onPress={() =>
                      router.push({ pathname: "/users/[id]", params: { id: payment.payerUser!.id } })
                    }
                  >
                    <UserCell
                      name={payment.payerUser.displayName}
                      sub={payment.payerUser.phoneNumber}
                    />
                  </Pressable>
                </Field>
              )}
              {payment.requesterUser && (
                <Field label="Requester (Neta)">
                  <Pressable
                    onPress={() =>
                      router.push({ pathname: "/users/[id]", params: { id: payment.requesterUser!.id } })
                    }
                  >
                    <UserCell
                      name={payment.requesterUser.displayName}
                      sub={payment.requesterUser.phoneNumber}
                    />
                  </Pressable>
                </Field>
              )}
              {payment.helperUser && (
                <Field label="Helper (Karyakarta)">
                  <Pressable
                    onPress={() =>
                      router.push({ pathname: "/users/[id]", params: { id: payment.helperUser!.id } })
                    }
                  >
                    <UserCell
                      name={payment.helperUser.displayName}
                      sub={payment.helperUser.phoneNumber}
                    />
                  </Pressable>
                </Field>
              )}
            </View>
          </Card>

          <Card padding={20}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: COLORS.text, marginBottom: 14 }}>
              Task
            </Text>
            <View style={{ gap: 8 }}>
              <Text style={{ fontFamily: "JetBrains Mono", fontSize: 12.5, color: COLORS.text3 }}>
                {payment.taskId}
              </Text>
              <Button
                label="View task"
                icon="external"
                variant="default"
                onPress={() =>
                  router.push({ pathname: "/requests/[id]", params: { id: payment.taskId } })
                }
              />
            </View>
          </Card>
        </View>
      </View>
    </View>
  );
}

function PayerRolePill({ payerRole }: { payerRole: PaymentPayerRole | null }) {
  if (payerRole === "REQUESTER") return <Pill tone="blue">Neta pays</Pill>;
  if (payerRole === "HELPER") return <Pill tone="green">Karyakarta pays</Pill>;
  return null;
}

function payerRoleLabel(payerRole: PaymentPayerRole | null): string {
  if (payerRole === "REQUESTER") return "Neta";
  if (payerRole === "HELPER") return "Karyakarta";
  return "Unknown";
}
