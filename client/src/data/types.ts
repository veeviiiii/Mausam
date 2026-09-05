import type { Condition, WarningLevel } from "../design/tokens";

export type PersonaId =
  | "health"
  | "fitness"
  | "beach"
  | "travel"
  | "family"
  | "farm"
  | "commute"
  | "event";

export interface Persona {
  id: PersonaId;
  label: string;
  short: string;
}

/**
 * Alert kinds map 1:1 onto the three severe-weather feeds IMD publishes
 * separately. All three arrive as CAP XML, so `cap-parser.ts` discriminates on
 * this rather than treating everything as a generic district warning.
 * See docs/imd-coverage.md.
 */
export type AlertKind = "district" | "cyclone" | "flash-flood";

export interface CycloneTrack {
  systemName: string;
  /** [lon, lat] fixes, oldest first — drawn on the map layer. */
  fixes: [number, number][];
  /** Forecast landfall window, IST. */
  landfall: string;
}

export interface Alert {
  kind: AlertKind;
  level: WarningLevel;
  headline: string;
  body: string;
  /** Free-text validity exactly as CAP expresses it. */
  validUntil: string;
  issuingOffice: string;
  track?: CycloneTrack;
  /**
   * Present only on warnings that came from the live CAP feed. Its absence is
   * what makes a warning seeded, so the UI never has to guess which it holds.
   */
  live?: {
    /** The alert's own page, so the claim on screen is checkable. */
    href: string;
    /** CAP's district list, e.g. "Thane, Raigad districts of Maharashtra". */
    areaDesc: string;
    source: string;
  };
}

/** Agromet Advisory Service bulletin — issued Tuesdays and Fridays. */
export interface Agromet {
  advisory: string;
  issued: string;
  soilMoisture: number;
  soilCategory: string;
}

/** Urban Meteorological Services — city-scale, not district-scale. */
export interface UrbanMet {
  waterloggingRisk: "low" | "moderate" | "high";
  heatIndex: number;
  advisory: string;
}

/** Aviation Services — surfaced to travellers, not as its own persona. */
export interface Aviation {
  airport: string;
  visibilityM: number;
  crosswindKt: number;
  terminalStatus: string;
}

/** Tourism Forecast — feeds the event planner's comfort index. */
export interface Tourism {
  outlook: string;
  bestDay: string;
}

/** Moon data. Kept only where it changes a decision — tide range. */
export interface Moon {
  phase: string;
  illumination: number;
  rise: string;
  set: string;
  /** Spring tides track new/full moon; neap tides the quarters. */
  tideRegime: "spring" | "neap" | "transitional";
}

/** One hour of the rolling 24-hour outlook. */
export interface HourlyPoint {
  /** IST, "HH:MM". */
  time: string;
  temp: number;
  condition: Condition;
  /** Probability of precipitation, %. */
  precipitation: number;
  wind: number;
  humidity: number;
  /** UV index; 0 after dark. */
  uv: number;
}

export type HourlyMetric = "precipitation" | "wind" | "humidity" | "uv";

export interface Place {
  id: string;
  name: string;
  station: string;
  /**
   * What CPCB calls this city in the data.gov.in feed, when that differs from
   * our display name — `filters[city]` is an exact match, so "New Delhi"
   * returns zero rows where "Delhi" returns three hundred.
   *
   * Absent means CPCB has no station in this city at all. That is a real state,
   * not an oversight: Kerala currently reports Kannur, Thiruvananthapuram and
   * Thrissur, and nothing in Kochi. The card says so instead of silently
   * showing a seeded figure that looks live.
   */
  cpcbCity?: string;
  coastal: boolean;
  lat: number;
  lon: number;

  condition: Condition;
  sunrise: string;
  sunset: string;
  /**
   * IANA zone for this location's own clock.
   *
   * Time of day and the hourly strip are derived from the real time HERE, not
   * from the device. A user in London checking a saved Indian city must see
   * that city's night, and the demo laptop's timezone must not change what the
   * app claims about Mumbai. All six seeded places are Asia/Kolkata; the field
   * exists so adding a place outside IST is a data change, not a code change.
   */
  timeZone: string;

  temp: number;
  feelsLike: number;
  humidity: number;
  wind: number;
  gust: number;
  visibility: number;
  uv: number;
  dewPoint: number;

  aqi: number;
  aqiCategory: string;
  pm25: number;
  pollen: string;

  rain24: number;
  rainProbability: number[];
  /**
   * 24 rolling hours from the real local hour, used by the carousel and the
   * metric chart. Time-dependent, so it is NOT baked into the seed export —
   * AppState rebuilds it as the clock moves. See buildHourly in data/seed.ts.
   */
  hourly: HourlyPoint[];

  runStart: string;
  runEnd: string;
  schoolDropRain: number;
  schoolPickupRain: number;
  comfortIndex: number;

  tideHigh: string | null;
  tideHighM: number | null;
  tideLow: string | null;
  waveHeight: number | null;
  seaTemp: number | null;

  agromet: Agromet;
  urban: UrbanMet;
  aviation: Aviation | null;
  tourism: Tourism;
  moon: Moon;

  alert: Alert | null;
}
