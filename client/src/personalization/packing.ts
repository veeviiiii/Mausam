import { advisoriesFor, type Advisory } from "./advisories";
import { sourcesFor } from "../data/provenance";
import type { Place } from "../data/types";
import { placeName } from "../i18n/seedText";

/**
 * Packing suggestions for saved destinations — "carry a raincoat in London".
 *
 * Deliberately NOT a second rule engine. Every line here is an advisory the
 * existing engine already produced for that destination, projected onto a thing
 * you can put in a bag. Nothing new is measured, no new threshold is invented,
 * and each line keeps the advisory that produced it — so the reading and the
 * provenance badge travel with the suggestion, exactly as they do on the home
 * screen. A second mechanism would have meant a second set of thresholds to
 * keep honest, and the app already has one it can explain.
 *
 * What this replaces: the travel card used to show one of two hardcoded
 * strings — "Pack for rain and delays" / "Pack for warm, dry days" — chosen by
 * whether ANY saved city had a warning. That told a traveller nothing about
 * WHICH city or WHY, which is the opposite of what the rest of the app does.
 */

/**
 * Advisory id → the item to pack.
 *
 * Intentionally sparse. An advisory only appears here when the packing item is
 * the direct object of the original instruction — "carry an umbrella" really
 * does mean rain cover. Advisories about behaviour at the destination ("use fog
 * lights", "avoid the underpass", "keep windows shut") have no honest packing
 * equivalent, so they are absent rather than stretched into one.
 *
 * Cyclone and flash-flood map to a line that does not pretend a bag solves the
 * problem — a destination under one of those producing no travel line at all
 * would be worse than saying the obvious thing.
 *
 * The thunderstorm advisory (`indoors`) is deliberately NOT one of them. It
 * fires on any thunderstorm, which is most of the monsoon, and "check before
 * you travel" for an afternoon storm both overstates it and pushes out the
 * genuinely useful line underneath. The advice engine already draws that
 * distinction itself: `indoors` says what to do once you are there, `secure`
 * and `higher-ground` say the trip itself is in question.
 */
const PACKABLE: Record<string, string> = {
  secure: "pack.reconsider",
  "higher-ground": "pack.reconsider",
  umbrella: "pack.rain",
  mask: "pack.mask",
  hydrate: "pack.water",
  sunscreen: "pack.sunscreen",
  frost: "pack.layers",
};

export interface PackingLine {
  placeId: string;
  placeName: string;
  /** Dictionary key for the item. */
  itemKey: string;
  /** The advisory this came from — carries the reading, tone and source. */
  advisory: Advisory;
}

type Translate = (key: string, vars?: Record<string, string>) => string;

/**
 * One packing line per destination that has something worth packing for.
 *
 * `advisoriesFor` returns its list ordered by consequence and already capped,
 * so taking the first packable entry gives the most consequential one without
 * any ranking logic here.
 *
 * `liveAqi` is deliberately null: live CPCB readings are fetched for the
 * selected city only, so a destination's air quality is seeded and the source
 * badge on the line says so. Passing the current city's live reading through
 * would attach a real station's name to a different city's number.
 */
export function packingFor(destinations: Place[], t: Translate): PackingLine[] {
  return destinations.flatMap((d) => {
    const advisory = advisoriesFor(d, sourcesFor(d, null, t), t).find((a) => PACKABLE[a.id]);
    return advisory
      ? [{ placeId: d.id, placeName: placeName(t, d), itemKey: PACKABLE[advisory.id], advisory }]
      : [];
  });
}
