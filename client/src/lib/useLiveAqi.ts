import { useEffect, useState } from "react";

/**
 * The live CPCB reading for one city, or nothing.
 *
 * "Or nothing" is the important half. The seeded value in data/seed.ts is the
 * floor: it renders instantly, it renders offline, and it renders when
 * data.gov.in is having a bad afternoon during a demo. This hook only ever
 * *upgrades* that — it never blanks a card while it waits, and never replaces
 * a good number with a spinner. CLAUDE.md makes the seeded dataset a P0 for
 * exactly this reason.
 *
 * Goes through /api/aqi so the key stays server-side; the client never sees
 * data.gov.in. See api/_cpcb.ts for the sub-index computation.
 */

export interface LiveAqi {
  aqi: number;
  category: string;
  /** The pollutant whose sub-index produced the number. */
  pollutant: string;
  station: string;
  updated: string;
  stationCount: number;
}

/** Survives remounts and tab switches, so switching places twice is one fetch. */
const cache = new Map<string, LiveAqi | null>();
const inflight = new Map<string, Promise<LiveAqi | null>>();

async function load(city: string): Promise<LiveAqi | null> {
  const res = await fetch(`/api/aqi?city=${encodeURIComponent(city)}`);
  if (!res.ok) return null;
  const json = await res.json();
  if (!json?.ok) {
    // Not an error worth surfacing to the user — the seeded figure is already
    // on screen and correct-looking. Worth surfacing to whoever is debugging.
    console.info(`[Mausam] CPCB live AQI unavailable for ${city}: ${json?.reason}`);
    return null;
  }
  return {
    aqi: json.aqi,
    category: json.category,
    pollutant: json.pollutant,
    station: json.station,
    updated: json.updated,
    stationCount: json.stationCount,
  };
}

export function useLiveAqi(city: string): LiveAqi | null {
  const [value, setValue] = useState<LiveAqi | null>(() => cache.get(city) ?? null);

  useEffect(() => {
    let alive = true;

    if (cache.has(city)) {
      setValue(cache.get(city) ?? null);
      return;
    }

    let promise = inflight.get(city);
    if (!promise) {
      promise = load(city)
        .catch(() => null)
        .then((v) => {
          cache.set(city, v);
          inflight.delete(city);
          return v;
        });
      inflight.set(city, promise);
    }

    promise.then((v) => {
      if (alive) setValue(v);
    });

    return () => {
      alive = false;
    };
  }, [city]);

  return value;
}
