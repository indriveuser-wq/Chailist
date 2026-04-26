export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseHM(t: string): { h: number; m: number } | null {
  if (!t) return null;
  const parts = t.split(":");
  if (parts.length < 2) return null;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return { h, m };
}

export type OpenStatus = {
  isOpen: boolean;
  label: string; // e.g. "Open · until 9:00 PM" or "Closed · opens Mon 8:00 AM"
};

function formatTime(t: string | null | undefined): string {
  const p = t ? parseHM(t) : null;
  if (!p) return "";
  const date = new Date();
  date.setHours(p.h, p.m, 0, 0);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function getOpenStatus(
  openTime: string | null | undefined,
  closeTime: string | null | undefined,
  openDays: number[] | null | undefined,
  now: Date = new Date(),
): OpenStatus {
  if (!openTime || !closeTime || !openDays || openDays.length === 0) {
    return { isOpen: false, label: "Hours not set" };
  }
  const open = parseHM(openTime);
  const close = parseHM(closeTime);
  if (!open || !close) return { isOpen: false, label: "Hours not set" };
  const today = now.getDay();
  const minsNow = now.getHours() * 60 + now.getMinutes();
  const openMins = open.h * 60 + open.m;
  const closeMins = close.h * 60 + close.m;
  const isToday = openDays.includes(today);
  let isOpen = false;
  if (isToday) {
    if (closeMins > openMins) {
      isOpen = minsNow >= openMins && minsNow < closeMins;
    } else {
      // overnight (e.g. 18:00–02:00)
      isOpen = minsNow >= openMins || minsNow < closeMins;
    }
  }
  if (isOpen) {
    return { isOpen: true, label: `Open · until ${formatTime(closeTime)}` };
  }
  // find next open day
  for (let i = 0; i < 7; i++) {
    const d = (today + i) % 7;
    if (openDays.includes(d)) {
      if (i === 0 && minsNow < openMins) {
        return { isOpen: false, label: `Closed · opens ${formatTime(openTime)}` };
      }
      if (i > 0) {
        return {
          isOpen: false,
          label: `Closed · opens ${DAY_LABELS[d]} ${formatTime(openTime)}`,
        };
      }
    }
  }
  return { isOpen: false, label: "Closed" };
}