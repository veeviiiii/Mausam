import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * GET /api/aqi?city=Mumbai
 *
 * The only server this prototype has, and the only one it needs today. CPCB via
 * data.gov.in is the fast path CLAUDE.md calls out: no IP whitelisting, so it
 * can go live from any host, unlike IMD's own APIs which need a static IP on an
 * approved list.
 *
 * Deployed as a Vercel function (client/api/ is picked up automatically with
 * Root Directory = client) and served in dev by the same file through a Vite
 * middleware — see vite-plugin-api.ts. One code path, so a route that works
 * locally is the route that ships.
 *
 * SELF-CONTAINED ON PURPOSE. The AQI computation lived in a sibling `_cpcb.ts`
 * and Vercel's build broke on it: client/package.json declares "type": "module",
 * so the emitted aqi.js is ESM, and ESM will not resolve an extensionless
 * relative import — `ERR_MODULE_NOT_FOUND: .../api/_cpcb`. Adding a `.js`
 * extension fixes the resolution but still relies on the builder tracing and
 * uploading the sibling, which is a second thing to be wrong about. A function
 * with exactly one consumer does not need a module boundary, so it does not
 * have one.
 *
 * Never 500s on an upstream problem. The client's contract is "live figure if
 * there is one, otherwise say why and keep the seeded value", so a failure is a
 * 200 with ok:false. A 500 here would turn a degraded reading into a broken
 * screen, which is the exact failure mode this project exists to avoid.
 */

type Pollutant = "PM2.5" | "PM10" | "NO2" | "SO2" | "NH3" | "OZONE";

/**
 * CPCB sub-index breakpoints: [Clow, Chigh, Ilow, Ihigh], concentrations in
 * µg/m³ over the averaging period CPCB specifies for that pollutant.
 *
 * CO is deliberately absent. CPCB's CO breakpoints are defined in mg/m³, but
 * this resource publishes CO without a declared unit and with values in the
 * tens at rural background stations — which under mg/m³ breakpoints would read
 * as "severe" at a forest rest house. Rather than guess a divisor and risk
 * publishing a wrong band, CO is left out and the response names the pollutant
 * the index actually came from. PM2.5 and PM10 govern the Indian AQI at
 * essentially every urban station anyway.
 */
const BREAKPOINTS: Record<Pollutant, [number, number, number, number][]> = {
  "PM2.5": [
    [0, 30, 0, 50],
    [31, 60, 51, 100],
    [61, 90, 101, 200],
    [91, 120, 201, 300],
    [121, 250, 301, 400],
    [251, 500, 401, 500],
  ],
  PM10: [
    [0, 50, 0, 50],
    [51, 100, 51, 100],
    [101, 250, 101, 200],
    [251, 350, 201, 300],
    [351, 430, 301, 400],
    [431, 1000, 401, 500],
  ],
  NO2: [
    [0, 40, 0, 50],
    [41, 80, 51, 100],
    [81, 180, 101, 200],
    [181, 280, 201, 300],
    [281, 400, 301, 400],
    [401, 1000, 401, 500],
  ],
  SO2: [
    [0, 40, 0, 50],
    [41, 80, 51, 100],
    [81, 380, 101, 200],
    [381, 800, 201, 300],
    [801, 1600, 301, 400],
    [1601, 3000, 401, 500],
  ],
  NH3: [
    [0, 200, 0, 50],
    [201, 400, 51, 100],
    [401, 800, 101, 200],
    [801, 1200, 201, 300],
    [1201, 1800, 301, 400],
    [1801, 3000, 401, 500],
  ],
  OZONE: [
    [0, 50, 0, 50],
    [51, 100, 51, 100],
    [101, 168, 101, 200],
    [169, 208, 201, 300],
    [209, 748, 301, 400],
    [749, 1500, 401, 500],
  ],
};

/** CPCB's own band names, not the US EPA's — different scale, different words. */
const CPCB_BANDS: { max: number; name: string }[] = [
  { max: 50, name: "Good" },
  { max: 100, name: "Satisfactory" },
  { max: 200, name: "Moderate" },
  { max: 300, name: "Poor" },
  { max: 400, name: "Very poor" },
  { max: Infinity, name: "Severe" },
];

const cpcbBand = (v: number) => CPCB_BANDS.find((b) => v <= b.max)!.name;

/** Linear interpolation inside the band the concentration falls in. */
function subIndex(pollutant: Pollutant, value: number): number | null {
  const table = BREAKPOINTS[pollutant];
  if (!table) return null;
  for (const [cLo, cHi, iLo, iHi] of table) {
    if (value >= cLo && value <= cHi) {
      return Math.round(iLo + ((iHi - iLo) / (cHi - cLo)) * (value - cLo));
    }
  }
  // Above the top breakpoint: CPCB caps the published index at 500.
  return value > table[table.length - 1][1] ? 500 : null;
}

interface RawRecord {
  city?: string;
  state?: string;
  station?: string;
  last_update?: string;
  pollutant_id?: string;
  avg_value?: string;
}

interface StationAqi {
  station: string;
  aqi: number;
  pollutant: Pollutant;
  updated: string;
}

interface CityAqi {
  ok: true;
  city: string;
  state: string | null;
  /** Worst station in the city — how CPCB's own bulletin frames a city figure. */
  aqi: number;
  category: string;
  /** The pollutant whose sub-index won. This is the "why" of the number. */
  pollutant: Pollutant;
  station: string;
  updated: string;
  stationCount: number;
  source: "CPCB via data.gov.in";
}

interface AqiFailure {
  ok: false;
  reason: string;
}

const RESOURCE = "3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69";

/**
 * CPCB publishes hourly, so anything shorter is wasted bytes on both sides.
 * Matched to the source's real cadence, per CLAUDE.md's rule that every TTL is
 * justified by the feed rather than picked once for everything.
 */
const TTL_MS = 60 * 60 * 1000;

/**
 * Failures get their own, much shorter TTL.
 *
 * Caching a failure for the success TTL means one transient upstream blip
 * costs an hour of live data — and this was not hypothetical: data.gov.in was
 * returning 504 during testing, which under a single shared TTL would have
 * pinned every city to the seeded value for the rest of a demo. Two minutes is
 * long enough to stop a hammering retry loop and short enough to recover on
 * its own.
 */
const FAIL_TTL_MS = 2 * 60 * 1000;

/**
 * Upstream deadline. Without it the route inherits the platform's, which meant
 * a 40s hang on the same outage — the function burns its execution budget and
 * the client waits on a card that already has a perfectly good seeded number
 * on screen. Failing at 6s and letting the seed stand is strictly better.
 */
const UPSTREAM_TIMEOUT_MS = 6000;

const cache = new Map<string, { at: number; value: CityAqi | AqiFailure }>();

/** Rows -> per-station sub-indices -> the worst station. */
function reduce(city: string, records: RawRecord[]): CityAqi | AqiFailure {
  if (!records.length) return { ok: false, reason: `no CPCB stations reporting for ${city}` };

  const byStation = new Map<string, StationAqi>();
  let state: string | null = null;

  for (const r of records) {
    state = state ?? r.state ?? null;
    const pollutant = r.pollutant_id as Pollutant | undefined;
    const station = r.station;
    if (!pollutant || !station || !(pollutant in BREAKPOINTS)) continue;

    // "NA" is common — a station can report some pollutants and not others.
    const value = Number(r.avg_value);
    if (!Number.isFinite(value)) continue;

    const idx = subIndex(pollutant, value);
    if (idx == null) continue;

    const existing = byStation.get(station);
    if (!existing || idx > existing.aqi) {
      byStation.set(station, { station, aqi: idx, pollutant, updated: r.last_update ?? "" });
    }
  }

  if (!byStation.size) {
    return { ok: false, reason: `CPCB rows for ${city} carried no usable concentrations` };
  }

  const worst = [...byStation.values()].reduce((a, b) => (b.aqi > a.aqi ? b : a));
  return {
    ok: true,
    city,
    state,
    aqi: worst.aqi,
    category: cpcbBand(worst.aqi),
    pollutant: worst.pollutant,
    station: worst.station,
    updated: worst.updated,
    stationCount: byStation.size,
    source: "CPCB via data.gov.in",
  };
}

async function cityAqi(city: string, apiKey: string): Promise<CityAqi | AqiFailure> {
  const key = city.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < (hit.value.ok ? TTL_MS : FAIL_TTL_MS)) return hit.value;

  const url =
    `https://api.data.gov.in/resource/${RESOURCE}` +
    `?api-key=${encodeURIComponent(apiKey)}&format=json&limit=200` +
    `&filters%5Bcity%5D=${encodeURIComponent(city)}`;

  let result: CityAqi | AqiFailure;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
    if (!res.ok) {
      result = { ok: false, reason: `data.gov.in returned ${res.status}` };
    } else {
      // A 200 carrying an HTML error page is a real failure mode here, so the
      // parse is inside the try rather than trusted.
      const json = (await res.json()) as { records?: RawRecord[] };
      result = reduce(city, json.records ?? []);
    }
  } catch (err) {
    const e = err as Error;
    result = {
      ok: false,
      reason:
        e.name === "TimeoutError" || e.name === "AbortError"
          ? `data.gov.in did not answer within ${UPSTREAM_TIMEOUT_MS}ms`
          : `data.gov.in unreachable: ${e.message}`,
    };
  }

  cache.set(key, { at: Date.now(), value: result });
  return result;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Parsed from the URL rather than a framework-supplied req.query, so the
  // handler behaves identically under Vercel and under the dev middleware.
  const url = new URL(req.url ?? "/", "http://localhost");
  const city = url.searchParams.get("city")?.trim();

  res.setHeader("content-type", "application/json; charset=utf-8");

  if (!city) {
    res.statusCode = 400;
    res.end(JSON.stringify({ ok: false, reason: "missing ?city" }));
    return;
  }

  const apiKey = process.env.DATA_GOV_KEY;
  if (!apiKey) {
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        ok: false,
        reason: "DATA_GOV_KEY is not set on the server — see client/.env.example",
      }),
    );
    return;
  }

  const result = await cityAqi(city, apiKey);

  // Matches the upstream cadence: CPCB publishes hourly, and a stale-while-
  // revalidate window means an edge miss never blocks a render.
  res.setHeader("cache-control", "public, max-age=900, stale-while-revalidate=3600");
  res.statusCode = 200;
  res.end(JSON.stringify(result));
}
