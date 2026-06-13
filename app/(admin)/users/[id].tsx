import React, { useEffect, useState } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { COLORS, ROLE_META } from "@/theme/tokens";
import { fmtDate, timeAgo } from "@/lib/format";
import { useUpdateUserRoles, useUser, useUserOtp, useUserRequests } from "@/hooks/useAdmin";
import { PageHeader } from "@/components/PageHeader";
import { Avatar, Button, Card, Field, Pill, StatusBadge } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { DataTable, Column } from "@/components/DataTable";
import type { AdminOtpAuditRow, AdminRequestSummary, AdminUserDetail, Role } from "@/api/types";

const ALL_ROLES: Role[] = ["NETA", "KARYAKARTA", "ADMIN"];
type UserField = { label: string; value: React.ReactNode; mono?: boolean };

export default function UserDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const twoCol = width >= 1040;

  const { data } = useUser(id);
  const user: AdminUserDetail | null | undefined = data;
  const { data: theirRequests } = useUserRequests(id);
  const { data: theirOtp } = useUserOtp(id, user?.phoneNumber ?? "");
  const updateRoles = useUpdateUserRoles(id);

  const [roles, setRoles] = useState<Role[]>([]);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (user) setRoles(user.roles);
  }, [user?.id]);

  if (!user) {
    return <PageHeader title="Loading user…" onBack={() => router.push("/users")} />;
  }

  const dirty = JSON.stringify([...roles].sort()) !== JSON.stringify([...user.roles].sort());
  const profileFields: UserField[] = [
    { label: "Phone", value: user.phoneNumber, mono: true },
    { label: "Email", value: user.email ?? "—" },
    { label: "Area", value: user.area },
    {
      label: "Phone verified",
      value: (
        <Pill tone={user.verified ? "green" : "amber"}>
          {user.verified ? "Verified" : "Unverified"}
        </Pill>
      ),
    },
    { label: "Requests made", value: String(user.requestsMade), mono: true },
    { label: "Jobs done", value: String(user.jobsDone), mono: true },
    { label: "Joined", value: fmtDate(user.joinedAt) },
    { label: "Last active", value: timeAgo(user.lastActiveAt) },
  ];

  function toggleRole(r: Role) {
    setSaved(false);
    setRoles((rs) => (rs.includes(r) ? rs.filter((x) => x !== r) : [...rs, r]));
  }

  const reqColumns: Column<AdminRequestSummary>[] = [
    {
      key: "title",
      label: "Request",
      flex: 2,
      render: (r) => (
        <Text style={{ fontWeight: "600", color: COLORS.text, fontSize: 13.5 }}>{r.title}</Text>
      ),
    },
    {
      key: "role",
      label: "Role",
      flex: 1,
      render: (r) =>
        r.requester.id === user.id ? (
          <Pill tone="blue">Requester</Pill>
        ) : (
          <Pill tone="green">Helper</Pill>
        ),
    },
    { key: "status", label: "Status", flex: 1.2, render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "created",
      label: "Created",
      flex: 1,
      render: (r) => (
        <Text style={{ color: COLORS.text2, fontSize: 13 }}>{fmtDate(r.createdAt)}</Text>
      ),
    },
  ];

  const otpColumns: Column<AdminOtpAuditRow>[] = [
    {
      key: "purpose",
      label: "Purpose",
      flex: 1.2,
      render: (o) => (
        <Text style={{ fontFamily: "JetBrains Mono", fontSize: 12.5, color: COLORS.text }}>
          {o.purpose}
        </Text>
      ),
    },
    {
      key: "provider",
      label: "Provider",
      flex: 1,
      render: (o) => <Text style={{ color: COLORS.text2, fontSize: 13 }}>{o.provider}</Text>,
    },
    { key: "status", label: "Status", flex: 1, render: (o) => <OtpStatusPill status={o.status} /> },
    {
      key: "when",
      label: "When",
      flex: 1,
      render: (o) => (
        <Text style={{ color: COLORS.text2, fontSize: 13 }}>{timeAgo(o.attemptedAt)}</Text>
      ),
    },
  ];

  return (
    <View>
      <PageHeader
        title={user.displayName}
        subtitle={
          <Text style={{ fontFamily: "JetBrains Mono", fontSize: 13, color: COLORS.text2 }}>
            {user.id}
          </Text>
        }
        onBack={() => router.push("/users")}
        actions={
          <Pill tone={user.status === "ACTIVE" ? "green" : "red"} dot>
            {user.status === "ACTIVE" ? "Active" : "Suspended"}
          </Pill>
        }
      />

      <View style={{ flexDirection: twoCol ? "row" : "column", gap: 16, alignItems: "flex-start" }}>
        {/* left column */}
        <View style={{ flex: twoCol ? 1 : undefined, width: twoCol ? undefined : "100%", gap: 16 }}>
          <Card padding={20}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 18 }}>
              <Avatar name={user.displayName} size={56} />
              <View>
                <Text style={{ fontSize: 18, fontWeight: "700", color: COLORS.text }}>
                  {user.displayName}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 }}>
                  <Icon name="star" size={13} filled color={COLORS.st.amber} />
                  <Text style={{ fontSize: 13, color: COLORS.text2 }}>{user.rating} rating</Text>
                </View>
              </View>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 16 }}>
              {profileFields.map(({ label, value, mono }, i) => (
                <View key={i} style={{ width: "50%" }}>
                  <Field label={label} mono={mono}>
                    {value}
                  </Field>
                </View>
              ))}
            </View>
          </Card>

          {/* federated identities */}
          <Card padding={20}>
            <Text style={cardTitle}>Federated identities</Text>
            <View style={{ gap: 10 }}>
              {user.identities.map((idn, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 11,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: COLORS.line,
                    borderRadius: 10,
                    backgroundColor: COLORS.surface2,
                  }}
                >
                  <Icon
                    name={idn.provider === "google" ? "google" : "phone"}
                    size={18}
                    color={idn.provider === "google" ? COLORS.st.red : COLORS.st.green}
                  />
                  <Text style={{ fontWeight: "600", fontSize: 14, color: COLORS.text }}>
                    {idn.provider === "google" ? "Google" : "Phone / OTP"}
                  </Text>
                  <Text
                    style={{
                      marginLeft: "auto",
                      fontSize: 12,
                      color: COLORS.text3,
                      fontFamily: "JetBrains Mono",
                    }}
                  >
                    {idn.subject}
                  </Text>
                </View>
              ))}
            </View>
          </Card>

          {/* role management */}
          <Card padding={20}>
            <Text style={cardTitle}>Role management</Text>
            <Text style={{ fontSize: 13, color: COLORS.text2, marginBottom: 14 }}>
              Toggle roles, then save.{" "}
              <Text style={{ color: COLORS.st.amber, fontWeight: "600" }}>Guardrail:</Text> the last
              ADMIN cannot be demoted.
            </Text>
            <View style={{ gap: 8 }}>
              {ALL_ROLES.map((r) => {
                const m = ROLE_META[r];
                const on = roles.includes(r);
                return (
                  <Pressable
                    key={r}
                    onPress={() => toggleRole(r)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      padding: 12,
                      borderWidth: 1,
                      borderRadius: 10,
                      borderColor: on ? COLORS.orange : COLORS.line,
                      backgroundColor: on ? COLORS.orangeSofter : COLORS.surface,
                    }}
                  >
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 5,
                        borderWidth: 2,
                        borderColor: on ? COLORS.orange : COLORS.line,
                        backgroundColor: on ? COLORS.orange : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {on && <Icon name="check" size={12} color="#fff" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "600", fontSize: 14, color: COLORS.text }}>
                        {m.label}
                      </Text>
                      <Text style={{ fontSize: 12, color: COLORS.text3 }}>{m.sub}</Text>
                    </View>
                    <Pill tone={m.tone}>{r}</Pill>
                  </Pressable>
                );
              })}
            </View>
            <View style={{ flexDirection: "row", gap: 9, marginTop: 16, alignItems: "center" }}>
              <Button
                label="Save roles"
                variant="primary"
                icon="check"
                onPress={() => {
                  updateRoles.mutate(roles, { onSuccess: () => setSaved(true) });
                }}
                style={{ opacity: dirty ? 1 : 0.5 }}
              />
              {dirty && (
                <Button label="Reset" variant="ghost" onPress={() => setRoles(user.roles)} />
              )}
              {saved && !dirty && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <Icon name="check" size={15} color={COLORS.st.green} />
                  <Text style={{ fontSize: 13, color: COLORS.st.green, fontWeight: "600" }}>
                    Saved · PATCH /users/{user.id}/roles
                  </Text>
                </View>
              )}
            </View>
          </Card>
        </View>

        {/* right column */}
        <View
          style={{ flex: twoCol ? 1.7 : undefined, width: twoCol ? undefined : "100%", gap: 16 }}
        >
          <Card padding={20}>
            <Text style={cardTitle}>Their requests & jobs</Text>
            <DataTable
              columns={reqColumns}
              rows={theirRequests ?? []}
              empty="No requests yet."
              onRowPress={(r) => router.push({ pathname: "/requests/[id]", params: { id: r.id } })}
            />
          </Card>
          <Card padding={20}>
            <Text style={cardTitle}>OTP history</Text>
            <DataTable columns={otpColumns} rows={theirOtp ?? []} empty="No OTP records." />
          </Card>
        </View>
      </View>
    </View>
  );
}

const cardTitle = {
  fontSize: 15,
  fontWeight: "700" as const,
  color: COLORS.text,
  marginBottom: 14,
};

export function OtpStatusPill({ status }: { status: AdminOtpAuditRow["status"] }) {
  const map = { VERIFIED: "green", EXPIRED: "gray", FAILED: "red", RATE_LIMITED: "amber" } as const;
  const label = {
    VERIFIED: "Verified",
    EXPIRED: "Expired",
    FAILED: "Failed",
    RATE_LIMITED: "Rate-limited",
  };
  return (
    <Pill tone={map[status]} dot={status !== "EXPIRED"}>
      {label[status]}
    </Pill>
  );
}
