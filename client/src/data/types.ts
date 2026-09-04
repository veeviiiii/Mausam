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
  coastal: boolean;
  lat: number;
  lon: number;

  condition: Condition;
  sunrise: string;
  sunset: string;
  /** Demo clock, IST. Time of day is derived from this against sunrise/sunset. */
  clock: string;

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
  /** 24 rolling hours from `clock`, used by the carousel and the metric chart. */
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
