import React, { useState } from "react";
import { Pressable, Text, View, ViewStyle } from "react-native";
import { COLORS, ROLE_META, STATUS_META, StatusTone, tint, tintBorder } from "@/theme/tokens";
import { Icon } from "./Icon";
import type { Role } from "@/api/types";
import { webViewStyle } from "@/lib/webStyles";

/* ---------------- Pill ---------------- */
export function Pill({
  tone = "gray",
  children,
  dot,
}: {
  tone?: StatusTone;
  children: React.ReactNode;
  dot?: boolean;
}) {
  const c = COLORS.st[tone];
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: 6,
        paddingHorizontal: 9,
        paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: tint(tone),
        borderWidth: 1,
        borderColor: tintBorder(tone),
      }}
    >
      {dot && <View style={{ width: 6, height: 6, borderRadius: 99, backgroundColor: c }} />}
      <Text style={{ color: c, fontSize: 12, fontWeight: "600" }}>{children}</Text>
    </View>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? { label: status, tone: "gray" as StatusTone };
  return <Pill tone={m.tone}>{m.label}</Pill>;
}

export function RoleBadges({ roles }: { roles: Role[] }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5 }}>
      {roles.map((r) => (
        <Pill key={r} tone={ROLE_META[r].tone}>
          {ROLE_META[r].label}
        </Pill>
      ))}
    </View>
  );
}

/* ---------------- Avatar ---------------- */
const AV_HUES = ["#D5492E", "#2E9E63", "#2F6FD6", "#7B57C9", "#C98A1E", "#2E9C93"];
export function Avatar({ name, size = 34 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const c = AV_HUES[name.charCodeAt(0) % AV_HUES.length];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 99,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: c + "22",
        borderWidth: 1,
        borderColor: c + "40",
      }}
    >
      <Text style={{ color: c, fontWeight: "700", fontSize: size * 0.38 }}>{initials}</Text>
    </View>
  );
}

/* ---------------- Button ---------------- */
type BtnVariant = "primary" | "default" | "ghost" | "danger";
export function Button({
  label,
  onPress,
  variant = "default",
  size = "md",
  icon,
  full,
  style,
}: {
  label?: string;
  onPress?: () => void;
  variant?: BtnVariant;
  size?: "sm" | "md";
  icon?: string;
  full?: boolean;
  style?: ViewStyle;
}) {
  const [hover, setHover] = useState(false);
  const palette: Record<BtnVariant, { bg: string; bgH: string; fg: string; border: string }> = {
    primary: { bg: COLORS.orange, bgH: COLORS.orange600, fg: "#fff", border: "transparent" },
    default: { bg: COLORS.surface, bgH: COLORS.surface2, fg: COLORS.text, border: COLORS.line },
    ghost: { bg: "transparent", bgH: COLORS.surface2, fg: COLORS.text2, border: "transparent" },
    danger: {
      bg: "transparent",
      bgH: COLORS.st.red + "1A",
      fg: COLORS.st.red,
      border: COLORS.st.red + "4D",
    },
  };
  const p = palette[variant];
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        paddingVertical: size === "sm" ? 6 : 9,
        paddingHorizontal: size === "sm" ? 11 : 15,
        borderRadius: 9,
        borderWidth: 1,
        borderColor: p.border,
        backgroundColor: hover ? p.bgH : p.bg,
        alignSelf: full ? "stretch" : "flex-start",
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={size === "sm" ? 15 : 16} color={p.fg} />}
      {label && (
        <Text style={{ color: p.fg, fontSize: size === "sm" ? 13 : 14, fontWeight: "600" }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

/* ---------------- Card ---------------- */
export function Card({
  children,
  style,
  padding = 18,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
}) {
  return (
    <View
      style={[
        webViewStyle({
          backgroundColor: COLORS.surface,
          borderWidth: 1,
          borderColor: COLORS.line,
          borderRadius: 12,
          padding,
          boxShadow: "0 1px 2px rgba(28,23,21,.05)",
        }),
        style,
      ]}
    >
      {children}
    </View>
  );
}

/* ---------------- Field (label + value) ---------------- */
export function Field({
  label,
  children,
  mono,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 0.5,
          color: COLORS.text3,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
      {typeof children === "string" || typeof children === "number" ? (
        <Text
          style={{
            fontSize: 14,
            color: COLORS.text,
            fontWeight: "500",
            fontFamily: mono ? "JetBrains Mono" : undefined,
          }}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}

/* ---------------- StatCard ---------------- */
export function StatCard({
  label,
  value,
  icon,
  tone = "gray",
  sub,
  alert,
  onPress,
}: {
  label: string;
  value: React.ReactNode;
  icon: string;
  tone?: StatusTone;
  sub?: string;
  alert?: boolean;
  onPress?: () => void;
}) {
  const [hover, setHover] = useState(false);
  const c = COLORS.st[tone];
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={webViewStyle({
        flex: 1,
        minWidth: 200,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 18,
        borderWidth: 1,
        borderColor: alert ? COLORS.st.red + "59" : COLORS.line,
        boxShadow:
          hover && onPress
            ? "0 12px 24px -12px rgba(28,23,21,.22)"
            : "0 1px 2px rgba(28,23,21,.05)",
        transform: [{ translateY: hover && onPress ? -2 : 0 }],
      })}
    >
      <View
        style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}
      >
        <Text style={{ fontSize: 13, fontWeight: "600", color: COLORS.text2 }}>{label}</Text>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: tint(tone),
          }}
        >
          <Icon name={icon} size={18} color={c} />
        </View>
      </View>
      <Text
        style={{
          fontSize: 32,
          fontWeight: "800",
          letterSpacing: -0.5,
          marginTop: 10,
          fontFamily: "JetBrains Mono",
          color: COLORS.text,
        }}
      >
        {value}
      </Text>
      {sub && (
        <Text
          style={{
            fontSize: 12.5,
            marginTop: 4,
            fontWeight: alert ? "600" : "500",
            color: alert ? COLORS.st.red : COLORS.text3,
          }}
        >
          {sub}
        </Text>
      )}
    </Pressable>
  );
}

/* ---------------- Stars ---------------- */
export function Stars({ n }: { n: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon
          key={i}
          name="star"
          size={15}
          filled={i <= n}
          color={i <= n ? COLORS.st.amber : COLORS.line}
        />
      ))}
    </View>
  );
}

/* ---------------- UserCell ---------------- */
export function UserCell({ name, sub }: { name: string; sub?: string | null }) {
  return (
    <View style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Avatar name={name} size={32} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontWeight: "600", color: COLORS.text, fontSize: 14 }}>
          {name}
        </Text>
        {sub && (
          <Text
            numberOfLines={1}
            style={{ fontSize: 11.5, color: COLORS.text3, fontFamily: "JetBrains Mono" }}
          >
            {sub}
          </Text>
        )}
      </View>
    </View>
  );
}
