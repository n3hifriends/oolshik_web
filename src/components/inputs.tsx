import React, { useState } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
import { COLORS } from "@/theme/tokens";
import { Icon } from "./Icon";
import { webTextStyle } from "@/lib/webStyles";

/* ---------------- SearchInput ---------------- */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  width = 300,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  width?: number;
}) {
  return (
    <View style={{ width, position: "relative", justifyContent: "center" }}>
      <View style={{ position: "absolute", left: 11, zIndex: 1 }}>
        <Icon name="search" size={16} color={COLORS.text3} />
      </View>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.text3}
        style={webTextStyle({
          width: "100%",
          paddingVertical: 9,
          paddingLeft: 34,
          paddingRight: 12,
          fontSize: 14,
          color: COLORS.text,
          backgroundColor: COLORS.surface,
          borderWidth: 1,
          borderColor: COLORS.line,
          borderRadius: 9,
          ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
        })}
      />
    </View>
  );
}

/* ---------------- Select (native <select> on web for accessibility) ---------------- */
export interface Option {
  value: string;
  label: string;
}
export function Select({
  value,
  onChange,
  options,
  width = 160,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  width?: number;
}) {
  if (Platform.OS === "web") {
    return (
      <View style={{ width, position: "relative", justifyContent: "center" }}>
        <select
          value={value}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
          style={{
            appearance: "none",
            width: "100%",
            padding: "9px 32px 9px 12px",
            fontSize: 14,
            fontWeight: 500,
            background: COLORS.surface,
            color: COLORS.text,
            border: `1px solid ${COLORS.line}`,
            borderRadius: 9,
            cursor: "pointer",
            outline: "none",
            fontFamily: "Public Sans",
          }}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <View style={{ position: "absolute", right: 10, zIndex: 1 }} pointerEvents="none">
          <Icon name="chevD" size={15} color={COLORS.text3} />
        </View>
      </View>
    );
  }
  // Native fallback: cycle through options on tap
  const idx = options.findIndex((o) => o.value === value);
  const safeIdx = idx >= 0 ? idx : 0;
  const selected = options[safeIdx];
  return (
    <Pressable
      onPress={() => {
        if (options.length === 0) return;
        onChange(options[(safeIdx + 1) % options.length].value);
      }}
      style={{
        width,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 9,
        paddingHorizontal: 12,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.line,
        borderRadius: 9,
      }}
    >
      <Text style={{ fontSize: 14, fontWeight: "500", color: COLORS.text }}>
        {selected?.label ?? ""}
      </Text>
      <Icon name="chevD" size={15} color={COLORS.text3} />
    </Pressable>
  );
}

/* ---------------- FilterChip ---------------- */
export function FilterChip({
  label,
  active,
  onPress,
  tone = COLORS.orange,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  tone?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? tone : COLORS.line,
        backgroundColor: active ? tone + "1F" : COLORS.surface,
      }}
    >
      <Text style={{ fontSize: 12.5, fontWeight: "600", color: active ? tone : COLORS.text2 }}>
        {label}
      </Text>
    </Pressable>
  );
}
