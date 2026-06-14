import React, { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { COLORS } from "@/theme/tokens";
import { Icon } from "./Icon";
import { useStats } from "@/hooks/useAdmin";

export type AdminRoute =
  | "/dashboard"
  | "/users"
  | "/requests"
  | "/otp"
  | "/transcription"
  | "/payments"
  | "/reports"
  | "/notifications"
  | "/send-notification"
  | "/broadcasts";
type NavLink = { type?: undefined; name: string; label: string; icon: string; route: AdminRoute };
type NavDivider = { type: "divider"; label: string };
type NavEntry = NavLink | NavDivider;

const NAV: NavEntry[] = [
  { name: "dashboard", label: "Dashboard", icon: "dashboard", route: "/dashboard" },
  { name: "users", label: "Users", icon: "users", route: "/users" },
  { name: "requests", label: "Help Requests", icon: "requests", route: "/requests" },
  { type: "divider", label: "Operations" },
  { name: "otp", label: "OTP Audit", icon: "otp", route: "/otp" },
  { name: "transcription", label: "Transcription", icon: "mic", route: "/transcription" },
  { name: "payments", label: "Payments", icon: "payments", route: "/payments" },
  { name: "reports", label: "Reports", icon: "reports", route: "/reports" },
  { type: "divider", label: "Notifications" },
  { name: "send-notification", label: "Send Notification", icon: "bell", route: "/send-notification" },
  { name: "broadcasts", label: "Broadcast History", icon: "bell", route: "/broadcasts" },
  { name: "notifications", label: "System Outbox", icon: "bell", route: "/notifications" },
];

export function Sidebar({ onLogout }: { onLogout: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: stats } = useStats();
  const badges: Record<string, number | undefined> = {
    requests: stats?.reviewRequired,
    reports: stats?.openReports,
    notifications: stats?.notificationFailures,
  };

  return (
    <View style={{ width: 256, backgroundColor: COLORS.ink, height: "100%" }}>
      {/* logo */}
      <View style={{ padding: 20, flexDirection: "row", alignItems: "center", gap: 11 }}>
        <Image
          source={require("../../assets/oolshik-logo.png")}
          style={{ width: 34, height: 34, borderRadius: 9 }}
        />
        <View>
          <Text
            style={{ color: COLORS.cream, fontWeight: "800", fontSize: 17, letterSpacing: -0.2 }}
          >
            oolshik
          </Text>
          <Text
            style={{
              color: COLORS.cream + "99",
              fontSize: 10,
              fontWeight: "600",
              letterSpacing: 1.4,
              textTransform: "uppercase",
            }}
          >
            Admin Portal
          </Text>
        </View>
      </View>

      {/* nav */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 6 }}
      >
        {NAV.map((item, i) => {
          if (item.type === "divider") {
            return (
              <Text
                key={i}
                style={{
                  fontSize: 10.5,
                  fontWeight: "700",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: COLORS.cream + "61",
                  paddingHorizontal: 12,
                  paddingTop: 18,
                  paddingBottom: 8,
                }}
              >
                {item.label}
              </Text>
            );
          }
          const active = pathname === item.route || pathname.startsWith(item.route + "/");
          const badge = badges[item.name];
          return (
            <NavItem
              key={item.name}
              item={item}
              active={active}
              badge={badge}
              onPress={() => router.push(item.route)}
            />
          );
        })}
      </ScrollView>

      {/* user + logout */}
      <View style={{ padding: 12, borderTopWidth: 1, borderTopColor: COLORS.inkLine }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 11,
            paddingHorizontal: 10,
            paddingTop: 8,
            paddingBottom: 12,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 99,
              backgroundColor: COLORS.orange,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>AD</Text>
          </View>
          <View>
            <Text style={{ fontSize: 13.5, fontWeight: "700", color: COLORS.cream }}>Admin</Text>
            <Text style={{ fontSize: 11.5, color: COLORS.cream + "80" }}>Authenticated</Text>
          </View>
        </View>
        <LogoutBtn onPress={onLogout} />
      </View>
    </View>
  );
}

function NavItem({
  item,
  active,
  badge,
  onPress,
}: {
  item: NavLink;
  active: boolean;
  badge?: number;
  onPress: () => void;
}) {
  const [hover, setHover] = useState(false);
  const bg = active ? COLORS.orange : hover ? COLORS.ink2 : "transparent";
  const fg = active ? "#fff" : hover ? COLORS.cream : COLORS.cream + "C7";
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 2,
        borderRadius: 10,
        backgroundColor: bg,
      }}
    >
      <Icon name={item.icon} size={18} color={fg} strokeWidth={active ? 2.2 : 2} />
      <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: fg }}>{item.label}</Text>
      {badge != null && badge > 0 && (
        <View
          style={{
            minWidth: 20,
            height: 20,
            paddingHorizontal: 6,
            borderRadius: 99,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: active ? "rgba(255,255,255,.25)" : COLORS.st.red,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>{badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

function LogoutBtn({ onPress }: { onPress: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        backgroundColor: hover ? COLORS.ink2 : "transparent",
      }}
    >
      <Icon name="logout" size={17} color={hover ? COLORS.cream : COLORS.cream + "B3"} />
      <Text
        style={{
          fontSize: 13.5,
          fontWeight: "600",
          color: hover ? COLORS.cream : COLORS.cream + "B3",
        }}
      >
        Log out
      </Text>
    </Pressable>
  );
}

/* ---------------- Topbar ---------------- */
export function Topbar({ crumbs }: { crumbs: { label: string; route?: AdminRoute }[] }) {
  return (
    <View
      style={{
        height: 60,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.line,
        backgroundColor: COLORS.surface,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 28,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {crumbs.map((c, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {i > 0 && <Icon name="chevR" size={14} color={COLORS.text3} />}
            {c.route ? (
              <TopbarCrumbLink route={c.route} label={c.label} />
            ) : (
              <Text style={{ color: COLORS.text, fontWeight: "700", fontSize: 13.5 }}>
                {c.label}
              </Text>
            )}
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View
            style={{ width: 7, height: 7, borderRadius: 99, backgroundColor: COLORS.st.green }}
          />
          <Text style={{ fontSize: 12.5, color: COLORS.text3 }}>API connected</Text>
        </View>
      </View>
    </View>
  );
}

function TopbarCrumbLink({ route, label }: { route: AdminRoute; label: string }) {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push(route)}>
      <Text style={{ color: COLORS.text2, fontWeight: "600", fontSize: 13.5 }}>{label}</Text>
    </Pressable>
  );
}
