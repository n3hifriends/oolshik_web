// ============================================================
// Mock dataset + in-memory query helpers.
// Active when EXPO_PUBLIC_USE_MOCKS=true, so the app runs with
// zero backend. Mirrors the shapes in ./types.ts exactly.
// ============================================================
import type {
  AdminNotificationRow,
  AdminOtpAuditRow,
  AdminPaymentRow,
  AdminReportRow,
  AdminRequestDetail,
  AdminRequestSummary,
  AdminTranscriptionRow,
  AdminUserDetail,
  AdminUserSummary,
  HelpRequestStatus,
  Page,
  PageParams,
  RequestCandidate,
  RequestEvent,
  Role,
  StatsResponse,
} from "./types";

let seed = 20260613;
const rng = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const pick = <T>(a: readonly T[]): T => a[Math.floor(rng() * a.length)];
const int = (a: number, b: number) => Math.floor(rng() * (b - a + 1)) + a;

const NOW = new Date("2026-06-13T11:20:00+05:30").getTime();
const DAY = 864e5,
  HOUR = 36e5;
const ago = (ms: number) => new Date(NOW - ms).toISOString();

const FIRST = [
  "Aarav",
  "Vivaan",
  "Aditya",
  "Vihaan",
  "Arjun",
  "Sai",
  "Reyansh",
  "Ayaan",
  "Krishna",
  "Ishaan",
  "Ananya",
  "Diya",
  "Aadhya",
  "Saanvi",
  "Pari",
  "Anika",
  "Navya",
  "Rohan",
  "Karan",
  "Nikhil",
  "Rahul",
  "Pooja",
  "Meera",
  "Priya",
  "Neha",
  "Sneha",
  "Ravi",
  "Suresh",
  "Mahesh",
  "Deepak",
  "Kavya",
  "Tara",
  "Riya",
  "Aryan",
  "Dev",
  "Manish",
];
const LAST = [
  "Sharma",
  "Verma",
  "Patel",
  "Reddy",
  "Nair",
  "Iyer",
  "Gupta",
  "Mehta",
  "Rao",
  "Joshi",
  "Kulkarni",
  "Desai",
  "Kapoor",
  "Pillai",
  "Bhat",
  "Hegde",
  "Naidu",
  "Kalokhe",
];
const AREAS = [
  "Koramangala",
  "Indiranagar",
  "Jayanagar",
  "HSR Layout",
  "Whitefield",
  "BTM Layout",
  "Marathahalli",
  "JP Nagar",
  "Banashankari",
  "Malleshwaram",
  "Hebbal",
];
const TITLES = [
  "Need help carrying groceries up 3rd floor",
  "Fix a leaking kitchen tap urgently",
  "Pick up medicines from Apollo pharmacy",
  "Help moving a sofa to new flat",
  "Tutoring for class 8 maths this evening",
  "Walk my dog while I'm at hospital",
  "Set up new wifi router & extender",
  "Drop kids to school tomorrow morning",
  "Assemble flat-pack wardrobe",
  "Repair flickering tube light",
  "Garden cleanup before the monsoon",
  "Help an elderly parent with bank forms",
  "Babysit for 2 hours, urgent meeting",
  "Jump-start a car battery in basement",
  "Translate a Kannada letter to English",
];
const DESCS = [
  "Two heavy bags, lift is out of order. Should take 15 minutes.",
  "Water pooling under the sink, need someone with basic tools.",
  "Prescription ready at counter, just needs pickup and drop.",
  "Three-seater, need 2 people. Short distance.",
  "Algebra & geometry revision before exams. ~1 hour.",
  "Friendly labrador, 30 min walk around the block.",
];
const PROVIDERS = ["MSG91", "Twilio", "Gupshup"];
const PURPOSES = ["LOGIN", "PHONE_VERIFY", "WORK_AUTH", "PASSWORD_RESET"];
const ENGINES = ["whisper-large-v3", "google-stt-v2", "sarvam-saaras"];
const MODES = ["MERCHANT_QR", "PAY_HELPER_DIRECT", "PAY_REQUESTER_DIRECT"] as const;
const ROLE_OPTIONS: readonly Role[] = ["NETA", "KARYAKARTA", "ADMIN"];
const ROLE_OPTION_SET = new Set<string>(ROLE_OPTIONS);
const CHANNEL_OPTIONS: readonly AdminNotificationRow["channel"][] = ["PUSH", "SMS", "PUSH"];
const EVENTS = [
  "REQUEST_ASSIGNED",
  "WORK_AUTH_OTP",
  "WORK_DONE",
  "REVIEW_REQUIRED",
  "PAYMENT_RECEIVED",
  "NEW_CANDIDATE",
  "REQUEST_CANCELLED",
];
const REASONS = [
  "Inappropriate behaviour",
  "Spam / fake request",
  "No-show",
  "Payment dispute",
  "Safety concern",
  "Abusive language",
];
const STATUSES: HelpRequestStatus[] = [
  "DRAFT",
  "OPEN",
  "PENDING_AUTH",
  "ASSIGNED",
  "WORK_DONE_PENDING_CONFIRMATION",
  "REVIEW_REQUIRED",
  "COMPLETED",
  "CANCELLED",
];
const MAX_ATTEMPTS = 8;

const geo = () => ({
  lat: +(12.93 + (rng() - 0.5) * 0.16).toFixed(5),
  lng: +(77.62 + (rng() - 0.5) * 0.16).toFixed(5),
});
const isRole = (role: string): role is Role => ROLE_OPTION_SET.has(role);

// ---- users ----
const users: AdminUserDetail[] = Array.from({ length: 47 }, (_, i) => {
  const displayName = `${FIRST[i % FIRST.length]} ${pick(LAST)}`;
  const r = rng();
  const roles: Role[] =
    r < 0.45 ? ["NETA"] : r < 0.85 ? ["KARYAKARTA"] : r < 0.93 ? ["NETA", "KARYAKARTA"] : ["ADMIN"];
  const phoneNumber = "+9198" + int(10000000, 99999999);
  const email = rng() > 0.3 ? displayName.toLowerCase().replace(/\s+/g, ".") + "@gmail.com" : null;
  const identities: AdminUserDetail["identities"] = [];
  if (rng() > 0.4 && email) identities.push({ provider: "google", subject: email });
  identities.push({ provider: "phone", subject: phoneNumber });
  return {
    id: "usr_" + (1000 + i).toString(36) + int(100, 999),
    displayName,
    phoneNumber,
    email,
    roles,
    area: pick(AREAS),
    rating: +(3.4 + rng() * 1.6).toFixed(1),
    status: rng() > 0.08 ? "ACTIVE" : "SUSPENDED",
    joinedAt: ago(int(2, 380) * DAY),
    emailVerified: rng() > 0.12,
    languages: "kn-IN,hi-IN,en-IN",
    preferredLanguage: "kn-IN",
    requestsMade: roles.includes("NETA") ? int(0, 24) : int(0, 3),
    jobsDone: roles.includes("KARYAKARTA") ? int(0, 58) : 0,
    updatedAt: ago(int(0, 96) * HOUR),
    identities,
  };
});
const netas = users.filter((u) => u.roles.includes("NETA"));
const karyas = users.filter((u) => u.roles.includes("KARYAKARTA"));
const lite = (u: AdminUserDetail) => ({
  id: u.id,
  displayName: u.displayName,
  phoneNumber: u.phoneNumber,
});

// ---- requests ----
const requests: AdminRequestDetail[] = Array.from({ length: 64 }, (_, i) => {
  const requester = pick(netas.length ? netas : users);
  const r = rng();
  const status: HelpRequestStatus =
    r < 0.18
      ? "OPEN"
      : r < 0.3
        ? "ASSIGNED"
        : r < 0.4
          ? "PENDING_AUTH"
          : r < 0.5
            ? "WORK_DONE_PENDING_CONFIRMATION"
            : r < 0.6
              ? "REVIEW_REQUIRED"
              : r < 0.86
                ? "COMPLETED"
                : r < 0.94
                  ? "CANCELLED"
                  : "DRAFT";
  const assigned = [
    "ASSIGNED",
    "WORK_DONE_PENDING_CONFIRMATION",
    "REVIEW_REQUIRED",
    "COMPLETED",
  ].includes(status);
  const helper = assigned ? pick(karyas.length ? karyas : users) : null;
  const createdMs = int(1, 60) * DAY + int(0, 23) * HOUR;
  const g = geo();
  const hasAudio = rng() > 0.25;
  const radiusM = pick([300, 500, 800, 1000, 1500, 2000]);
  const events: RequestEvent[] = buildEvents(
    status,
    ago(createdMs),
    requester.displayName,
    helper?.displayName ?? "—"
  );
  const candidates: RequestCandidate[] = Array.from({ length: int(0, 6) }, () => {
    const k = pick(karyas.length ? karyas : users);
    return {
      user: { id: k.id, displayName: k.displayName },
      rating: k.rating,
      distanceM: int(120, radiusM),
      acceptedAt: rng() > 0.5 ? ago(int(1, 40) * HOUR) : null,
    };
  });
  return {
    id: "req_" + (5000 + i).toString(36) + int(100, 999),
    title: TITLES[i % TITLES.length],
    description: pick(DESCS),
    status,
    requester: lite(requester),
    helper: helper ? lite(helper) : null,
    area: requester.area,
    geo: g,
    radiusM,
    rewardInr: pick([0, 50, 100, 150, 200, 300]),
    requesterRating: status === "COMPLETED" ? int(3, 5) : null,
    helperRating: status === "COMPLETED" ? int(3, 5) : null,
    audioUrl: hasAudio ? "s3://oolshik-audio/" + (5000 + i) + ".m4a" : null,
    transcript: hasAudio ? pick(DESCS) : null,
    createdAt: ago(createdMs),
    updatedAt: ago(int(0, createdMs)),
    events,
    candidates,
  };
});

function buildEvents(
  status: HelpRequestStatus,
  createdAt: string,
  requester: string,
  helper: string
): RequestEvent[] {
  const base = new Date(createdAt).getTime();
  const ev: RequestEvent[] = [
    { at: new Date(base).toISOString(), kind: "CREATED", label: "Request created", by: requester },
  ];
  const order: HelpRequestStatus[] = [
    "OPEN",
    "PENDING_AUTH",
    "ASSIGNED",
    "WORK_DONE_PENDING_CONFIRMATION",
    "REVIEW_REQUIRED",
    "COMPLETED",
    "CANCELLED",
  ];
  const labels: Record<string, [string, string]> = {
    OPEN: ["Published to neighbourhood", requester],
    PENDING_AUTH: ["Work authorization OTP sent", "system"],
    ASSIGNED: ["Helper assigned", helper],
    WORK_DONE_PENDING_CONFIRMATION: ["Helper marked work done", helper],
    REVIEW_REQUIRED: ["Flagged for manual review", "system"],
    COMPLETED: ["Request completed & confirmed", requester],
    CANCELLED: ["Request cancelled", requester],
  };
  let t = base;
  const idx = order.indexOf(status);
  for (let k = 0; k <= idx; k++) {
    const s = order[k];
    if (!labels[s]) continue;
    t += int(20, 600) * 60e3;
    ev.push({ at: new Date(t).toISOString(), kind: s, label: labels[s][0], by: labels[s][1] });
  }
  return ev;
}

const otpAudit: AdminOtpAuditRow[] = Array.from({ length: 80 }, (_, i) => {
  const u = pick(users);
  const r = rng();
  return {
    id: "otp_" + (9000 + i).toString(36),
    maskedPhone: u.phoneNumber ?? "—",
    phoneNumber: u.phoneNumber,
    action: pick(PURPOSES),
    purpose: pick(PURPOSES),
    provider: pick(PROVIDERS),
    status: r < 0.78 ? "VERIFIED" : r < 0.9 ? "EXPIRED" : r < 0.96 ? "FAILED" : "RATE_LIMITED",
    detail: null,
    attempts: int(1, 5),
    createdAt: ago(int(0, 30) * DAY + int(0, 23) * HOUR),
    attemptedAt: ago(int(0, 30) * DAY + int(0, 23) * HOUR),
  };
});

const transcription: AdminTranscriptionRow[] = Array.from({ length: 52 }, (_, i) => {
  const req = pick(requests);
  const r = rng();
  const status: AdminTranscriptionRow["status"] =
    r < 0.74 ? "COMPLETED" : r < 0.86 ? "PROCESSING" : r < 0.95 ? "FAILED" : "PENDING";
  const created = int(0, 20) * DAY + int(0, 23) * HOUR;
  return {
    id: "stt_" + (3000 + i).toString(36),
    requestId: req.id,
    status,
    engine: pick(ENGINES),
    language: pick(["kn-IN", "hi-IN", "en-IN", "ta-IN"]),
    durationSec: int(4, 48),
    transcript: status === "COMPLETED" ? pick(DESCS) : null,
    error:
      status === "FAILED"
        ? pick([
            "audio decode error",
            "S3 object missing",
            "engine timeout (30s)",
            "unsupported sample rate",
          ])
        : null,
    createdAt: ago(created),
    updatedAt: ago(int(0, created)),
  };
});

const payments: AdminPaymentRow[] = Array.from({ length: 58 }, (_, i) => {
  const req = pick(requests);
  const r = rng();
  return {
    id: "pay_" + (7000 + i).toString(36),
    requestId: req.id,
    payerRole: rng() > 0.5 ? "REQUESTER" : "HELPER",
    amountInr: req.rewardInr || pick([50, 100, 150, 200]),
    mode: pick(MODES),
    status:
      r < 0.6
        ? "PAID_MARKED"
        : r < 0.75
          ? "PENDING"
          : r < 0.87
            ? "INITIATED"
            : r < 0.94
              ? "DISPUTED"
              : "CANCELLED",
    ref: "OOLP" + int(100000, 999999),
    createdAt: ago(int(0, 25) * DAY + int(0, 23) * HOUR),
  };
});

const reports: AdminReportRow[] = Array.from({ length: 34 }, (_, i) => {
  const reporter = pick(users);
  const onReq = rng() > 0.5;
  const r = rng();
  const target = onReq ? pick(requests) : pick(users);
  const status = r < 0.45 ? "OPEN" : r < 0.7 ? "REVIEWING" : r < 0.9 ? "RESOLVED" : "DISMISSED";
  return {
    id: "rep_" + (4000 + i).toString(36),
    reporter: lite(reporter),
    targetUser: onReq ? null : lite(target as (typeof users)[number]),
    targetType: onReq ? "REQUEST" : "USER",
    targetId: target.id,
    reason: pick(REASONS),
    details: rng() > 0.35 ? "Admin review requested from the mobile report flow." : null,
    status,
    priority: r < 0.12 ? "CRITICAL" : r < 0.32 ? "HIGH" : r < 0.76 ? "MEDIUM" : "LOW",
    assignedAdmin: status === "OPEN" ? null : lite(pick(users)),
    targetTitle: onReq ? (target as (typeof requests)[number]).title : null,
    targetStatus: onReq ? (target as (typeof requests)[number]).status : null,
    reportedAt: ago(int(0, 28) * DAY + int(0, 23) * HOUR),
    updatedAt: ago(int(0, 10) * DAY + int(0, 23) * HOUR),
  };
});

const notifications: AdminNotificationRow[] = Array.from({ length: 66 }, (_, i) => {
  const u = pick(users);
  const r = rng();
  let status: AdminNotificationRow["status"], attempts: number;
  if (r < 0.68) {
    status = "SENT";
    attempts = int(1, 2);
  } else if (r < 0.8) {
    status = "PENDING";
    attempts = int(1, 4);
  } else if (r < 0.9) {
    status = "RETRYING";
    attempts = int(3, 6);
  } else {
    status = "FAILED";
    attempts = MAX_ATTEMPTS;
  }
  return {
    id: "ntf_" + (6000 + i).toString(36),
    event: pick(EVENTS),
    channel: pick(CHANNEL_OPTIONS),
    recipient: lite(u),
    status,
    attempts,
    maxAttempts: MAX_ATTEMPTS,
    lastAttemptAt: ago(int(0, 12) * DAY + int(0, 23) * HOUR),
  };
});

const stats: StatsResponse = {
  totalUsers: users.length,
  netas: netas.length,
  karyakartas: karyas.length,
  admins: users.filter((u) => u.roles.includes("ADMIN")).length,
  openRequests: requests.filter((r) => r.status === "OPEN").length,
  activeRequests: requests.filter((r) =>
    ["OPEN", "PENDING_AUTH", "ASSIGNED", "WORK_DONE_PENDING_CONFIRMATION"].includes(r.status)
  ).length,
  reviewRequired: requests.filter((r) => r.status === "REVIEW_REQUIRED").length,
  completed: requests.filter((r) => r.status === "COMPLETED").length,
  sttFailures: transcription.filter((t) => t.status === "FAILED").length,
  notificationFailures: notifications.filter((n) => n.status === "FAILED").length,
  openReports: reports.filter((r) => r.status === "OPEN").length,
  paymentsCapturedInr: payments
    .filter((p) => p.status === "PAID_MARKED")
    .reduce((s, p) => s + p.amountInr, 0),
  trend: Array.from({ length: 14 }, (_, d) => ({
    day: d,
    created: int(6, 26),
    completed: int(4, 22),
  })),
};

// ---- pagination helper that emulates Spring Page<T> ----
function paginate<T>(rows: T[], p: PageParams): Page<T> {
  const size = p.size ?? 20;
  const page = p.page ?? 0;
  const content = rows.slice(page * size, page * size + size);
  return {
    content,
    totalElements: rows.length,
    totalPages: Math.max(1, Math.ceil(rows.length / size)),
    number: page,
    size,
  };
}

const delay = <T>(v: T) => new Promise<T>((res) => setTimeout(() => res(v), 220));

export const mockApi = {
  stats: () => delay(stats),

  users: (p: PageParams & { role?: string; status?: string }) => {
    let rows: AdminUserSummary[] = users;
    const role = p.role;
    if (role && role !== "ALL" && isRole(role)) rows = rows.filter((u) => u.roles.includes(role));
    if (p.status && p.status !== "ALL") rows = rows.filter((u) => u.status === p.status);
    if (p.search) {
      const s = p.search.toLowerCase();
      rows = rows.filter(
        (u) =>
          u.displayName.toLowerCase().includes(s) ||
          (u.phoneNumber ?? "").includes(p.search ?? "") ||
          (u.email ?? "").includes(s)
      );
    }
    return delay(paginate(rows, p));
  },
  user: (id: string) => delay(users.find((u) => u.id === id) ?? null),
  updateRoles: (id: string, roles: Role[]) => {
    const u = users.find((x) => x.id === id);
    if (u) u.roles = roles;
    return delay(u ?? null);
  },
  userRequests: (id: string) =>
    delay(requests.filter((r) => r.requester.id === id || r.helper?.id === id)),
  userOtp: (phone: string) => delay(otpAudit.filter((o) => o.phoneNumber === phone)),

  requests: (p: PageParams & { statuses?: string[]; days?: number }) => {
    let rows: AdminRequestSummary[] = requests;
    if (p.statuses?.length) rows = rows.filter((r) => p.statuses?.includes(r.status) ?? false);
    if (p.days)
      rows = rows.filter((r) => NOW - new Date(r.createdAt).getTime() <= (p.days ?? 0) * DAY);
    if (p.search) {
      const s = p.search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.title.toLowerCase().includes(s) ||
          r.requester.displayName.toLowerCase().includes(s) ||
          r.id.includes(p.search ?? "")
      );
    }
    rows = [...rows].sort(
      (a, b) => +new Date(b.updatedAt ?? b.createdAt) - +new Date(a.updatedAt ?? a.createdAt)
    );
    return delay(paginate(rows, p));
  },
  request: (id: string) => delay(requests.find((r) => r.id === id) ?? null),

  otpAudit: (p: PageParams & { status?: string }) => {
    let rows = otpAudit;
    if (p.status && p.status !== "ALL") rows = rows.filter((o) => o.status === p.status);
    if (p.search)
      rows = rows.filter(
        (o) =>
          (o.phoneNumber ?? o.maskedPhone).includes(p.search ?? "") ||
          (o.action ?? o.purpose ?? "").toLowerCase().includes((p.search ?? "").toLowerCase())
      );
    rows = [...rows].sort(
      (a, b) => +new Date(b.createdAt ?? b.attemptedAt ?? "") - +new Date(a.createdAt ?? a.attemptedAt ?? "")
    );
    return delay(paginate(rows, p));
  },
  transcription: (p: PageParams & { status?: string }) => {
    let rows = transcription;
    if (p.status && p.status !== "ALL") rows = rows.filter((t) => t.status === p.status);
    rows = [...rows].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return delay(paginate(rows, p));
  },
  payments: (p: PageParams & { status?: string; mode?: string }) => {
    let rows = payments;
    if (p.status && p.status !== "ALL") rows = rows.filter((x) => x.status === p.status);
    if (p.mode && p.mode !== "ALL") rows = rows.filter((x) => x.mode === p.mode);
    rows = [...rows].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return delay(paginate(rows, p));
  },
  reports: (p: PageParams & { status?: string }) => {
    let rows = reports;
    if (p.status && p.status !== "ALL") rows = rows.filter((x) => x.status === p.status);
    rows = [...rows].sort((a, b) => +new Date(b.reportedAt) - +new Date(a.reportedAt));
    return delay(paginate(rows, p));
  },
  notifications: (p: PageParams & { status?: string }) => {
    let rows = notifications;
    if (p.status && p.status !== "ALL") rows = rows.filter((x) => x.status === p.status);
    rows = [...rows].sort(
      (a, b) =>
        +new Date(b.updatedAt ?? b.lastAttemptAt ?? b.createdAt ?? "") -
        +new Date(a.updatedAt ?? a.lastAttemptAt ?? a.createdAt ?? "")
    );
    return delay(paginate(rows, p));
  },
};
