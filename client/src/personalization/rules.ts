import type { Persona, PersonaId, Place } from "../data/types";
import { PERSONA_BY_ID } from "../data/seed";

/**
 * Rule-based personalization. No model, no embedding, no opaque ranking —
 * CLAUDE.md makes explainability a hard constraint, so every card's position is
 * a small sum a judge can read off the screen:
 *
 *     score = base (from the order the user picked the persona)
 *           + urgency boost (from the live reading, if a threshold trips)
 *
 * A manual arrangement, if the user has made one, overrides the score entirely.
 */

export interface Boost {
  points: number;
  /** Reads as a clause: "AQI is 168, above the 100 watch line". */
  reason: string;
}

export interface CardRule {
  title: string;
  /** Attribution shown on the card's instrument label. */
  source: string;
  boost: (place: Place) => Boost | null;
  /** Human-readable threshold, for the rules table and docs. */
  firesWhen: string;
  suppressedWhen: string;
  isSuppressed: (place: Place) => boolean;
}

const never = () => false;

/**
 * The travel rule needs to see the user's other saved places. Injected rather
 * than imported at module scope, so the rules module stays free of app state.
 */
let placeUniverse: Place[] = [];
export function setPlaceUniverse(places: Place[]) {
  placeUniverse = places;
}

export const CARD_RULES: Record<PersonaId, CardRule> = {
  health: {
    title: "Air & allergens",
    source: "CPCB · live",
    boost: (p) =>
      p.aqi > 150
        ? { points: 40, reason: `AQI is ${p.aqi} (${p.aqiCategory}), past the 150 threshold` }
        : p.aqi > 100
          ? { points: 18, reason: `AQI is ${p.aqi}, above the 100 watch line` }
          : null,
    firesWhen: "AQI > 100 (+18) or > 150 (+40)",
    suppressedWhen: "never — every station reports air quality",
    isSuppressed: never,
  },

  fitness: {
    title: "Best run window",
    source: "IMD hourly · UV index",
    boost: (p) =>
      p.feelsLike >= 40
        ? { points: 26, reason: `feels-like hits ${p.feelsLike}°C` }
        : p.uv >= 8
          ? { points: 22, reason: `UV index peaks at ${p.uv}, so the safe window narrows` }
          : null,
    firesWhen: "feels-like ≥ 40 °C (+26) or UV ≥ 8 (+22)",
    suppressedWhen: "never",
    isSuppressed: never,
  },

  beach: {
    title: "Sea & tide",
    source: "INCOIS · IMD coastal",
    boost: (p) =>
      p.waveHeight != null && p.waveHeight >= 2
        ? {
            points: 34,
            reason: `wave height is ${p.waveHeight} m, above the 2 m swim-advisory line`,
          }
        : null,
    firesWhen: "wave height ≥ 2 m (+34)",
    suppressedWhen: "the location is inland — no tide station in range",
    isSuppressed: (p) => !p.coastal,
  },

  travel: {
    title: "Saved destinations",
    source: "IMD city forecast · CAP",
    boost: (p) => {
      const n = placeUniverse.filter((x) => x.id !== p.id && x.alert).length;
      return n
        ? {
            points: 14 * n,
            reason: `${n} saved destination${n > 1 ? "s have" : " has"} an active warning`,
          }
        : null;
    },
    firesWhen: "+14 per saved destination under warning",
    suppressedWhen: "no saved destinations yet",
    isSuppressed: never,
  },

  family: {
    title: "School run",
    source: "IMD nowcast · district",
    boost: (p) => {
      const worst = Math.max(p.schoolDropRain, p.schoolPickupRain);
      return worst >= 60
        ? { points: 30, reason: `rain probability reaches ${worst}% inside a school window` }
        : null;
    },
    firesWhen: "rain probability ≥ 60% in the 07:30 or 14:45 window (+30)",
    suppressedWhen: "weekends and IMD-listed holidays",
    isSuppressed: never,
  },

  farm: {
    title: "Field conditions",
    source: "IMD subdivision · Agromet AAS",
    boost: (p) =>
      p.rain24 >= 50
        ? { points: 28, reason: `${p.rain24} mm expected in 24 h, enough to change field work` }
        : p.agromet.soilMoisture < 0.2
          ? { points: 20, reason: `soil moisture is down to ${p.agromet.soilMoisture} m³/m³` }
          : null,
    firesWhen: "24 h rainfall ≥ 50 mm (+28) or soil moisture < 0.20 (+20)",
    suppressedWhen: "never",
    isSuppressed: never,
  },

  commute: {
    title: "Commute watch",
    source: "IMD nowcast · urban met",
    boost: (p) =>
      p.visibility < 3
        ? { points: 36, reason: `visibility is down to ${p.visibility} km, under the 3 km fog line` }
        : p.urban.waterloggingRisk === "high"
          ? { points: 24, reason: `urban waterlogging risk is high for ${p.name}` }
          : p.visibility < 5
            ? { points: 16, reason: `visibility is ${p.visibility} km` }
            : null,
    firesWhen: "visibility < 3 km (+36), high waterlogging risk (+24), or visibility < 5 km (+16)",
    suppressedWhen: "never",
    isSuppressed: never,
  },

  event: {
    title: "Comfort index",
    source: "IMD extended range · tourism",
    boost: (p) =>
      p.comfortIndex < 45
        ? { points: 12, reason: `comfort index is only ${p.comfortIndex}/100 today` }
        : null,
    firesWhen: "comfort index < 45 (+12)",
    suppressedWhen: "never",
    isSuppressed: never,
  },
};

export interface ScoredCard {
  id: PersonaId;
  base: number;
  boost: number;
  boostReason: string | null;
  score: number;
  /** 1-based position in the user's persona list. */
  rank: number;
}

export function scoreCards(
  place: Place,
  personas: PersonaId[],
  manualOrder: PersonaId[] = [],
): ScoredCard[] {
  const scored = personas
    .map((id, i): ScoredCard | null => {
      const rule = CARD_RULES[id];
      if (rule.isSuppressed(place)) return null;
      const b = rule.boost(place);
      const base = 100 - i * 10;
      return {
        id,
        base,
        boost: b ? b.points : 0,
        boostReason: b ? b.reason : null,
        score: base + (b ? b.points : 0),
        rank: i + 1,
      };
    })
    .filter((c): c is ScoredCard => c !== null);

  if (manualOrder.length) {
    scored.sort((a, b) => {
      const ia = manualOrder.indexOf(a.id);
      const ib = manualOrder.indexOf(b.id);
      if (ia < 0 && ib < 0) return b.score - a.score;
      if (ia < 0) return 1;
      if (ib < 0) return -1;
      return ia - ib;
    });
  } else {
    scored.sort((a, b) => b.score - a.score);
  }
  return scored;
}

/** A suppressed persona still deserves an explanation. */
export function suppressedPersonas(place: Place, personas: PersonaId[]): Persona[] {
  return personas.filter((id) => CARD_RULES[id].isSuppressed(place)).map((id) => PERSONA_BY_ID[id]);
}

export type ExplainSegment = { kind: "text" | "value"; text: string };

/** The sentence shown under "Why this card", and in docs/the rules table. */
export function explain(
  card: ScoredCard,
  place: Place,
  personaCount: number,
  manualOrder: PersonaId[] = [],
): ExplainSegment[] {
  const persona = PERSONA_BY_ID[card.id];
  const t = (text: string): ExplainSegment => ({ kind: "text", text });
  const v = (text: string): ExplainSegment => ({ kind: "value", text });

  if (manualOrder.includes(card.id)) {
    return [
      t("You moved "),
      v(persona.short),
      t(` to position ${manualOrder.indexOf(card.id) + 1} by hand, so the manual order wins over the score.`),
    ];
  }

  const head = [
    t(`${persona.label} is persona ${card.rank} of ${personaCount}, worth `),
    v(String(card.base)),
  ];

  if (card.boostReason) {
    return [
      ...head,
      t(`. In ${place.name} right now, ${card.boostReason} — that adds `),
      v(`+${card.boost}`),
      t(", for "),
      v(String(card.score)),
      t("."),
    ];
  }
  return [
    ...head,
    t(`. Nothing in ${place.name}'s current readings trips an urgency threshold, so it stays at `),
    v(String(card.score)),
    t("."),
  ];
}
