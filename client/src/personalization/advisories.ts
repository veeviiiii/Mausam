import type { Place } from "../data/types";

/**
 * "What to do" — the same rule-based, explainable machinery as the card
 * scoring, pointed at actions instead of ordering.
 *
 * A colour code and a validity window tell you an alert exists. They do not
 * tell a parent whether to put an umbrella in a schoolbag. Every item here is
 * one threshold on one reading, and every item carries the reading that fired
 * it — so "why am I being told to wear a mask" is answered on the same line,
 * which is the same explainability constraint CLAUDE.md puts on the cards.
 *
 * Ordered by consequence, not by data source: life-safety first, comfort last.
 * Capped at MAX_ITEMS, because a list of nine things to do is a list nobody
 * reads, and the ordering already puts the important ones on top.
 */

export interface Advisory {
  id: string;
  /** Dictionary key for the instruction. */
  titleKey: string;
  /** Dictionary key for the reading that fired it. */
  whyKey: string;
  vars?: Record<string, string>;
  /** Drives the glyph and the accent. */
  tone: "danger" | "warn" | "info";
}

const MAX_ITEMS = 4;

export function advisoriesFor(place: Place): Advisory[] {
  const out: Advisory[] = [];
  const p = place;
  const rainNow = p.rainProbability[0] ?? 0;

  /* ---- life safety ---- */
  if (p.alert?.kind === "cyclone" && p.alert.track) {
    out.push({
      id: "secure",
      titleKey: "adv.secure",
      whyKey: "adv.secureWhy",
      vars: { system: p.alert.track.systemName, when: p.alert.track.landfall },
      tone: "danger",
    });
  }

  if (p.alert?.kind === "flash-flood") {
    out.push({
      id: "higher-ground",
      titleKey: "adv.higherGround",
      whyKey: "adv.higherGroundWhy",
      vars: { place: p.name },
      tone: "danger",
    });
  }

  if (p.condition === "thunderstorm") {
    out.push({ id: "indoors", titleKey: "adv.indoors", whyKey: "adv.indoorsWhy", tone: "danger" });
  }

  /* ---- health ---- */
  if (p.aqi > 200) {
    out.push({
      id: "mask",
      titleKey: "adv.mask",
      whyKey: "adv.maskWhy",
      vars: { aqi: String(p.aqi), band: p.aqiCategory },
      tone: "warn",
    });
  } else if (p.aqi > 150) {
    out.push({
      id: "windows",
      titleKey: "adv.windows",
      whyKey: "adv.windowsWhy",
      vars: { pm: String(p.pm25) },
      tone: "warn",
    });
  }

  if (p.feelsLike >= 38) {
    out.push({
      id: "hydrate",
      titleKey: "adv.hydrate",
      whyKey: "adv.hydrateWhy",
      vars: { v: String(p.feelsLike) },
      tone: "warn",
    });
  }

  /* ---- getting around ---- */
  if (p.visibility < 3) {
    out.push({
      id: "fog-lights",
      titleKey: "adv.fogLights",
      whyKey: "adv.fogLightsWhy",
      vars: { v: p.visibility.toFixed(1) },
      tone: "warn",
    });
  }

  if (p.urban.waterloggingRisk === "high") {
    out.push({
      id: "underpass",
      titleKey: "adv.avoidUnderpass",
      whyKey: "adv.avoidUnderpassWhy",
      vars: { place: p.name },
      tone: "warn",
    });
  }

  /* ---- the ordinary, useful ones ---- */
  const schoolWorst = Math.max(p.schoolDropRain, p.schoolPickupRain);
  if (schoolWorst >= 60) {
    out.push({
      id: "school-umbrella",
      titleKey: "adv.schoolUmbrella",
      whyKey: "adv.schoolUmbrellaWhy",
      vars: { pct: String(schoolWorst) },
      tone: "info",
    });
  } else if (rainNow >= 50 || p.condition === "rain") {
    out.push({
      id: "umbrella",
      titleKey: "adv.umbrella",
      whyKey: "adv.umbrellaWhy",
      vars: { pct: String(rainNow) },
      tone: "info",
    });
  }

  if (p.uv >= 6) {
    out.push({
      id: "sunscreen",
      titleKey: "adv.sunscreen",
      whyKey: "adv.sunscreenWhy",
      vars: { uv: String(p.uv) },
      tone: "info",
    });
  }

  if (p.waveHeight != null && p.waveHeight >= 2) {
    out.push({
      id: "no-swim",
      titleKey: "adv.noSwim",
      whyKey: "adv.noSwimWhy",
      vars: { m: p.waveHeight.toFixed(1) },
      tone: "warn",
    });
  }

  if (p.temp < 6) {
    out.push({
      id: "frost",
      titleKey: "adv.frost",
      whyKey: "adv.frostWhy",
      vars: { v: String(p.temp) },
      tone: "info",
    });
  }

  if (p.rain24 >= 50) {
    out.push({
      id: "delay-field",
      titleKey: "adv.delayField",
      whyKey: "adv.delayFieldWhy",
      vars: { mm: String(p.rain24) },
      tone: "info",
    });
  }

  // The empty state is a designed state, not a missing one — same rule the
  // "no active warnings" chip follows.
  if (!out.length) {
    out.push({
      id: "none",
      titleKey: "adv.none",
      whyKey: "adv.noneWhy",
      vars: { place: p.name },
      tone: "info",
    });
  }

  return out.slice(0, MAX_ITEMS);
}
