import React from "react";
import { Pressable, Text, View } from "react-native";
import { COLORS } from "@/theme/tokens";
import { Icon } from "./Icon";

export function PageHeader({
  title,
  subtitle,
  actions,
  onBack,
}: {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  onBack?: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 16,
        marginBottom: 22,
        flexWrap: "wrap",
      }}
    >
      <View
        style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, flex: 1, minWidth: 240 }}
      >
        {onBack && (
          <Pressable
            onPress={onBack}
            style={{
              marginTop: 3,
              width: 36,
              height: 36,
              borderRadius: 9,
              borderWidth: 1,
              borderColor: COLORS.line,
              backgroundColor: COLORS.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="arrowL" size={18} color={COLORS.text2} />
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          <Text
            style={{ fontSize: 25, fontWeight: "800", letterSpacing: -0.5, color: COLORS.text }}
          >
            {title}
          </Text>
          {subtitle != null &&
            (typeof subtitle === "string" ? (
              <Text style={{ marginTop: 5, fontSize: 14.5, color: COLORS.text2 }}>{subtitle}</Text>
            ) : (
              <View style={{ marginTop: 5 }}>{subtitle}</View>
            ))}
        </View>
      </View>
      {actions && (
        <View style={{ flexDirection: "row", gap: 9, alignItems: "center", flexWrap: "wrap" }}>
          {actions}
        </View>
      )}
    </View>
  );
}

export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 10,
        marginBottom: 16,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      {children}
    </View>
  );
}
