/**
 * CPCB real-time air quality, server-side.
 *
 * Underscore-prefixed so Vercel treats it as a module, not a route.
 *
 * This runs on the server for two reasons, and only one of them is the API
 * key. CLAUDE.md forbids the client calling CPCB directly at all; the key
 * (DATA_GOV_KEY, no VITE_ prefix) simply cannot reach the bundle, which is the
 * mechanical enforcement of that rule.
 *
 * What data.gov.in actually publishes is NOT an AQI. It is one row per
 * pollutant per station — a concentration, not an index. The Indian AQI is
 * defined by CPCB as the maximum of the per-pollutant sub-indices, each
 * computed by linear interpolation inside published breakpoints. That
 * computation lives here, so the number the app shows can be explained down to
 * the pollutant that produced it.
 */

export type Pollutant = "PM2.5" | "PM10" | "NO2" | "SO2" | "NH3" | "OZONE";

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
export const CPCB_BANDS: { max: number; name: string }[] = [
  { max: 50, name: "Good" },
  { max: 100, name: "Satisfactory" },
  { max: 200, name: "Moderate" },
  { max: 300, name: "Poor" },
  { max: 400, name: "Very poor" },
  { max: Infinity, name: "Severe" },
];

export const cpcbBand = (v: number) => CPCB_BANDS.find((b) => v <= b.max)!.name;

/** Linear interpolation inside the band the concentration falls in. */
export function subIndex(pollutant: Pollutant, value: number): number | null {
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
  latitude?: string;
  longitude?: string;
  pollutant_id?: string;
  avg_value?: string;
}

export interface StationAqi {
  station: string;
  aqi: number;
  pollutant: Pollutant;
  updated: string;
}

export interface CityAqi {
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

export interface AqiFailure {
  ok: false;
  reason: string;
}

const RESOURCE = "3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69";

/**
 * CPCB publishes hourly, so anything shorter than an hour is wasted bytes on
 * both sides. Matched to the source's real cadence, per CLAUDE.md's rule that
 * every TTL is justified by the feed rather than picked once for everything.
 */
const TTL_MS = 60 * 60 * 1000;

const cache = new Map<string, { at: number; value: CityAqi | AqiFailure }>();

export async function cityAqi(city: string, apiKey: string): Promise<CityAqi | AqiFailure> {
  const key = city.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;

  const url =
    `https://api.data.gov.in/resource/${RESOURCE}` +
    `?api-key=${encodeURIComponent(apiKey)}&format=json&limit=200` +
    `&filters%5Bcity%5D=${encodeURIComponent(city)}`;

  let result: CityAqi | AqiFailure;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      result = { ok: false, reason: `data.gov.in returned ${res.status}` };
    } else {
      const json = (await res.json()) as { records?: RawRecord[] };
      result = reduce(city, json.records ?? []);
    }
  } catch (err) {
    result = { ok: false, reason: `data.gov.in unreachable: ${(err as Error).message}` };
  }

  cache.set(key, { at: Date.now(), value: result });
  return result;
}

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
      byStation.set(station, {
        station,
        aqi: idx,
        pollutant,
        updated: r.last_update ?? "",
      });
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
