import React, { useState } from "react";
import { Text, TextInput, View, useWindowDimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { COLORS, StatusTone } from "@/theme/tokens";
import { fmtDate } from "@/lib/format";
import {
  useAddReportAction,
  useAssignReport,
  useReport,
  useUpdateReportStatus,
} from "@/hooks/useAdmin";
import { PageHeader } from "@/components/PageHeader";
import { Button, Card, Field, Pill, UserCell } from "@/components/ui";
import type { AdminReportActionRow, AdminReportDetail } from "@/api/types";

type ReportStatus = "OPEN" | "REVIEWING" | "RESOLVED" | "DISMISSED";

export default function ReportDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const twoCol = width >= 1100;
  const { data: report, isLoading } = useReport(id ?? "");
  const statusMutation = useUpdateReportStatus(id ?? "");
  const assignMutation = useAssignReport(id ?? "");
  const actionMutation = useAddReportAction(id ?? "");
  const [note, setNote] = useState("");

  if (isLoading || !report) {
    return (
      <View>
        <PageHeader title="Report" onBack={() => router.push("/reports")} />
        <Text style={{ color: COLORS.text3, fontSize: 14 }}>Loading…</Text>
      </View>
    );
  }

  const targetLabel =
    report.targetType === "USER"
      ? report.targetUser?.displayName ?? report.targetId
      : report.targetTitle ?? report.targetId;
  const busy = statusMutation.isPending || assignMutation.isPending || actionMutation.isPending;

  async function setStatus(status: ReportStatus) {
    await statusMutation.mutateAsync({ status, note: note.trim() || undefined });
    setNote("");
  }

  async function addNote() {
    if (!note.trim()) return;
    await actionMutation.mutateAsync({ action: "NOTE", note: note.trim() });
    setNote("");
  }

  return (
    <View>
      <PageHeader
        title="Report Review"
        subtitle={
          <Text style={{ fontFamily: "JetBrains Mono", color: COLORS.text2, fontSize: 13 }}>
            {report.id}
          </Text>
        }
        onBack={() => router.push("/reports")}
        actions={
          <>
            <Button
              label="Open target"
              icon="external"
              onPress={() =>
                router.push(
                  report.targetType === "REQUEST"
                    ? { pathname: "/requests/[id]", params: { id: report.targetId } }
                    : { pathname: "/users/[id]", params: { id: report.targetId } },
                )
              }
            />
            <Button
              label="Assign to me"
              icon="users"
              variant="primary"
              onPress={() => assignMutation.mutate(undefined)}
            />
          </>
        }
      />

      <View style={{ flexDirection: twoCol ? "row" : "column", gap: 16, alignItems: "flex-start" }}>
        <View style={{ flex: twoCol ? 1.2 : undefined, width: twoCol ? undefined : "100%", gap: 16 }}>
          <Card padding={20}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
              <ReportStatusPill status={report.status ?? "OPEN"} />
              <Pill tone={priorityTone(report.priority)}>{labelize(report.priority)}</Pill>
              <Pill tone={reasonTone(report.reason)}>{labelize(report.reason)}</Pill>
            </View>
            <View style={{ gap: 16 }}>
              <Field label="Reporter">
                <UserCell
                  name={report.reporter?.displayName ?? "Unknown reporter"}
                  sub={report.reporter?.phoneNumber}
                />
              </Field>
              <Field label="Target">
                <View style={{ gap: 6 }}>
                  <Text style={{ color: COLORS.text, fontWeight: "700", fontSize: 15 }}>{targetLabel}</Text>
                  <Text style={{ color: COLORS.text3, fontFamily: "JetBrains Mono", fontSize: 12 }}>
                    {report.targetType} · {report.targetId}
                  </Text>
                  {report.targetStatus && <Pill tone="gray">{report.targetStatus}</Pill>}
                </View>
              </Field>
              <Field label="Report details">
                <Text style={{ color: report.details ? COLORS.text : COLORS.text3, fontSize: 14, lineHeight: 21 }}>
                  {report.details || "No details provided."}
                </Text>
              </Field>
              <View style={{ flexDirection: "row", gap: 18, flexWrap: "wrap" }}>
                <Field label="Reported">{fmtDate(report.reportedAt, true)}</Field>
                <Field label="Updated">{fmtDate(report.updatedAt, true)}</Field>
                <Field label="Owner">{report.assignedAdmin?.displayName ?? "Unassigned"}</Field>
                <Field label="Resolved">{report.resolvedAt ? fmtDate(report.resolvedAt, true) : "—"}</Field>
              </View>
              {report.resolutionNote && (
                <Field label="Resolution note">
                  <Text style={{ color: COLORS.text2, fontSize: 14, lineHeight: 21 }}>
                    {report.resolutionNote}
                  </Text>
                </Field>
              )}
            </View>
          </Card>

          <Card padding={20}>
            <Text style={cardTitle}>Audit trail</Text>
            <View style={{ gap: 10 }}>
              {report.actions.length === 0 && (
                <Text style={{ color: COLORS.text3, fontSize: 13 }}>No moderation actions yet.</Text>
              )}
              {report.actions.map((action: AdminReportActionRow) => (
                <View
                  key={action.id}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: COLORS.line,
                    backgroundColor: COLORS.surface2,
                    gap: 6,
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
                    <Text style={{ color: COLORS.text, fontWeight: "700", fontSize: 13.5 }}>
                      {labelize(action.action)}
                    </Text>
                    <Text style={{ color: COLORS.text3, fontSize: 12 }}>
                      {fmtDate(action.createdAt, true)}
                    </Text>
                  </View>
                  <Text style={{ color: COLORS.text2, fontSize: 13 }}>
                    {action.admin?.displayName ?? "Admin"} · {action.fromStatus ?? "—"} → {action.toStatus ?? "—"}
                  </Text>
                  {action.note && (
                    <Text style={{ color: COLORS.text2, fontSize: 13, lineHeight: 19 }}>{action.note}</Text>
                  )}
                </View>
              ))}
            </View>
          </Card>
        </View>

        <View style={{ flex: twoCol ? 0.8 : undefined, width: twoCol ? undefined : "100%", gap: 16 }}>
          <Card padding={20}>
            <Text style={cardTitle}>Moderation action</Text>
            <Text style={{ color: COLORS.text2, fontSize: 13, lineHeight: 19, marginBottom: 12 }}>
              Add a note before resolving or dismissing. Notes are stored in the report audit trail.
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              multiline
              placeholder="Internal note or resolution reason"
              placeholderTextColor={COLORS.text3}
              style={{
                minHeight: 110,
                textAlignVertical: "top",
                borderWidth: 1,
                borderColor: COLORS.line,
                borderRadius: 10,
                backgroundColor: COLORS.surface2,
                padding: 12,
                color: COLORS.text,
                fontSize: 14,
                lineHeight: 20,
                marginBottom: 14,
              }}
            />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              <Button label="Add note" onPress={addNote} disabled={busy || !note.trim()} />
              <Button label="Reviewing" onPress={() => setStatus("REVIEWING")} disabled={busy} />
              <Button label="Resolve" variant="primary" onPress={() => setStatus("RESOLVED")} disabled={busy} />
              <Button label="Dismiss" variant="danger" onPress={() => setStatus("DISMISSED")} disabled={busy} />
              {report.status !== "OPEN" && (
                <Button label="Reopen" onPress={() => setStatus("OPEN")} disabled={busy} />
              )}
            </View>
          </Card>

          <ContextCard report={report} />
        </View>
      </View>
    </View>
  );
}

function ContextCard({ report }: { report: AdminReportDetail }) {
  return (
    <Card padding={20}>
      <Text style={cardTitle}>Context</Text>
      <View style={{ gap: 12 }}>
        <Field label="Reason">{labelize(report.reason)}</Field>
        <Field label="Priority">
          <Pill tone={priorityTone(report.priority)}>{labelize(report.priority)}</Pill>
        </Field>
        <Field label="Target type">{report.targetType}</Field>
        <Field label="Target title">{report.targetTitle ?? "—"}</Field>
        <Field label="Target user">
          <Text style={{ color: COLORS.text2, fontSize: 14 }}>
            {report.targetUser?.displayName ?? "—"}
          </Text>
        </Field>
      </View>
    </Card>
  );
}

function ReportStatusPill({ status }: { status: string }) {
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

const cardTitle = {
  fontSize: 16,
  fontWeight: "700" as const,
  color: COLORS.text,
  marginBottom: 14,
};
