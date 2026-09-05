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
 * data.gov.in. See api/aqi.ts for the sub-index computation.
 */

export interface LiveAqi {
  aqi: number;
  category: string;
  /** The pollutant whose sub-index produced the number. */
  pollutant: string;
  station: string;
  updated: string;
  stationCount: number;
  /** The governing station's own concentrations, µg/m³. */
  readings: Partial<Record<string, number>>;
}

/**
 * Survives remounts and tab switches, so switching places twice is one fetch —
 * but it EXPIRES. A session-lifetime cache meant an app left open for an
 * afternoon showed the morning's air quality forever, which is the same frozen
 * failure the hourly strip had. Shorter than the server's TTL, so a refresh
 * reaches the route and the route decides whether to reach CPCB.
 */
const CLIENT_TTL_MS = 10 * 60 * 1000;

/**
 * A miss is retried far sooner than a hit is refreshed.
 *
 * Same mistake as the server's original single TTL, made a second time one
 * layer up: caching a failure for the success window meant one slow moment at
 * data.gov.in pinned the card to "seeded" for ten minutes, long after the
 * route itself had recovered. Caught by the route answering ok:true while the
 * card still said seeded.
 */
const CLIENT_FAIL_TTL_MS = 45 * 1000;

const cache = new Map<string, { at: number; value: LiveAqi | null }>();
const inflight = new Map<string, Promise<LiveAqi | null>>();

/** Called by pull-to-refresh: the user asking again should actually ask. */
export function invalidateLiveAqi() {
  cache.clear();
}

async function load(city: string, force = false): Promise<LiveAqi | null> {
  // Pull-to-refresh means "ask again for real", so it steps around the HTTP
  // cache. Without this the browser can answer from a cached response the user
  // is explicitly trying to replace — which is exactly how a stale failure hid
  // behind three layers of retry logic that were all working correctly.
  const res = await fetch(`/api/aqi?city=${encodeURIComponent(city)}`, {
    cache: force ? "reload" : "default",
  });
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
    readings: json.readings ?? {},
  };
}

/**
 * `city` is the CPCB name, which is not always the display name — see
 * Place.cpcbCity. Pass undefined for a place CPCB does not cover; the hook
 * then makes no request at all rather than burning one on a guaranteed miss.
 */
export function useLiveAqi(city: string | undefined, epoch = 0): LiveAqi | null {
  const [value, setValue] = useState<LiveAqi | null>(() =>
    city ? (cache.get(city)?.value ?? null) : null,
  );

  useEffect(() => {
    if (!city) {
      setValue(null);
      return;
    }

    let alive = true;
    const hit = cache.get(city);
    if (hit && Date.now() - hit.at < (hit.value ? CLIENT_TTL_MS : CLIENT_FAIL_TTL_MS)) {
      setValue(hit.value);
      return;
    }

    let promise = inflight.get(city);
    if (!promise) {
      promise = load(city, epoch > 0)
        .catch(() => null)
        .then((v) => {
          cache.set(city, { at: Date.now(), value: v });
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
  }, [city, epoch]);

  return value;
}
