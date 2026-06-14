import React, { useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View, useWindowDimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { COLORS, STATUS_META } from "@/theme/tokens";
import { fmtDate, inr, timeAgo } from "@/lib/format";
import { useRequest } from "@/hooks/useAdmin";
import { PageHeader } from "@/components/PageHeader";
import { Avatar, Button, Card, Field, Pill, Stars, StatusBadge, UserCell } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { RequestMap } from "@/components/RequestMap";
import { ENV } from "@/lib/env";
import type { AdminRequestDetail } from "@/api/types";

type RequestField = { label: string; value: string; mono?: boolean };
type LiveRequestDetail = AdminRequestDetail & {
  offerAmount?: number | null;
  offerCurrency?: string | null;
};

function isValidGeo(geo: AdminRequestDetail["geo"]) {
  return Boolean(
    geo &&
      Number.isFinite(geo.lat) &&
      Number.isFinite(geo.lng) &&
      geo.lat >= -90 &&
      geo.lat <= 90 &&
      geo.lng >= -180 &&
      geo.lng <= 180
  );
}

function formatCoordinate(value: number) {
  return value.toFixed(5);
}

function formatRadius(radiusM: number) {
  if (!Number.isFinite(radiusM) || radiusM <= 0) return "Unavailable";
  if (radiusM >= 1000) return `${(radiusM / 1000).toFixed(radiusM % 1000 === 0 ? 0 : 1)} km`;
  return `${Math.round(radiusM)} m`;
}

function resolveAudioUrl(audioUrl: string) {
  try {
    return new URL(audioUrl, ENV.API_BASE_URL).toString();
  } catch {
    return audioUrl;
  }
}

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
  const locationAvailable = isValidGeo(req.geo);
  const requestFields: RequestField[] = [
    { label: "Reward", value: reward ? inr(reward) : "Free help" },
    { label: "Radius", value: formatRadius(req.radiusM), mono: true },
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

          <LocationServiceSection
            geo={req.geo}
            radiusM={req.radiusM}
            area={req.area}
            compact={!twoCol}
            locationAvailable={locationAvailable}
          />

          {/* audio + transcript */}
          <Card padding={20}>
            <Text style={cardTitle}>Voice request & transcript</Text>
            {req.audioUrl ? (
              <AudioPlayer audioUrl={req.audioUrl} transcript={req.transcript} />
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

function LocationServiceSection({
  geo,
  radiusM,
  area,
  compact,
  locationAvailable,
}: {
  geo: AdminRequestDetail["geo"];
  radiusM: number;
  area?: string;
  compact: boolean;
  locationAvailable: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const coordinateText = locationAvailable && geo ? `${formatCoordinate(geo.lat)}, ${formatCoordinate(geo.lng)}` : "";
  const googleMapsUrl = locationAvailable && geo ? `https://www.google.com/maps?q=${geo.lat},${geo.lng}` : "";
  const osmUrl = locationAvailable && geo ? `https://www.openstreetmap.org/?mlat=${geo.lat}&mlon=${geo.lng}#map=16/${geo.lat}/${geo.lng}` : "";

  async function copyCoordinates() {
    if (!coordinateText || typeof navigator === "undefined" || !navigator.clipboard) return;
    await navigator.clipboard.writeText(coordinateText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function openUrl(url: string) {
    if (!url || typeof window === "undefined") return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <Card padding={0} style={{ overflow: "hidden" }}>
      <View
        style={{
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.line,
          gap: 14,
        }}
      >
        <View
          style={{
            flexDirection: compact ? "column" : "row",
            justifyContent: "space-between",
            alignItems: compact ? "flex-start" : "center",
            gap: 10,
          }}
        >
          <View style={{ minWidth: 0 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.text }}>
                Location & Service Area
              </Text>
              <Pill tone={locationAvailable ? "green" : "amber"} dot>
                {locationAvailable ? "Pinned" : "Not pinned"}
              </Pill>
            </View>
            <Text style={{ marginTop: 4, color: COLORS.text3, fontSize: 12.5 }}>
              Area: {area ?? "Area not available"}
            </Text>
          </View>
          {locationAvailable && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Icon name="pin" size={13} color={COLORS.orange} />
              <Text style={{ fontFamily: "JetBrains Mono", fontSize: 12, color: COLORS.text2 }}>
                {coordinateText}
              </Text>
            </View>
          )}
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Field label="Service radius" mono>
            {formatRadius(radiusM)}
          </Field>
          {locationAvailable ? (
            <>
              <Button
                label={copied ? "Copied" : "Copy coordinates"}
                icon={copied ? "check" : "pin"}
                size="sm"
                variant="default"
                onPress={copyCoordinates}
              />
              <Button
                label="Google Maps"
                icon="external"
                size="sm"
                variant="default"
                onPress={() => openUrl(googleMapsUrl)}
              />
              <Button
                label="OpenStreetMap"
                icon="external"
                size="sm"
                variant="ghost"
                onPress={() => openUrl(osmUrl)}
              />
            </>
          ) : (
            <Text style={{ color: COLORS.text3, fontSize: 13.5, alignSelf: "center" }}>
              No location was captured for this request.
            </Text>
          )}
        </View>
      </View>

      {locationAvailable && geo ? (
        <RequestMap geo={geo} radiusM={radiusM} height={compact ? 280 : 360} />
      ) : (
        <View
          style={{
            height: compact ? 220 : 280,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: COLORS.surface2,
            padding: 20,
          }}
        >
          <Text style={{ color: COLORS.text3, fontSize: 14, textAlign: "center" }}>
            Location details will appear here when the mobile app captures coordinates.
          </Text>
        </View>
      )}
    </Card>
  );
}

function AudioPlayer({ audioUrl, transcript }: { audioUrl: string; transcript: string | null }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const audioRef = useRef<any>(null);
  const [loadStatus, setLoadStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [playing, setPlaying] = useState(false);
  const [posMs, setPosMs] = useState(0);
  const [durMs, setDurMs] = useState(0);

  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setLoadStatus("idle");
    setPlaying(false);
    setPosMs(0);
    setDurMs(0);
  }, [audioUrl]);

  React.useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  function attachListeners(audio: HTMLAudioElement) {
    audio.addEventListener("loadedmetadata", () => setDurMs(audio.duration * 1000));
    audio.addEventListener("timeupdate", () => setPosMs(audio.currentTime * 1000));
    audio.addEventListener("playing", () => {
      setLoadStatus("ready");
      setPlaying(true);
    });
    audio.addEventListener("pause", () => setPlaying(false));
    audio.addEventListener("ended", () => {
      setPlaying(false);
      setPosMs(0);
      audio.currentTime = 0;
    });
    audio.addEventListener("error", () => {
      setLoadStatus("error");
      setPlaying(false);
    });
  }

  function toggle() {
    if (audioRef.current) {
      if (playing) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => setLoadStatus("error"));
      }
      return;
    }
    if (typeof document === "undefined") return;
    setLoadStatus("loading");
    const audio = document.createElement("audio") as HTMLAudioElement;
    audio.src = resolveAudioUrl(audioUrl);
    audioRef.current = audio;
    attachListeners(audio);
    audio.play().catch(() => {
      setLoadStatus("error");
      setPlaying(false);
    });
  }

  const fmtMs = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };

  const prog = durMs > 0 ? Math.max(0, Math.min(100, (posMs / durMs) * 100)) : 0;

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
          onPress={toggle}
          style={{
            width: 40,
            height: 40,
            borderRadius: 99,
            backgroundColor: COLORS.orange,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {loadStatus === "loading" ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : playing ? (
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
              {fmtMs(posMs)}
            </Text>
            <Text style={{ fontSize: 11.5, color: COLORS.text3, fontFamily: "JetBrains Mono" }}>
              {durMs > 0 ? fmtMs(durMs) : "--:--"}
            </Text>
          </View>
        </View>
      </View>
      {loadStatus === "error" && (
        <Text style={{ color: COLORS.st.red, fontSize: 13, marginTop: 10 }}>
          Audio could not be loaded. Open the transcription screen to verify the source URL.
        </Text>
      )}
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
      {!transcript && (
        <Text style={{ color: COLORS.text3, fontSize: 13.5, marginTop: 12 }}>
          Transcript is not available yet. Check the transcription job status for processing details.
        </Text>
      )}
    </View>
  );
}
