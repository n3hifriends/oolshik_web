import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { COLORS, tint, tintBorder } from "@/theme/tokens";
import { fmtDate } from "@/lib/format";
import { useRetryFailedTranscriptions, useTranscription } from "@/hooks/useAdmin";
import { PageHeader, FilterBar } from "@/components/PageHeader";
import { Select } from "@/components/inputs";
import { DataTable, Column } from "@/components/DataTable";
import { Button, Pill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { ENV } from "@/lib/env";
import type { AdminTranscriptionRow } from "@/api/types";

const PAGE_SIZE = 12;

function resolveAudioUrl(audioUrl: string) {
  try {
    return new URL(audioUrl, ENV.API_BASE_URL).toString();
  } catch {
    return audioUrl;
  }
}

export default function TranscriptionScreen() {
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);
  const { data, isFetching } = useTranscription({ page, size: PAGE_SIZE, status });
  const { data: failedData } = useTranscription({ page: 0, size: 1, status: "FAILED" });
  const retryFailed = useRetryFailedTranscriptions();
  const rows: AdminTranscriptionRow[] = data?.content ?? [];
  const selectedRow = rows.find((x) => x.id === expanded) ?? null;
  const failedTotal = failedData?.totalElements ?? 0;

  const columns: Column<AdminTranscriptionRow>[] = [
    {
      key: "id",
      label: "Job ID",
      flex: 1,
      render: (t) => (
        <Text
          style={{ fontFamily: "JetBrains Mono", fontWeight: "600", color: COLORS.text, fontSize: 13 }}
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

  async function handleRetryFailed() {
    setRetryMessage(null);
    setRetryError(null);
    try {
      const result = await retryFailed.mutateAsync();
      setRetryMessage(
        result.retried === 0
          ? "No failed transcription jobs to retry."
          : `Queued ${result.retried} failed transcription ${result.retried === 1 ? "job" : "jobs"} for retry.`
      );
      setStatus("FAILED");
      setPage(0);
    } catch (error) {
      setRetryError(error instanceof Error ? error.message : "Failed to retry transcription jobs.");
    }
  }

  return (
    <View>
      <PageHeader
        title="Transcription Jobs"
        subtitle={`${data?.totalElements ?? 0} STT jobs`}
        actions={
          failedTotal > 0 ? (
            <Button
              label={retryFailed.isPending ? "Retrying…" : `Retry all failed (${failedTotal})`}
              icon="refresh"
              variant="default"
              onPress={retryFailed.isPending ? undefined : handleRetryFailed}
            />
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
        <Text style={{ fontSize: 13, color: COLORS.text3 }}>Tap a row to view details.</Text>
      </FilterBar>

      {retryMessage ? (
        <View
          style={{
            backgroundColor: tint("green"),
            borderColor: tintBorder("green"),
            borderWidth: 1,
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <Text style={{ color: COLORS.st.green, fontSize: 13.5, fontWeight: "600" }}>
            {retryMessage}
          </Text>
        </View>
      ) : null}

      {retryError ? (
        <View
          style={{
            backgroundColor: tint("red"),
            borderColor: tintBorder("red"),
            borderWidth: 1,
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <Text style={{ color: COLORS.st.red, fontSize: 13.5, fontWeight: "600" }}>
            {retryError}
          </Text>
        </View>
      ) : null}

      {selectedRow && <SttDetailPanel t={selectedRow} onClose={() => setExpanded(null)} />}

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
    </View>
  );
}

function SttDetailPanel({ t, onClose }: { t: AdminTranscriptionRow; onClose: () => void }) {
  return (
    <View
      style={{
        backgroundColor: COLORS.surface,
        borderRadius: 10,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.orange,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 10,
      }}
    >
      <View style={{ padding: 16 }}>
        {/* Header row */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Text
            style={{
              fontFamily: "JetBrains Mono",
              fontWeight: "600",
              color: COLORS.text,
              fontSize: 12.5,
            }}
          >
            {t.id.slice(0, 8)}…
          </Text>
          <SttStatusPill status={t.status} />
          {t.engine ? <Pill tone="gray">{t.engine}</Pill> : null}
          {t.language ? <Pill tone="blue">{t.language}</Pill> : null}
          <View style={{ flex: 1 }} />
          <Pressable onPress={onClose} hitSlop={8} style={{ padding: 4 }}>
            <Icon name="close" size={15} color={COLORS.text3} />
          </Pressable>
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: COLORS.line, marginBottom: 14 }} />

        {/* Audio player or no-audio note */}
        {t.audioUrl ? (
          <SttAudioPlayer audioUrl={t.audioUrl} />
        ) : (
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}
          >
            <Icon name="mic" size={13} color={COLORS.text3} />
            <Text style={{ fontSize: 13, color: COLORS.text3 }}>No audio recorded</Text>
          </View>
        )}

        {/* Transcript block */}
        {t.transcript ? (
          <View
            style={{
              backgroundColor: COLORS.orangeSoft,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: COLORS.orange700 + "40",
              padding: 12,
              marginBottom: 12,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 6 }}
            >
              <Icon name="mic" size={11} color={COLORS.orange700} />
              <Text
                style={{
                  fontSize: 10.5,
                  fontWeight: "700",
                  color: COLORS.orange700,
                  letterSpacing: 0.8,
                }}
              >
                TRANSCRIPT
              </Text>
            </View>
            <Text
              style={{ fontSize: 14.5, lineHeight: 23, fontStyle: "italic", color: COLORS.text }}
            >
              "{t.transcript}"
            </Text>
          </View>
        ) : null}

        {/* Error block */}
        {t.status === "FAILED" && t.error ? (
          <View
            style={{
              backgroundColor: tint("red"),
              borderRadius: 8,
              borderWidth: 1,
              borderColor: tintBorder("red"),
              padding: 12,
              flexDirection: "row",
              gap: 8,
              alignItems: "flex-start",
              marginBottom: 12,
            }}
          >
            <Icon name="alert" size={15} color={COLORS.st.red} />
            <Text
              style={{ color: COLORS.st.red, fontSize: 13.5, lineHeight: 20, flex: 1 }}
            >
              {t.error}
            </Text>
          </View>
        ) : null}

        {/* Pending / processing note */}
        {(t.status === "PENDING" || t.status === "PROCESSING") && !t.transcript ? (
          <Text style={{ color: COLORS.text2, fontSize: 13.5, marginBottom: 12 }}>
            Transcript not ready — job is {t.status.toLowerCase()}.
          </Text>
        ) : null}

        {/* Metadata strip */}
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
          <Text style={{ fontSize: 12, color: COLORS.text3 }}>
            Created {fmtDate(t.createdAt, true)}
          </Text>
          <Text style={{ fontSize: 12, color: COLORS.text3 }}>·</Text>
          <Text style={{ fontSize: 12, color: COLORS.text3 }}>
            Updated {fmtDate(t.updatedAt, true)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function SttAudioPlayer({ audioUrl }: { audioUrl: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const audioRef = useRef<any>(null);
  const [loadStatus, setLoadStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [playing, setPlaying] = useState(false);
  const [posMs, setPosMs] = useState(0);
  const [durMs, setDurMs] = useState(0);
  const [trackWidth, setTrackWidth] = useState(1);

  // Reset when the URL changes (e.g. different row selected)
  useEffect(() => {
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  const attachListeners = (audio: HTMLAudioElement) => {
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
  };

  const toggle = () => {
    if (audioRef.current) {
      if (playing) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => setLoadStatus("error"));
      }
      return;
    }
    setLoadStatus("loading");
    const audio = document.createElement("audio") as HTMLAudioElement;
    audio.src = resolveAudioUrl(audioUrl);
    audioRef.current = audio;
    attachListeners(audio);
    audio.play().catch(() => {
      setLoadStatus("error");
      setPlaying(false);
    });
  };

  const seek = (locationX: number) => {
    if (!audioRef.current || durMs === 0 || trackWidth <= 1) return;
    const ratio = Math.max(0, Math.min(1, locationX / trackWidth));
    audioRef.current.currentTime = (ratio * durMs) / 1000;
    setPosMs(ratio * durMs);
  };

  const fmtMs = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };

  const progress = durMs > 0 ? Math.max(0, Math.min(1, posMs / durMs)) : 0;
  const fillWidth = Math.round(progress * trackWidth);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 }}>
      {/* Mic / Play / Pause button */}
      <Pressable
        onPress={toggle}
        style={{
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: COLORS.orange,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {loadStatus === "loading" ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : playing ? (
          <View style={{ flexDirection: "row", gap: 3 }}>
            <View style={{ width: 3, height: 14, backgroundColor: "#fff", borderRadius: 2 }} />
            <View style={{ width: 3, height: 14, backgroundColor: "#fff", borderRadius: 2 }} />
          </View>
        ) : (
          <Icon name={loadStatus === "idle" ? "mic" : "play"} size={19} color="#fff" />
        )}
      </Pressable>

      {/* Track + timestamps */}
      <View style={{ flex: 1 }}>
        <Pressable
          onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
          onPress={(e) => seek(e.nativeEvent.locationX)}
          style={{
            height: 4,
            backgroundColor: COLORS.line,
            borderRadius: 99,
            marginBottom: 6,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: fillWidth,
              backgroundColor: COLORS.orange,
              borderRadius: 99,
            }}
          />
        </Pressable>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: COLORS.text3 }}>
            {fmtMs(posMs)}
          </Text>
          {durMs > 0 ? (
            <Text style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: COLORS.text3 }}>
              {fmtMs(durMs)}
            </Text>
          ) : null}
        </View>
        {loadStatus === "error" ? (
          <Text style={{ fontSize: 12, color: COLORS.st.red, marginTop: 3 }}>
            Failed to load audio.
          </Text>
        ) : null}
      </View>
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
