import React from "react";
import Svg, { Path } from "react-native-svg";
import { COLORS } from "@/theme/tokens";

// Minimal line-icon set (same paths as the design reference).
export const ICON_PATHS: Record<string, string> = {
  dashboard: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  users:
    "M16 3.13a4 4 0 0 1 0 7.75M22 21v-2a4 4 0 0 0-3-3.87M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  requests: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
  otp: "M7 11V7a5 5 0 0 1 10 0v4M5 11h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z",
  mic: "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3",
  payments: "M2 7h20v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7zM2 10h20M6 15h4",
  reports: "M4 22V4a1 1 0 0 1 1-1h11l-2 4 2 4H5M5 22h0",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  chevR: "M9 18l6-6-6-6",
  chevL: "M15 18l-6-6 6-6",
  chevD: "M6 9l6 6 6-6",
  arrowL: "M19 12H5M12 19l-7-7 7-7",
  close: "M18 6 6 18M6 6l12 12",
  pin: "M12 21s-7-6.27-7-11a7 7 0 0 1 14 0c0 4.73-7 11-7 11zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z",
  phone:
    "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z",
  check: "M20 6 9 17l-5-5",
  alert:
    "M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
  play: "M5 3l14 9-14 9V3z",
  refresh:
    "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  external: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3",
  trend: "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6",
  google:
    "M21.35 11.1H12v3.2h5.35c-.25 1.3-1 2.4-2.13 3.14v2.6h3.44c2-1.85 3.16-4.58 3.16-7.84 0-.62-.06-1.22-.18-1.8z M12 22c2.7 0 4.96-.9 6.62-2.43l-3.44-2.6c-.95.64-2.17 1.02-3.18 1.02-2.44 0-4.5-1.65-5.24-3.87H3.2v2.43A9.99 9.99 0 0 0 12 22z M6.76 13.12a6 6 0 0 1 0-3.84V6.85H3.2a10 10 0 0 0 0 9.7l3.56-2.43z M12 5.6c1.47 0 2.78.5 3.82 1.5l2.86-2.86A9.6 9.6 0 0 0 12 2 9.99 9.99 0 0 0 3.2 6.85l3.56 2.43C7.5 7.06 9.56 5.6 12 5.6z",
};

interface IconProps {
  name: keyof typeof ICON_PATHS | string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  filled?: boolean;
}

export function Icon({
  name,
  size = 18,
  color = COLORS.text2,
  strokeWidth = 2,
  filled,
}: IconProps) {
  const path = ICON_PATHS[name] ?? "";
  const isFilled = filled || name === "google";
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={isFilled ? color : "none"}
      stroke={isFilled ? "none" : color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d={path} />
    </Svg>
  );
}
