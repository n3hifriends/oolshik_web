import "../global.css";
import React from "react";
import { Stack } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { queryClient } from "@/lib/queryClient";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F7F6F3" } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(admin)" />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
