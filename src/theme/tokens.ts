// Design tokens shared across components. Hex values mirror tailwind.config.js
// so they can be used in places NativeWind classes can't reach (SVG fills, Leaflet).

export const COLORS = {
  orange: "#E8612A",
  orange600: "#D9531E",
  orange700: "#BF4517",
  orangeSoft: "#FCEFE6",
  orangeSofter: "#FEF7F2",
  cream: "#F6EEE2",
  ink: "#211C18",
  ink2: "#2C2622",
  inkLine: "#3A332E",
  canvas: "#F7F6F3",
  surface: "#FFFFFF",
  surface2: "#FAF9F6",
  line: "#E7E4DF",
  lineSoft: "#F1EFEB",
  text: "#2A2522",
  text2: "#6B6560",
  text3: "#968F88",
  st: {
    gray: "#8A857F",
    blue: "#2F6FD6",
    amber: "#C98A1E",
    violet: "#7B57C9",
    teal: "#2E9C93",
    red: "#D5492E",
    green: "#2E9E63",
  },
} as const;

export type StatusTone = keyof typeof COLORS.st;

export const HELP_STATUSES = [
  "DRAFT",
  "OPEN",
  "PENDING_AUTH",
  "ASSIGNED",
  "WORK_DONE_PENDING_CONFIRMATION",
  "REVIEW_REQUIRED",
  "COMPLETED",
  "CANCELLED",
] as const;

export const STATUS_META: Record<string, { label: string; tone: StatusTone }> = {
  DRAFT: { label: "Draft", tone: "gray" },
  OPEN: { label: "Open", tone: "blue" },
  PENDING_AUTH: { label: "Pending Auth", tone: "amber" },
  ASSIGNED: { label: "Assigned", tone: "violet" },
  WORK_DONE_PENDING_CONFIRMATION: { label: "Awaiting Confirm", tone: "teal" },
  REVIEW_REQUIRED: { label: "Review Required", tone: "red" },
  COMPLETED: { label: "Completed", tone: "green" },
  CANCELLED: { label: "Cancelled", tone: "gray" },
};

export const ROLE_META: Record<string, { label: string; sub: string; tone: StatusTone }> = {
  NETA: { label: "Neta", sub: "Requester", tone: "blue" },
  KARYAKARTA: { label: "Karyakarta", sub: "Helper", tone: "green" },
  ADMIN: { label: "Admin", sub: "Staff", tone: "violet" },
};

// Tints for soft pill backgrounds (12% of hue over white, pre-computed-ish).
export function tint(tone: StatusTone): string {
  const map: Record<StatusTone, string> = {
    gray: "#F0EFED",
    blue: "#E7EFFA",
    amber: "#F8F0E2",
    violet: "#F0EBF9",
    teal: "#E4F4F2",
    red: "#FAE9E5",
    green: "#E5F4EC",
  };
  return map[tone];
}
export function tintBorder(tone: StatusTone): string {
  const map: Record<StatusTone, string> = {
    gray: "#DBD9D5",
    blue: "#C7D9F2",
    amber: "#EAD8B8",
    violet: "#D9CBF0",
    teal: "#BFE4DF",
    red: "#EFC9C0",
    green: "#BFE4CF",
  };
  return map[tone];
}
