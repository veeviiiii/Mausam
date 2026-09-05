import { useEffect, useState } from "react";
import type { Alert } from "../data/types";

/**
 * Live CAP warnings for the saved places, or nothing.
 *
 * Same contract as useLiveAqi: this only ever *upgrades* the seeded warnings.
 * It never blanks the banner while it waits and never replaces a warning with
 * a spinner. If Sachet is unreachable the seeded bulletins stay on screen and
 * the app says they are seeded — a severe-weather app that shows a broken
 * screen instead of a stale warning has failed at its only job.
 *
 * Goes through /api/warnings because the feed sends no CORS headers, and
 * because CLAUDE.md keeps every weather source behind the backend anyway.
 */

export interface LiveWarnings {
  alerts: Record<string, Alert>;
  /** CAP entries in the feed, and how many matched a saved place. */
  scanned: number;
  matched: number;
  fetchedAt: string;
}

/** Survives remounts and tab switches; the route caches server-side too. */
let cached: LiveWarnings | null | undefined;
let inflight: Promise<LiveWarnings | null> | null = null;

async function load(): Promise<LiveWarnings | null> {
  const res = await fetch("/api/warnings");
  if (!res.ok) return null;
  const json = await res.json();
  if (!json?.ok) {
    // Not worth surfacing to the user — correct seeded warnings are already on
    // screen. Worth surfacing to whoever is debugging.
    console.info(`[Mausam] live CAP warnings unavailable: ${json?.reason}`);
    return null;
  }

  const alerts: Record<string, Alert> = {};
  for (const [placeId, a] of Object.entries(json.alerts as Record<string, never>)) {
    const raw = a as unknown as {
      kind: Alert["kind"];
      level: Alert["level"];
      headline: string;
      body: string;
      validUntil: string;
      issuingOffice: string;
      href: string;
      areaDesc: string;
    };
    alerts[placeId] = {
      kind: raw.kind,
      level: raw.level,
      headline: raw.headline,
      body: raw.body,
      validUntil: raw.validUntil,
      issuingOffice: raw.issuingOffice,
      live: { href: raw.href, areaDesc: raw.areaDesc, source: "NDMA Sachet CAP feed" },
    };
  }

  return {
    alerts,
    scanned: json.scanned ?? 0,
    matched: json.matched ?? 0,
    fetchedAt: json.fetchedAt ?? "",
  };
}

export function useLiveWarnings(): LiveWarnings | null {
  const [value, setValue] = useState<LiveWarnings | null>(() => cached ?? null);

  useEffect(() => {
    let alive = true;
    if (cached !== undefined) {
      setValue(cached);
      return;
    }

    if (!inflight) {
      inflight = load()
        .catch(() => null)
        .then((v) => {
          cached = v;
          inflight = null;
          return v;
        });
    }

    inflight.then((v) => {
      if (alive) setValue(v);
    });

    return () => {
      alive = false;
    };
  }, []);

  return value;
}
