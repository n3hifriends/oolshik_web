import React, { useState } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { COLORS, STATUS_META } from "@/theme/tokens";
import { fmtDate, inr, timeAgo } from "@/lib/format";
import { useRequest } from "@/hooks/useAdmin";
import { PageHeader } from "@/components/PageHeader";
import { Avatar, Button, Card, Field, Pill, Stars, StatusBadge, UserCell } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { RequestMap } from "@/components/RequestMap";
import type { AdminRequestDetail } from "@/api/types";

type RequestField = { label: string; value: string; mono?: boolean };
type LiveRequestDetail = AdminRequestDetail & {
  offerAmount?: number | null;
  offerCurrency?: string | null;
};

export default function RequestDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const twoCol = width >= 1040;
  const { data } = useRequest(id);
  const req: LiveRequestDetail | null | undefined = data;

  if (!req) return <PageHeader title="Loading request…" onBack={() => router.push("/requests")} />;

  const helper = req.helper;
  const candidates = req.candidates ?? [];
  const events = req.events ?? [];
  const reward = req.rewardInr ?? req.offerAmount;
  const requestFields: RequestField[] = [
    { label: "Reward", value: reward ? inr(reward) : "Free help" },
    { label: "Radius", value: `${req.radiusM} m`, mono: true },
    { label: "Candidates", value: String(candidates.length), mono: true },
    { label: "Area", value: req.area ?? "Not available" },
    { label: "Created", value: fmtDate(req.createdAt, true) },
    { label: "Last updated", value: timeAgo(req.updatedAt ?? req.createdAt) },
  ];

  return (
    <View>
      <PageHeader
        title={req.title}
        subtitle={
          <Text style={{ fontFamily: "JetBrains Mono", fontSize: 13, color: COLORS.text2 }}>
            {req.id}
          </Text>
        }
        onBack={() => router.push("/requests")}
        actions={
          <>
            <StatusBadge status={req.status} />
            {req.status === "REVIEW_REQUIRED" && (
              <Button label="Resolve review" variant="primary" icon="check" />
            )}
          </>
        }
      />

      <View style={{ flexDirection: twoCol ? "row" : "column", gap: 16, alignItems: "flex-start" }}>
        {/* left column */}
        <View
          style={{ flex: twoCol ? 1.5 : undefined, width: twoCol ? undefined : "100%", gap: 16 }}
        >
          <Card padding={20}>
            <Text style={{ fontSize: 15, color: COLORS.text, lineHeight: 24, marginBottom: 18 }}>
              {req.description}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 16 }}>
              {requestFields.map(({ label, value, mono }, i) => (
                <View key={i} style={{ width: "33.33%" }}>
                  <Field label={label} mono={mono}>
                    {value}
                  </Field>
                </View>
              ))}
            </View>
            {req.status === "COMPLETED" && (
              <View
                style={{
                  flexDirection: "row",
                  gap: 28,
                  marginTop: 18,
                  paddingTop: 16,
                  borderTopWidth: 1,
                  borderTopColor: COLORS.lineSoft,
                }}
              >
                <Field label="Requester rating">
                  <Stars n={req.requesterRating ?? 0} />
                </Field>
                <Field label="Helper rating">
                  <Stars n={req.helperRating ?? 0} />
                </Field>
              </View>
            )}
          </Card>

          {req.geo && (
            <Card padding={0} style={{ overflow: "hidden" }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: COLORS.line,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.text }}>
                  Location & service radius
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <Icon name="pin" size={13} color={COLORS.orange} />
                  <Text style={{ fontFamily: "JetBrains Mono", fontSize: 12, color: COLORS.text2 }}>
                    {req.geo.lat}, {req.geo.lng}
                  </Text>
                </View>
              </View>
              <RequestMap geo={req.geo} radiusM={req.radiusM} />
            </Card>
          )}

          {/* audio + transcript */}
          <Card padding={20}>
            <Text style={cardTitle}>Voice request & transcript</Text>
            {req.audioUrl ? (
              <AudioPlayer transcript={req.transcript} />
            ) : (
              <Text style={{ color: COLORS.text3, fontSize: 14 }}>
                No audio attached — request was created via text.
              </Text>
            )}
          </Card>
        </View>

        {/* right column */}
        <View style={{ flex: twoCol ? 1 : undefined, width: twoCol ? undefined : "100%", gap: 16 }}>
          {/* parties */}
          <Card padding={20}>
            <Text style={cardTitle}>Parties</Text>
            <Text style={miniLabel}>Requester</Text>
            <Pressable
              onPress={() =>
                router.push({ pathname: "/users/[id]", params: { id: req.requester.id } })
              }
              style={partyBox}
            >
              <UserCell name={req.requester.displayName} sub={req.requester.phoneNumber} />
            </Pressable>
            <Text style={[miniLabel, { marginTop: 16 }]}>Helper</Text>
            {helper ? (
              <Pressable
                onPress={() => router.push({ pathname: "/users/[id]", params: { id: helper.id } })}
                style={partyBox}
              >
                <UserCell name={helper.displayName} sub={helper.phoneNumber} />
              </Pressable>
            ) : (
              <View
                style={{
                  padding: 12,
                  borderWidth: 1,
                  borderStyle: "dashed",
                  borderColor: COLORS.line,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: COLORS.text3, fontSize: 13.5 }}>Not yet assigned</Text>
              </View>
            )}
          </Card>

          {/* timeline */}
          <Card padding={20}>
            <Text style={cardTitle}>Event timeline</Text>
            {events.length === 0 && (
              <Text style={{ color: COLORS.text3, fontSize: 13.5 }}>No events available.</Text>
            )}
            {events.map((e, i) => {
              const tone = STATUS_META[e.kind]?.tone ?? "blue";
              const last = i === events.length - 1;
              return (
                <View
                  key={i}
                  style={{ flexDirection: "row", gap: 13, paddingBottom: last ? 0 : 18 }}
                >
                  <View style={{ alignItems: "center" }}>
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 99,
                        backgroundColor: COLORS.st[tone],
                        borderWidth: 3,
                        borderColor: COLORS.st[tone] + "38",
                      }}
                    />
                    {!last && (
                      <View
                        style={{ width: 2, flex: 1, backgroundColor: COLORS.line, marginTop: 2 }}
                      />
                    )}
                  </View>
                  <View style={{ flex: 1, paddingBottom: 2 }}>
                    <Text style={{ fontSize: 13.5, fontWeight: "600", color: COLORS.text }}>
                      {e.label}
                    </Text>
                    <Text style={{ fontSize: 12, color: COLORS.text3, marginTop: 2 }}>
                      {e.by} · {fmtDate(e.at, true)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </Card>

          {/* candidates */}
          <Card padding={20}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.text }}>
                Candidates
              </Text>
              <Pill tone="violet">{String(candidates.length)}</Pill>
            </View>
            {candidates.length === 0 && (
              <Text style={{ color: COLORS.text3, fontSize: 13.5 }}>
                No helpers have responded yet.
              </Text>
            )}
            <View style={{ gap: 11 }}>
              {candidates.map((c, i) => (
                <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
                  <Avatar name={c.user.displayName} size={32} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13.5, fontWeight: "600", color: COLORS.text }}>
                      {c.user.displayName}
                    </Text>
                    <Text
                      style={{ fontSize: 11.5, color: COLORS.text3, fontFamily: "JetBrains Mono" }}
                    >
                      {c.distanceM} m away · ★ {c.rating}
                    </Text>
                  </View>
                  {c.acceptedAt ? (
                    <Pill tone="green">Accepted</Pill>
                  ) : (
                    <Pill tone="gray">Pending</Pill>
                  )}
                </View>
              ))}
            </View>
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
const miniLabel = {
  fontSize: 11,
  fontWeight: "700" as const,
  letterSpacing: 0.5,
  textTransform: "uppercase" as const,
  color: COLORS.text3,
  marginBottom: 8,
};
const partyBox = {
  backgroundColor: COLORS.surface2,
  borderWidth: 1,
  borderColor: COLORS.line,
  borderRadius: 10,
  padding: 12,
};

function AudioPlayer({ transcript }: { transcript: string | null }) {
  const [playing, setPlaying] = useState(false);
  const [prog, setProg] = useState(0);

  React.useEffect(() => {
    if (!playing) return;
    const t = setInterval(
      () =>
        setProg((p) => {
          if (p >= 100) {
            setPlaying(false);
            return 0;
          }
          return p + 2;
        }),
      60
    );
    return () => clearInterval(t);
  }, [playing]);

  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 13,
          padding: 12,
          backgroundColor: COLORS.surface2,
          borderWidth: 1,
          borderColor: COLORS.line,
          borderRadius: 12,
        }}
      >
        <Pressable
          onPress={() => setPlaying((p) => !p)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 99,
            backgroundColor: COLORS.orange,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {playing ? (
            <View style={{ flexDirection: "row", gap: 3 }}>
              <View style={{ width: 4, height: 13, backgroundColor: "#fff", borderRadius: 1 }} />
              <View style={{ width: 4, height: 13, backgroundColor: "#fff", borderRadius: 1 }} />
            </View>
          ) : (
            <Icon name="play" size={17} filled color="#fff" />
          )}
        </Pressable>
        <View style={{ flex: 1 }}>
          <View
            style={{
              height: 6,
              backgroundColor: COLORS.line,
              borderRadius: 99,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                width: `${prog}%`,
                backgroundColor: COLORS.orange,
                borderRadius: 99,
              }}
            />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
            <Text style={{ fontSize: 11.5, color: COLORS.text3, fontFamily: "JetBrains Mono" }}>
              0:{String(Math.floor(prog * 0.14)).padStart(2, "0")}
            </Text>
            <Text style={{ fontSize: 11.5, color: COLORS.text3, fontFamily: "JetBrains Mono" }}>
              0:14
            </Text>
          </View>
        </View>
      </View>
      {transcript && (
        <View
          style={{
            marginTop: 14,
            padding: 14,
            backgroundColor: COLORS.orangeSofter,
            borderWidth: 1,
            borderColor: COLORS.orange + "2E",
            borderRadius: 10,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <Icon name="mic" size={13} color={COLORS.orange700} />
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 0.5,
                textTransform: "uppercase",
                color: COLORS.orange700,
              }}
            >
              Transcript
            </Text>
          </View>
          <Text style={{ fontSize: 14, color: COLORS.text, lineHeight: 22, fontStyle: "italic" }}>
            "{transcript}"
          </Text>
        </View>
      )}
    </View>
  );
}
