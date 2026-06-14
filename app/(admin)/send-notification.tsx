import React, { useState } from "react";
import { Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "@/theme/tokens";
import { Button, Card, Field, Pill } from "@/components/ui";
import { FilterChip, Select } from "@/components/inputs";
import { PageHeader } from "@/components/PageHeader";
import { useTemplates, useSendBroadcast } from "@/hooks/useAdmin";
import { webTextStyle } from "@/lib/webStyles";
import type { BroadcastChannel, TargetType, TemplateResponse } from "@/api/types";

const CHANNELS: { value: BroadcastChannel; label: string; icon: string }[] = [
  { value: "PUSH", label: "Push", icon: "🔔" },
  { value: "SMS", label: "SMS", icon: "💬" },
  { value: "IN_APP", label: "In-App", icon: "📥" },
];

const TARGET_OPTIONS = [
  { value: "ALL", label: "All users" },
  { value: "ROLE", label: "By role" },
  { value: "USER", label: "Single user" },
  { value: "REQUEST", label: "Help request" },
];

const ROLE_OPTIONS = [
  { value: "NETA", label: "Neta" },
  { value: "KARYAKARTA", label: "Karyakarta" },
  { value: "ADMIN", label: "Admin" },
];

export default function SendNotificationScreen() {
  const router = useRouter();
  const { data: templates } = useTemplates();
  const sendMutation = useSendBroadcast();

  const [targetType, setTargetType] = useState<TargetType>("ALL");
  const [targetValue, setTargetValue] = useState("");
  const [channels, setChannels] = useState<BroadcastChannel[]>(["PUSH", "IN_APP"]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("NONE");
  const [result, setResult] = useState<{ broadcastId: string; estimatedRecipients: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggleChannel(ch: BroadcastChannel) {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  }

  function loadTemplate(id: string) {
    if (id === "NONE") {
      setSelectedTemplate("NONE");
      return;
    }
    const tpl = templates?.find((t: TemplateResponse) => t.id === id);
    if (tpl) {
      setTitle(tpl.title);
      setBody(tpl.body);
      setSelectedTemplate(id);
    }
  }

  async function handleSend() {
    setError(null);
    setResult(null);
    if (!title.trim() || !body.trim()) {
      setError("Title and body are required.");
      return;
    }
    if (channels.length === 0) {
      setError("Select at least one channel.");
      return;
    }
    if (targetType !== "ALL" && !targetValue.trim()) {
      setError("Target value is required for this target type.");
      return;
    }
    if (saveAsTemplate && !templateName.trim()) {
      setError("Template name is required when saving as template.");
      return;
    }

    try {
      const res = await sendMutation.mutateAsync({
        targetType,
        targetValue: targetType === "ALL" ? undefined : targetValue.trim(),
        channels,
        title: title.trim(),
        body: body.trim(),
        templateId: selectedTemplate !== "NONE" ? selectedTemplate : undefined,
        saveAsTemplate,
        templateName: saveAsTemplate ? templateName.trim() : undefined,
      });
      setResult({ broadcastId: res.broadcastId, estimatedRecipients: res.estimatedRecipients });
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? "Failed to queue broadcast.";
      setError(msg);
    }
  }

  return (
    <ScrollView>
      <PageHeader
        title="Send Notification"
        subtitle="Broadcast a message to users via push, SMS, or in-app."
        actions={
          <Button
            label="View history"
            icon="bell"
            variant="default"
            onPress={() => router.push("/broadcasts")}
          />
        }
      />

      {result ? (
        <SuccessBanner
          broadcastId={result.broadcastId}
          estimatedRecipients={result.estimatedRecipients}
          onAnother={() => {
            setResult(null);
            setTitle("");
            setBody("");
            setTargetValue("");
            setTargetType("ALL");
            setChannels(["PUSH", "IN_APP"]);
            setSaveAsTemplate(false);
            setTemplateName("");
            setSelectedTemplate("NONE");
          }}
          onHistory={() => router.push("/broadcasts")}
        />
      ) : (
        <View style={{ gap: 20, maxWidth: 680 }}>
          {/* Template picker */}
          {templates && templates.length > 0 && (
            <Card>
              <Field label="Load from template">
                <Select
                  value={selectedTemplate}
                  onChange={loadTemplate}
                  width={320}
                  options={[
                    { value: "NONE", label: "— Select template —" },
                    ...templates.map((t: TemplateResponse) => ({ value: t.id, label: t.name })),
                  ]}
                />
              </Field>
            </Card>
          )}

          {/* Message */}
          <Card>
            <View style={{ gap: 18 }}>
              <Text
                style={{ fontSize: 14, fontWeight: "700", color: COLORS.text, marginBottom: 2 }}
              >
                Message
              </Text>
              <Field label="Title (max 100 chars)">
                <StyledInput
                  value={title}
                  onChange={setTitle}
                  placeholder="e.g. Event update"
                  maxLength={100}
                />
                <Text style={{ fontSize: 12, color: COLORS.text3, marginTop: 4 }}>
                  {title.length}/100
                </Text>
              </Field>
              <Field label="Body (max 1000 chars)">
                <StyledTextArea
                  value={body}
                  onChange={setBody}
                  placeholder="Write your message here…"
                  maxLength={1000}
                />
                <Text style={{ fontSize: 12, color: COLORS.text3, marginTop: 4 }}>
                  {body.length}/1000
                </Text>
              </Field>
            </View>
          </Card>

          {/* Targeting */}
          <Card>
            <View style={{ gap: 18 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: COLORS.text, marginBottom: 2 }}>
                Targeting
              </Text>
              <Field label="Send to">
                <Select
                  value={targetType}
                  onChange={(v) => {
                    const nextTargetType = v as TargetType;
                    setTargetType(nextTargetType);
                    setTargetValue(nextTargetType === "ROLE" ? "NETA" : "");
                  }}
                  width={220}
                  options={TARGET_OPTIONS}
                />
              </Field>

              {targetType === "ROLE" && (
                <Field label="Role">
                  <Select
                    value={targetValue || "NETA"}
                    onChange={setTargetValue}
                    width={220}
                    options={ROLE_OPTIONS}
                  />
                </Field>
              )}

              {(targetType === "USER" || targetType === "REQUEST") && (
                <Field label={targetType === "USER" ? "User UUID" : "Help Request UUID"}>
                  <StyledInput
                    value={targetValue}
                    onChange={setTargetValue}
                    placeholder={
                      targetType === "USER"
                        ? "e.g. 123e4567-e89b-12d3-a456-426614174000"
                        : "e.g. 123e4567-e89b-12d3-a456-426614174000"
                    }
                  />
                </Field>
              )}
            </View>
          </Card>

          {/* Channels */}
          <Card>
            <View style={{ gap: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: COLORS.text }}>
                Channels
              </Text>
              <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                {CHANNELS.map((ch) => (
                  <FilterChip
                    key={ch.value}
                    label={`${ch.icon} ${ch.label}`}
                    active={channels.includes(ch.value)}
                    onPress={() => toggleChannel(ch.value)}
                  />
                ))}
              </View>
              {channels.length === 0 && (
                <Text style={{ fontSize: 12.5, color: COLORS.st.red }}>
                  Select at least one channel.
                </Text>
              )}
            </View>
          </Card>

          {/* Save as template */}
          <Card>
            <View style={{ gap: 12 }}>
              <FilterChip
                label="💾  Save as template"
                active={saveAsTemplate}
                onPress={() => setSaveAsTemplate((v) => !v)}
              />
              {saveAsTemplate && (
                <Field label="Template name">
                  <StyledInput
                    value={templateName}
                    onChange={setTemplateName}
                    placeholder="e.g. Event reminder"
                    maxLength={100}
                  />
                </Field>
              )}
            </View>
          </Card>

          {error && (
            <View
              style={{
                backgroundColor: COLORS.st.red + "1A",
                borderWidth: 1,
                borderColor: COLORS.st.red + "59",
                borderRadius: 9,
                padding: 13,
              }}
            >
              <Text style={{ color: COLORS.st.red, fontSize: 13.5, fontWeight: "600" }}>
                {error}
              </Text>
            </View>
          )}

          <View style={{ flexDirection: "row", gap: 10 }}>
            <Button
              label={sendMutation.isPending ? "Queuing…" : "Send notification"}
              icon="bell"
              variant="primary"
              onPress={handleSend}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function SuccessBanner({
  broadcastId,
  estimatedRecipients,
  onAnother,
  onHistory,
}: {
  broadcastId: string;
  estimatedRecipients: number;
  onAnother: () => void;
  onHistory: () => void;
}) {
  return (
    <Card>
      <View style={{ gap: 14, alignItems: "flex-start" }}>
        <Pill tone="green" dot>
          Queued
        </Pill>
        <Text style={{ fontSize: 16, fontWeight: "700", color: COLORS.text }}>
          Broadcast queued successfully
        </Text>
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13.5, color: COLORS.text2 }}>
            Broadcast ID:{" "}
            <Text style={{ fontFamily: "JetBrains Mono", color: COLORS.text }}>
              {broadcastId}
            </Text>
          </Text>
          <Text style={{ fontSize: 13.5, color: COLORS.text2 }}>
            Estimated recipients:{" "}
            <Text style={{ fontWeight: "700", color: COLORS.text }}>{estimatedRecipients}</Text>
          </Text>
        </View>
        <Text style={{ fontSize: 13, color: COLORS.text3 }}>
          The scheduler will process this broadcast within seconds. Check the history for delivery
          counts.
        </Text>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
          <Button label="Send another" variant="default" onPress={onAnother} />
          <Button label="View history" variant="primary" icon="bell" onPress={onHistory} />
        </View>
      </View>
    </Card>
  );
}

function StyledInput({
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={COLORS.text3}
      maxLength={maxLength}
      style={webTextStyle({
        fontSize: 14,
        color: COLORS.text,
        backgroundColor: COLORS.canvas,
        borderWidth: 1,
        borderColor: COLORS.line,
        borderRadius: 9,
        paddingVertical: 9,
        paddingHorizontal: 12,
        ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
      })}
    />
  );
}

function StyledTextArea({
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={COLORS.text3}
      maxLength={maxLength}
      multiline
      numberOfLines={6}
      style={webTextStyle({
        fontSize: 14,
        color: COLORS.text,
        backgroundColor: COLORS.canvas,
        borderWidth: 1,
        borderColor: COLORS.line,
        borderRadius: 9,
        paddingVertical: 10,
        paddingHorizontal: 12,
        minHeight: 130,
        ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
      })}
    />
  );
}
