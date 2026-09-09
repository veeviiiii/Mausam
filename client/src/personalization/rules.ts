import type { Persona, PersonaId, Place } from "../data/types";
import { PERSONA_BY_ID } from "../data/seed";
import { placeName } from "../i18n/seedText";

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
  /**
   * Dictionary key for the clause, plus the readings that fill it. Reads as
   * "AQI is 168, above the 100 watch line" in whichever language is on. The
   * threshold and the number stay here in the rule; only the wording moves.
   */
  reasonKey: string;
  vars?: Record<string, string>;
}

export interface CardRule {
  titleKey: string;
  /** Attribution shown on the card's instrument label. */
  sourceKey: string;
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

/**
 * The saved places as the app currently knows them — live warnings merged in.
 *
 * The travel card needs the same set the travel RULE scores against, and it was
 * reading the raw seed array instead, so a destination whose seeded warning had
 * been replaced by a live one showed the stale colour while its own boost
 * counted the live one. Same source for both, now.
 */
export function savedPlaces(): Place[] {
  return placeUniverse;
}

export const CARD_RULES: Record<PersonaId, CardRule> = {
  health: {
    titleKey: "card.health.title",
    sourceKey: "source.health",
    boost: (p): Boost | null =>
      p.aqi > 150
        ? {
            points: 40,
            reasonKey: "boost.health.severe",
            vars: { aqi: String(p.aqi), cat: p.aqiCategory },
          }
        : p.aqi > 100
          ? { points: 18, reasonKey: "boost.health.watch", vars: { aqi: String(p.aqi) } }
          : null,
    firesWhen: "AQI > 100 (+18) or > 150 (+40)",
    suppressedWhen: "never — every station reports air quality",
    isSuppressed: never,
  },

  fitness: {
    titleKey: "card.fitness.title",
    sourceKey: "source.fitness",
    boost: (p): Boost | null =>
      p.feelsLike >= 40
        ? { points: 26, reasonKey: "boost.fitness.heat", vars: { v: String(p.feelsLike) } }
        : p.uv >= 8
          ? { points: 22, reasonKey: "boost.fitness.uv", vars: { uv: String(p.uv) } }
          : null,
    firesWhen: "feels-like ≥ 40 °C (+26) or UV ≥ 8 (+22)",
    suppressedWhen: "never",
    isSuppressed: never,
  },

  beach: {
    titleKey: "card.beach.title",
    sourceKey: "source.beach",
    boost: (p): Boost | null =>
      p.waveHeight != null && p.waveHeight >= 2
        ? { points: 34, reasonKey: "boost.beach.wave", vars: { m: String(p.waveHeight) } }
        : null,
    firesWhen: "wave height ≥ 2 m (+34)",
    suppressedWhen: "the location is inland — no tide station in range",
    isSuppressed: (p) => !p.coastal,
  },

  travel: {
    titleKey: "card.travel.title",
    sourceKey: "source.travel",
    boost: (p): Boost | null => {
      const n = placeUniverse.filter((x) => x.id !== p.id && x.alert).length;
      return n
        ? {
            points: 14 * n,
            reasonKey: n > 1 ? "boost.travel.many" : "boost.travel.one",
            vars: { n: String(n) },
          }
        : null;
    },
    firesWhen: "+14 per saved destination under warning",
    suppressedWhen: "no saved destinations yet",
    isSuppressed: never,
  },

  family: {
    titleKey: "card.family.title",
    sourceKey: "source.family",
    boost: (p): Boost | null => {
      const worst = Math.max(p.schoolDropRain, p.schoolPickupRain);
      return worst >= 60
        ? { points: 30, reasonKey: "boost.family.rain", vars: { pct: String(worst) } }
        : null;
    },
    firesWhen: "rain probability ≥ 60% in the 07:30 or 14:45 window (+30)",
    suppressedWhen: "weekends and IMD-listed holidays",
    isSuppressed: never,
  },

  farm: {
    titleKey: "card.farm.title",
    sourceKey: "source.farm",
    boost: (p): Boost | null =>
      p.rain24 >= 50
        ? { points: 28, reasonKey: "boost.farm.rain", vars: { mm: String(p.rain24) } }
        : p.agromet.soilMoisture < 0.2
          ? {
              points: 20,
              reasonKey: "boost.farm.soil",
              vars: { v: String(p.agromet.soilMoisture) },
            }
          : null,
    firesWhen: "24 h rainfall ≥ 50 mm (+28) or soil moisture < 0.20 (+20)",
    suppressedWhen: "never",
    isSuppressed: never,
  },

  commute: {
    titleKey: "card.commute.title",
    sourceKey: "source.commute",
    boost: (p): Boost | null =>
      p.visibility < 3
        ? {
            points: 36,
            /*
             * Same 1 km line the advice engine draws, for the same reason.
             * IMD's fog classification tops out at 1000 m — shallow fog is
             * 501-1000 m, and there is no IMD band anywhere near 3 km — so this
             * narration used to invent an official "3 km fog line" on the first
             * card of the default Mumbai home screen, while the advice two
             * inches above it correctly called the same reading our own driving
             * caution.
             *
             * The score is deliberately unchanged: both cases are worth +36,
             * because a commuter cares about the visibility either way. Only
             * the sentence differs, and it now turns on the same threshold the
             * advice engine uses, so the two cannot disagree again.
             */
            reasonKey: p.visibility <= 1 ? "boost.commute.fog" : "boost.commute.lowVis",
            vars:
              p.visibility <= 1
                ? { m: String(Math.round(p.visibility * 1000)) }
                : { v: String(p.visibility) },
          }
        : p.urban.waterloggingRisk === "high"
          ? { points: 24, reasonKey: "boost.commute.water", vars: { place: p.name } }
          : p.visibility < 5
            ? { points: 16, reasonKey: "boost.commute.vis", vars: { v: String(p.visibility) } }
            : null,
    firesWhen:
      "visibility < 3 km (+36, narrated as IMD shallow fog only at or below 1 km), high waterlogging risk (+24), or visibility < 5 km (+16)",
    suppressedWhen: "never",
    isSuppressed: never,
  },

  event: {
    titleKey: "card.event.title",
    sourceKey: "source.event",
    boost: (p): Boost | null =>
      p.comfortIndex < 45
        ? { points: 12, reasonKey: "boost.event.comfort", vars: { v: String(p.comfortIndex) } }
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
  boostKey: string | null;
  boostVars?: Record<string, string>;
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
        boostKey: b ? b.reasonKey : null,
        boostVars: b?.vars,
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

export type Translate = (key: string, vars?: Record<string, string>) => string;

/**
 * The sentence shown under "Why this card".
 *
 * Assembled from parts rather than formatted from one template, because the
 * numbers render as chips and because Hindi does not put the clauses where
 * English does. Each segment is either a translated fragment or a raw value;
 * values never go through the dictionary.
 */
export function explain(
  card: ScoredCard,
  place: Place,
  personaCount: number,
  manualOrder: PersonaId[],
  tr: Translate,
): ExplainSegment[] {
  const personaLabel = tr(`persona.${card.id}`);
  const t = (text: string): ExplainSegment => ({ kind: "text", text });
  const v = (text: string): ExplainSegment => ({ kind: "value", text });

  if (manualOrder.includes(card.id)) {
    return [
      t(
        tr("explain.manual", {
          persona: personaLabel,
          n: String(manualOrder.indexOf(card.id) + 1),
        }),
      ),
    ];
  }

  const head = [
    t(
      tr("explain.head", {
        persona: personaLabel,
        rank: String(card.rank),
        count: String(personaCount),
      }),
    ),
    v(String(card.base)),
  ];

  if (card.boostKey) {
    /*
     * A boost's vars are baked at scoring time, where there is no translator --
     * scoreCards runs in AppState, which has no language context. Only one rule
     * puts a place name in them (boost.commute.water), so it is swapped here,
     * where tr and the place are both in hand. Without this the Hindi read
     * "Mumbai के लिए शहरी जलभराव जोखिम अधिक है".
     */
    const boostVars = card.boostVars?.place
      ? { ...card.boostVars, place: placeName(tr, place) }
      : card.boostVars;
    return [
      ...head,
      t(tr("explain.boost", { place: placeName(tr, place), reason: tr(card.boostKey, boostVars) })),
      v(`+${card.boost}`),
      t(tr("explain.for")),
      v(String(card.score)),
      t(tr("explain.end")),
    ];
  }

  return [
    ...head,
    t(tr("explain.none", { place: placeName(tr, place) })),
    v(String(card.score)),
    t(tr("explain.end")),
  ];
}
