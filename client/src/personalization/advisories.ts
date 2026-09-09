import type { Place } from "../data/types";
import type { Source, Sources } from "../data/provenance";
import { capText } from "../i18n/capText";
import { placeName, seedText } from "../i18n/seedText";

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
  /**
   * Where the reading in `whyKey` came from. Rendered beside it, because a
   * seeded constant and a live regulatory feed narrated in identical
   * typography is the app claiming more than it knows.
   */
  source: Source;
}

const MAX_ITEMS = 4;

/** Accent per tone. Shared by the home-screen strip and the detail sheet. */
export const ADVISORY_TONE: Record<Advisory["tone"], string> = {
  danger: "#E4574C",
  warn: "#E8A33C",
  info: "#5FB6E8",
};

type Translate = (key: string, vars?: Record<string, string>) => string;

export function advisoriesFor(place: Place, sources: Sources, tr: Translate): Advisory[] {
  const out: Advisory[] = [];
  const p = place;
  const rainNow = p.rainProbability[0] ?? 0;

  /**
   * What the active warning itself says.
   *
   * This exists because live CAP warnings arrive independently of the forecast
   * numbers on the cards. A red "Heavy Rain" bulletin for Delhi sat next to a
   * seeded 20% rain probability, and the advice list said "apply sunscreen"
   * and never "take an umbrella" — technically consistent with the readings,
   * and obviously wrong to anyone reading the banner above it.
   *
   * So the warning gets a vote. It is still one threshold on one field, and it
   * still shows its working: the reason names the bulletin.
   */
  const warned = `${p.alert?.headline ?? ""} ${p.alert?.body ?? ""}`.toLowerCase();
  const warnsRain = /rain|shower|downpour|precipitat/.test(warned);
  const warnsStorm = /thunder|lightning|squall/.test(warned);
  /*
   * Seeded headlines are shaped "Orange warning · heavy rainfall"; live CAP
   * headlines are just the event ("Heavy Rain"). The advice template adds the
   * level itself, so the seeded shape produced "Orange warning · heavy
   * rainfall — orange warning, active until ...". Strip the redundant prefix
   * and leave live headlines alone — they have no separator to split on.
   */
  /*
   * The bulletin's own words, in the reader's language where we have them.
   *
   * Goes through capText for the same reason the banner does: seeded warnings
   * have a Hindi translation, live ones deliberately do not and are shown as
   * issued.
   *
   * The colour code is deliberately NOT repeated in the advice sentence. The
   * banner sits directly above this line and already carries it, and seeded
   * headlines embed it too — so a template that added it produced "Orange
   * warning · heavy rainfall — orange warning, active until ...". Stripping the
   * prefix instead meant matching a colour word across languages, which broke
   * immediately on Hindi adjective gender: the headline reads "पीली चेतावनी"
   * but the standalone level word is "पीला". Quoting the headline and dropping
   * the level needs no parsing and cannot drift.
   */
  const warnLabel = p.alert
    ? (() => {
        const cap = capText(p.id, p.alert, tr);
        return { event: cap.headline, until: cap.validUntil };
      })()
    : null;

  /* ---- life safety ---- */
  if (p.alert?.kind === "cyclone" && p.alert.track) {
    out.push({
      id: "secure",
      titleKey: "adv.secure",
      whyKey: "adv.secureWhy",
      vars: {
        system: p.alert.track.systemName,
        when: seedText(tr, `landfall.${p.id}`, p.alert.track.landfall),
      },
      tone: "danger",
      source: sources.alert,
    });
  }

  if (p.alert?.kind === "flash-flood") {
    out.push({
      id: "higher-ground",
      titleKey: "adv.higherGround",
      whyKey: "adv.higherGroundWhy",
      vars: { place: placeName(tr, p) },
      tone: "danger",
      source: sources.alert,
    });
  }

  if (p.condition === "thunderstorm" || warnsStorm) {
    out.push({
      id: "indoors",
      titleKey: "adv.indoors",
      whyKey: warnsStorm && warnLabel ? "adv.indoorsWarnWhy" : "adv.indoorsWhy",
      vars:
        warnsStorm && warnLabel
          ? { office: p.alert ? capText(p.id, p.alert, tr).issuingOffice : tr("val.thisDistrict") }
          : undefined,
      tone: "danger",
      source: warnsStorm ? sources.alert : sources.temp,
    });
  }

  /* ---- what the warning is actually about ----

     Ranked here, not down with the comfort items, because MAX_ITEMS is a real
     cap and ordering decides what survives it. With "take an umbrella" sitting
     below "apply sunscreen", a red Heavy Rain bulletin produced an advice list
     that recommended sunscreen and never mentioned rain. Whatever the warning
     is about outranks everything except life safety. */
  /*
   * One umbrella line, for everybody.
   *
   * This used to split into "send an umbrella to school" whenever the 07:30 or
   * 14:45 window was wet. But the advice list is not persona-filtered — it is
   * the same list for every user — so a parent-specific instruction was being
   * shown to people with no school run. School framing belongs on the Parents
   * & families CARD, which is a persona a user opts into; it does not belong
   * here.
   *
   * The three rain readings are just probabilities at different times of day,
   * so the highest of them answers "will I need an umbrella" for anyone.
   */
  const rainPeak = Math.max(rainNow, p.schoolDropRain, p.schoolPickupRain);

  if (warnsRain && warnLabel) {
    // The bulletin outranks the seeded probability: a live rain warning means
    // rain regardless of what the forecast row happens to say.
    out.push({
      id: "umbrella",
      titleKey: "adv.umbrella",
      whyKey: "adv.umbrellaWarnWhy",
      vars: { event: warnLabel.event, until: warnLabel.until },
      tone: "warn",
      source: sources.alert,
    });
  } else if (rainPeak >= 50 || p.condition === "rain") {
    // NOTE: adv.umbrellaWhy hardcodes the word "seeded". Rain probability has
    // no live path today; whoever wires IMD's forecast endpoints must drop that
    // word from the string, or it becomes the exact overstatement the
    // provenance audit removed. The badge beside it is already dynamic.
    out.push({
      id: "umbrella",
      titleKey: "adv.umbrella",
      whyKey: "adv.umbrellaWhy",
      vars: { pct: String(rainPeak) },
      tone: "info",
      source: sources.rainProbability,
    });
  }

  /* ---- health ---- */
  if (p.aqi > 200) {
    out.push({
      id: "mask",
      titleKey: "adv.mask",
      whyKey: "adv.maskWhy",
      vars: { aqi: String(p.aqi), band: p.aqiCategory },
      tone: "warn",
      source: sources.aqi,
    });
  } else if (p.aqi > 150) {
    out.push({
      id: "windows",
      titleKey: "adv.windows",
      whyKey: "adv.windowsWhy",
      vars: { pm: String(p.pm25) },
      tone: "warn",
      source: sources.pm25,
    });
  }

  if (p.feelsLike >= 38) {
    out.push({
      id: "hydrate",
      titleKey: "adv.hydrate",
      whyKey: "adv.hydrateWhy",
      vars: { v: String(p.feelsLike) },
      tone: "warn",
      source: sources.feelsLike,
    });
  }

  /* ---- getting around ----

     IMD's fog classification tops out at 1 km: shallow fog is 501-1000 m,
     moderate 201-500 m, dense 51-200 m, very dense below 50 m. There is no IMD
     band anywhere near 3 km, so the old "under the 3 km fog line" narration
     implied an official definition that does not exist.

     Two rules now. Below 1 km is genuinely inside IMD's shallow-fog band and
     says so. Between 1 and 3 km is a driving caution this app is making on its
     own judgement, and it is named and worded as one. */
  if (p.visibility <= 1) {
    out.push({
      id: "fog-lights",
      titleKey: "adv.fogLights",
      whyKey: "adv.fogLightsWhy",
      vars: { m: String(Math.round(p.visibility * 1000)) },
      tone: "warn",
      source: sources.visibility,
    });
  } else if (p.visibility < 3) {
    out.push({
      id: "low-visibility",
      titleKey: "adv.lowVisibility",
      whyKey: "adv.lowVisibilityWhy",
      vars: { v: p.visibility.toFixed(1) },
      tone: "warn",
      source: sources.visibility,
    });
  }

  if (p.urban.waterloggingRisk === "high") {
    out.push({
      id: "underpass",
      titleKey: "adv.avoidUnderpass",
      whyKey: "adv.avoidUnderpassWhy",
      vars: { place: placeName(tr, p) },
      tone: "warn",
      source: sources.waterlogging,
    });
  }

  /* ---- the ordinary, useful ones ---- */
  if (p.uv >= 6) {
    out.push({
      id: "sunscreen",
      titleKey: "adv.sunscreen",
      whyKey: "adv.sunscreenWhy",
      vars: { uv: String(p.uv) },
      tone: "info",
      source: sources.uv,
    });
  }

  /*
   * The swim advisory is deliberately absent.
   *
   * It fired on `waveHeight`, which is a seeded constant: there is no marine
   * API anywhere in this project. INCOIS is named in a provenance string on the
   * beach card but has never been called. "Swell is 2.3 m, above the 2 m
   * swim-advisory line" is a precise, safety-relevant instruction with nothing
   * behind it, and a labelled-but-invented number is still an invented number
   * when the advice is "stay out of the water".
   *
   * Restore it when a real wave-height source is wired, not before.
   */

  if (p.temp < 6) {
    out.push({
      id: "frost",
      titleKey: "adv.frost",
      whyKey: "adv.frostWhy",
      vars: { v: String(p.temp) },
      tone: "info",
      source: sources.temp,
    });
  }

  if (p.rain24 >= 50) {
    out.push({
      id: "delay-field",
      titleKey: "adv.delayField",
      whyKey: "adv.delayFieldWhy",
      vars: { mm: String(p.rain24) },
      tone: "info",
      source: sources.rain24,
    });
  }

  // The empty state is a designed state, not a missing one — same rule the
  // "no active warnings" chip follows.
  if (!out.length) {
    out.push({
      id: "none",
      titleKey: "adv.none",
      whyKey: "adv.noneWhy",
      vars: { place: placeName(tr, p) },
      tone: "info",
      source: sources.alert,
    });
  }

  return out.slice(0, MAX_ITEMS);
}
