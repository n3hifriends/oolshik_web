import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export function fmtDate(iso: string, withTime = false): string {
  const d = dayjs(iso);
  return withTime ? d.format("D MMM YYYY, h:mm a") : d.format("D MMM YYYY");
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

export function inr(n: number): string {
  return "₹" + n.toLocaleString("en-IN");
}

// mask a phone number for the OTP audit view: +9198 1234 ••567
export function maskPhone(p: string): string {
  if (p.length < 6) return p;
  return p.slice(0, 6) + " ••" + p.slice(-3);
}
