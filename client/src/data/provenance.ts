import type { Place } from "./types";
import type { LiveAqi } from "../lib/useLiveAqi";

/**
 * Where each reading actually came from.
 *
 * The advice card narrates the reading that fired each line — "visibility is
 * 2.4 km", "rain probability reaches 72%" — which reads as measurement. Some of
 * those readings are live regulatory data and some are seeded constants, and
 * until now the card presented them identically. A seeded 72% sitting beside a
 * live CAP warning, in the same typography, is the app overstating what it
 * knows.
 *
 * This is additive: it does not change how any value is produced or how the
 * rules fire. It attaches an origin to each value so the UI can say which is
 * which, in the same single-source-of-truth spirit as tokens and rules.
 *
 * The honest summary as of 06 Sep 2026: two feeds are live (CPCB air quality,
 * NDMA CAP warnings) and everything else the advice engine reads is seeded.
 */

export type SourceStatus = "live" | "seeded" | "derived";

export interface Source {
  /** Short, human, already translated. */
  name: string;
  status: SourceStatus;
  /** When the upstream published it. Only meaningful for `live`. */
  asOf?: string;
}

/** Every field the advice engine reads. */
export type FieldKey =
  | "aqi"
  | "pm25"
  | "alert"
  | "rainProbability"
  | "schoolRain"
  | "visibility"
  | "waterlogging"
  | "uv"
  | "feelsLike"
  | "temp"
  | "rain24";

export type Sources = Record<FieldKey, Source>;

type Translate = (key: string, vars?: Record<string, string>) => string;

/**
 * Build the provenance map for a place.
 *
 * Deliberately exhaustive rather than defaulting: adding a field to the advice
 * engine without deciding where it came from should be a type error, not a
 * silent "seeded" label that might be wrong in the other direction.
 */
export function sourcesFor(place: Place, liveAqi: LiveAqi | null, t: Translate): Sources {
  const seeded: Source = { name: t("src.seed"), status: "seeded" };

  const air: Source = liveAqi
    ? { name: t("src.cpcb", { station: liveAqi.station }), status: "live", asOf: liveAqi.updated }
    : place.cpcbCity
      ? seeded
      : { name: t("src.cpcbNoStation", { place: place.name }), status: "seeded" };

  const alert: Source = place.alert?.live
    ? {
        name: t("src.cap", { office: place.alert.issuingOffice }),
        status: "live",
        asOf: place.alert.validUntil,
      }
    : seeded;

  return {
    aqi: air,
    pm25: air,
    alert,
    rainProbability: seeded,
    schoolRain: seeded,
    visibility: seeded,
    // Called out separately because the seeded prose names specific road
    // junctions and thresholds. IMD's nowcasts are district-scale; no dataset
    // in this project supports junction-level claims, and none is wired.
    waterlogging: { name: t("src.illustrative"), status: "seeded" },
    uv: seeded,
    feelsLike: seeded,
    temp: seeded,
    rain24: seeded,
  };
}
