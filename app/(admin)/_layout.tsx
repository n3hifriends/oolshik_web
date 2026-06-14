import React, { useEffect, useState } from "react";
import { ScrollView, View, useWindowDimensions } from "react-native";
import { Redirect, Slot, usePathname, useRouter } from "expo-router";
import { COLORS } from "@/theme/tokens";
import { session } from "@/lib/session";
import { Sidebar, Topbar, type AdminRoute } from "@/components/Layout";
import { authApi } from "@/api/auth";

// Breadcrumb labels per route segment.
const TITLES: Record<AdminRoute, string> = {
  "/dashboard": "Dashboard",
  "/users": "Users",
  "/requests": "Help Requests",
  "/otp": "OTP Audit",
  "/transcription": "Transcription",
  "/payments": "Payments",
  "/reports": "Reports",
  "/notifications": "Notifications",
};

const TOP_LEVEL_ROUTES: readonly AdminRoute[] = [
  "/dashboard",
  "/users",
  "/requests",
  "/otp",
  "/transcription",
  "/payments",
  "/reports",
  "/notifications",
];
const TOP_LEVEL_ROUTE_SET = new Set<string>(TOP_LEVEL_ROUTES);

function isAdminRoute(route: string): route is AdminRoute {
  return TOP_LEVEL_ROUTE_SET.has(route);
}

function buildCrumbs(pathname: string): { label: string; route?: AdminRoute }[] {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; route?: AdminRoute }[] = [
    { label: "Oolshik", route: "/dashboard" },
  ];
  if (parts.length === 0) return crumbs;
  const topRoute = `/${parts[0]}`;
  if (isAdminRoute(topRoute)) {
    crumbs.push({ label: TITLES[topRoute], route: parts.length > 1 ? topRoute : undefined });
  } else {
    crumbs.push({ label: parts[0] });
  }
  if (parts.length > 1) crumbs.push({ label: parts[1] === "[id]" ? "Detail" : "Detail" });
  return crumbs;
}

export default function AdminLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    async function verifyAdmin() {
      if (!session.hasTokens()) {
        setAuthed(false);
        return;
      }
      try {
        const me = await authApi.me();
        if (!active) return;
        const isAdmin = me.roles.includes("ADMIN");
        if (!isAdmin) session.clear();
        setAuthed(isAdmin);
      } catch {
        session.clear();
        if (active) setAuthed(false);
      }
    }
    void verifyAdmin();
    return () => {
      active = false;
    };
  }, []);

  if (authed === false) return <Redirect href="/login" />;
  if (authed === null) return <View style={{ flex: 1, backgroundColor: COLORS.canvas }} />;

  const logout = () => {
    session.clear();
    router.replace("/login");
  };

  const wide = width >= 860;

  return (
    <View style={{ flex: 1, flexDirection: "row", backgroundColor: COLORS.canvas }}>
      {wide && <Sidebar onLogout={logout} />}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Topbar crumbs={buildCrumbs(pathname)} />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 28,
            paddingBottom: 56,
            maxWidth: 1320,
            width: "100%",
            alignSelf: "center",
          }}
        >
          <Slot />
        </ScrollView>
      </View>
    </View>
  );
}
