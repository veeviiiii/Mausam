import type { TimeOfDay } from "../design/tokens";
import type { Place } from "../data/types";

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/**
 * What time is it *there*, in minutes past local midnight.
 *
 * Intl does the zone conversion, so this is correct whatever the device is set
 * to — which is the point. A demo laptop in another timezone, or a user
 * checking a saved Indian city from abroad, must not change what the app says
 * about that city.
 */
export function nowMinutesInZone(timeZone: string, at: Date = new Date()): number {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(at);
    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
    const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
    // Intl renders midnight as "24" in some engines under hour12:false.
    return (hour % 24) * 60 + minute;
  } catch {
    // An unknown zone must not blank the app; fall back to the device clock
    // and say so, rather than freezing on a constant.
    console.warn(`[Mausam] unknown timeZone "${timeZone}" — using the device clock`);
    return at.getHours() * 60 + at.getMinutes();
  }
}

/**
 * Time of day comes from the location's own sunrise/sunset against the real
 * time there, never the device clock and never a baked anchor — a user
 * checking a saved destination should see that destination's day/night state.
 * CLAUDE.md is explicit about this.
 */
export function timeOfDayFor(place: Place, nowMinutes?: number): TimeOfDay {
  const now = nowMinutes ?? nowMinutesInZone(place.timeZone);
  const rise = toMinutes(place.sunrise);
  const set = toMinutes(place.sunset);

  if (now < rise - 30 || now > set + 40) return "night";
  if (now < rise + 50) return "dawn";
  if (now > set - 50) return "dusk";
  return "day";
}

export type Translate = (key: string, vars?: Record<string, string>) => string;

/** The one-line derivation, shown so the choice is never mysterious. */
export function timeOfDayReason(place: Place, tod: TimeOfDay, t: Translate): string {
  return t(`tod.reason.${tod}`, {
    rise: place.sunrise,
    set: place.sunset,
    place: place.name,
  });
}

export function relativeAge(minutes: number, t: Translate): string {
  if (minutes < 1) return t("time.justNow");
  if (minutes < 60) return t("time.minAgo", { n: String(Math.round(minutes)) });
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m
    ? t("time.hmAgo", { n: String(h), m: String(m) })
    : t("time.hAgo", { n: String(h) });
}

/**
 * How much sun a given clock time gets at this location, 0..1.
 *
 * 0 is solar midnight, 1 is solar noon, and the horizon — sunrise and sunset —
 * sits at HORIZON from both sides, so the curve is continuous across it. Day
 * and night each get their own half of the range, which is what lets the hourly
 * strip show a readable ramp through the night instead of a flat black block.
 *
 * Derived from the LOCATION's sunrise and sunset, not a fixed "06:00 is dawn"
 * assumption — same rule as timeOfDayFor above. A user checking a saved
 * destination sees that city's night, not their own.
 */
const HORIZON = 0.3;

export function solarFactor(clock: string, sunrise: string, sunset: string): number {
  const now = toMinutes(clock);
  const rise = toMinutes(sunrise);
  const set = toMinutes(sunset);
  const dayLen = Math.max(1, set - rise);
  const nightLen = Math.max(1, 1440 - dayLen);

  if (now >= rise && now <= set) {
    const u = (now - rise) / dayLen;
    return HORIZON + (1 - HORIZON) * Math.sin(Math.PI * u);
  }

  // Minutes elapsed since sunset, wrapping past midnight.
  const since = now > set ? now - set : now + 1440 - set;
  const v = Math.min(1, since / nightLen);
  return HORIZON * (1 - Math.sin(Math.PI * v));
}
