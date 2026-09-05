import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fade, scrimVariants, sheetVariants } from "../animations/variants";
import { CARD_RULES } from "../personalization/rules";
import { advisoriesFor, type Advisory } from "../personalization/advisories";
import { sourcesFor } from "../data/provenance";
import { CARD_UI } from "../features/cards/registry";
import { useT } from "../i18n/context";
import { capText } from "../i18n/capText";
import type { PersonaId, Place } from "../data/types";
import type { LiveAqi } from "../lib/useLiveAqi";

export type SheetTarget =
  | { kind: "card"; id: PersonaId }
  | { kind: "alert"; placeId: string };

type Translate = (key: string, vars?: Record<string, string>) => string;

/**
 * Card -> detail.
 *
 * Transform and opacity only. The shared-element morph this replaced animated
 * width and height, which Framer implements by scaling — so the type visibly
 * stretched on the way in and every frame cost a layout projection pass. The
 * panel now rises and settles; nothing is scaled non-uniformly, so no glyph
 * can distort.
 */
export function DetailSheet({
  target,
  place,
  places,
  liveAqi = null,
  onClose,
  closing = false,
}: {
  target: SheetTarget;
  place: Place;
  places: Place[];
  /** CPCB's live figure for this city, when it answered. */
  liveAqi?: LiveAqi | null;
  onClose: () => void;
  /** Drives the exit; the parent unmounts on a timer, not on a callback. */
  closing?: boolean;
}) {
  const t = useT();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /**
   * Blur switches on only after the entrance settles. Blurring a surface while
   * it moves makes the browser re-sample its backdrop every frame; for the
   * ~250ms of travel a flat stand-in of the same colour weight is free.
   */
  const [settled, setSettled] = useState(false);

  // Belt and braces: if the animation never reports completion (a backgrounded
  // tab, a paused rAF), the frosted surface would never appear. Nothing in this
  // codebase gets to depend on an animation callback firing.
  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(true), 450);
    return () => window.clearTimeout(timer);
  }, []);

  const subject = target.kind === "alert" ? (places.find((p) => p.id === target.placeId) ?? place) : place;

  const content =
    target.kind === "card"
      ? cardContent(target.id, place, t, liveAqi)
      : alertContent(subject, t);

  if (!content) return null;

  // Advice is the alert sheet's reason for existing beyond the colour code: a
  // red banner tells you a warning is live, not whether to pack an umbrella.
  const advisories =
    target.kind === "alert" ? advisoriesFor(subject, sourcesFor(subject, liveAqi, t)) : [];

  const state = closing ? "exit" : "animate";

  return (
    <>
      {/* Dim first, so the panel appears to rise out of the darkened screen
          rather than sliding over a still-bright one. */}
      <motion.div
        className="absolute inset-0 z-[19]"
        style={{ background: "rgba(4,8,14,.42)" }}
        variants={scrimVariants}
        initial="initial"
        animate={state}
        aria-hidden="true"
        onClick={onClose}
      />

      <motion.div
        variants={sheetVariants}
        initial="initial"
        animate={state}
        className={`absolute inset-0 z-20 overflow-hidden ${settled ? "glass-sheet" : "glass-sheet-solid"}`}
        style={{ borderRadius: 0, willChange: "transform, opacity" }}
        role="dialog"
        aria-modal="true"
        aria-label={content.title}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("sheet.close")}
          className="chip-on hair absolute right-4 top-4 z-[2] grid h-[34px] w-[34px] place-items-center rounded-full border"
          style={{ color: "var(--txt)" }}
        >
          <svg viewBox="0 0 16 16" width={15} height={15} fill="none" aria-hidden="true">
            <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={fade}
          className="no-scrollbar mx-auto h-full max-w-[760px] overflow-y-auto px-5 pb-8 pt-14 lg:px-10 lg:pt-20"
        >
          <div className="instrument">{content.eyebrow}</div>
          <h2 className="mb-1.5 mt-2 text-[24px] font-medium tracking-[-0.028em] lg:text-[34px]">
            {content.title}
          </h2>
          <p className="text-[13.5px] leading-[1.5]" style={{ color: "var(--txt-2)" }}>
            {content.lede}
          </p>

          {advisories.length ? (
            <section className="mt-5">
              <h3 className="instrument mb-2">{t("sheet.advice")}</h3>
              <ul className="flex flex-col gap-1.5">
                {advisories.map((a, i) => (
                  <AdvisoryRow key={a.id} advisory={a} index={i} t={t} />
                ))}
              </ul>
            </section>
          ) : null}

          <dl className="mt-5 flex flex-col">
            {content.rows.map(([k, v]) => (
              <div
                key={k}
                className="flex items-baseline justify-between gap-3.5 border-t py-2.5"
                style={{ borderColor: "var(--hair)" }}
              >
                <dt className="text-[12.5px]" style={{ color: "var(--txt-2)" }}>
                  {k}
                </dt>
                <dd className="tnum m-0 text-right font-mono text-[13px] font-semibold">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="chip-on hair mt-5 rounded-[14px] border p-3.5">
            <b className="instrument mb-1.5 block">{t("sheet.whyHeading")}</b>
            <p className="text-[12.5px] leading-[1.5]">{content.source}</p>
            {/* Said out loud rather than left as a gap for someone to find. */}
            <p className="mt-2 text-[11.5px] leading-[1.45]" style={{ color: "var(--txt-2)" }}>
              {t("sheet.sourceEnglish")}
            </p>
            {content.href ? (
              <a
                href={content.href}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-2.5 inline-block text-[12px] font-semibold underline"
                style={{ color: "var(--txt)" }}
              >
                {t("sheet.viewAlert")}
              </a>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

const TONE_ACCENT: Record<Advisory["tone"], string> = {
  danger: "#E4574C",
  warn: "#E8A33C",
  info: "#5FB6E8",
};

/**
 * One instruction, with the reading that produced it directly underneath.
 *
 * The reading is not decoration: it is the same explainability contract the
 * cards sign. "Take an umbrella" on its own is an app guessing; "take an
 * umbrella — rain probability is 70% in the next few hours" is an app showing
 * its working.
 */
function AdvisoryRow({ advisory, index, t }: { advisory: Advisory; index: number; t: Translate }) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...fade, delay: 0.05 + index * 0.045 }}
      className="chip-on hair flex items-start gap-2.5 rounded-[12px] border px-3 py-2.5"
    >
      <span
        className="mt-[5px] h-[8px] w-[8px] shrink-0 rounded-full"
        style={{ background: TONE_ACCENT[advisory.tone] }}
        aria-hidden
      />
      <span className="min-w-0">
        <b className="block text-[13px] font-semibold">{t(advisory.titleKey)}</b>
        <small className="mt-0.5 block text-[11.5px] leading-[1.42]" style={{ color: "var(--txt-2)" }}>
          {t(advisory.whyKey, advisory.vars)}
        </small>
        {/* The reading is narrated as measurement, so where it came from is
            shown next to it. A seeded constant and a live regulatory feed must
            not read identically. */}
        <small
          className="mt-1 flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.06em]"
          style={{ color: "var(--txt-2)", opacity: 0.85 }}
        >
          <span
            className="h-[5px] w-[5px] shrink-0 rounded-full"
            style={{ background: advisory.source.status === "live" ? "#37C57D" : "#9AA6B4" }}
            aria-hidden
          />
          {t(`src.status.${advisory.source.status}`)} · {advisory.source.name}
          {advisory.source.asOf ? ` · ${advisory.source.asOf}` : ""}
        </small>
      </span>
    </motion.li>
  );
}

interface SheetContent {
  eyebrow: string;
  title: string;
  lede: string;
  rows: [string, string][];
  source: string;
  /** Live bulletins link back to the issuing feed, so the claim is checkable. */
  href?: string;
}

function cardContent(
  id: PersonaId,
  place: Place,
  t: Translate,
  liveAqi: LiveAqi | null,
): SheetContent {
  const rule = CARD_RULES[id];
  const detail = CARD_UI[id].detail(place, t);

  // The air card is the one reading a live feed today. When CPCB answered, the
  // sheet shows which station and which pollutant produced the index, because
  // "AQI 143" with no provenance is exactly the unexplainable number this
  // project is built to avoid.
  const rows =
    id === "health" && liveAqi
      ? ([
          ...detail.rows.filter(([label]) => label !== t("row.pm10")),
          // The seeded sheet estimates PM10 as 1.9x PM2.5. With a live station
          // there is a real number, and where there is not, an invented one is
          // worse than none.
          ...(liveAqi.readings["PM10"] != null
            ? ([[t("row.pm10"), `${liveAqi.readings["PM10"]} µg/m³`]] as [string, string][])
            : []),
          [t("row.station"), liveAqi.station],
          [t("row.governing"), liveAqi.pollutant],
          [t("row.stations"), String(liveAqi.stationCount)],
          [t("row.lastUpdate"), liveAqi.updated],
        ] as [string, string][])
      : detail.rows;

  const source =
    id === "health" && liveAqi
      ? "Live from CPCB's continuous ambient monitoring network via data.gov.in. The published rows are per-pollutant concentrations, not an index — the server computes CPCB's own sub-indices and takes the maximum, which is what the Indian AQI is defined as. Cached one hour, matching CPCB's publishing cadence."
      : detail.source;

  return {
    eyebrow: `${t(`persona.${id}`)} · ${place.name}`,
    title: t(rule.titleKey),
    lede: detail.lede,
    rows,
    source,
  };
}

function alertContent(place: Place, t: Translate): SheetContent | null {
  const a = place.alert;
  if (!a) return null;

  const rows: [string, string][] = [
    [t("row.colourCode"), t(`level.${a.level}`).toUpperCase()],
    [t("row.alertType"), t(`alert.kind.${a.kind}`)],
    [t("row.validUntil"), a.validUntil],
    [t("row.issuingOffice"), a.issuingOffice],
    [t("row.district"), place.station],
  ];

  // A live bulletin carries the districts CAP actually named, which is usually
  // wider than our one station — worth showing rather than quietly narrowing.
  if (a.live) {
    rows.push([t("row.areaCovered"), a.live.areaDesc], [t("row.capSource"), a.live.source]);
  }

  if (a.track) {
    rows.push(
      [t("row.system"), a.track.systemName],
      [t("row.landfall"), a.track.landfall],
      [t("row.trackFixes"), `${a.track.fixes.length}`],
    );
  }

  const text = capText(place.id, a, t);

  return {
    // NDMA's Sachet feed carries IMD, state SDMA and CWC bulletins, so the
    // issuing body is read off the alert rather than hardcoded — and a seeded
    // bulletin says it is seeded instead of borrowing IMD's name.
    eyebrow: a.live
      ? t("sheet.liveEyebrow", { office: a.issuingOffice, place: place.name })
      : t("sheet.seededEyebrow", { place: place.name }),
    title: text.headline,
    lede: text.body,
    rows,
    href: a.live?.href,
    source: a.live
      ? `Live Common Alerting Protocol bulletin, republished by NDMA's public Sachet feed and issued by ${a.issuingOffice}. IMD's own APIs require the calling server's IP to be whitelisted; NDMA carries the same IMD, SDMA and CWC bulletins with no key, so warnings are real while the forecast figures on other cards are still seeded. Cached five minutes — CAP arrives on issue, not on a schedule — and anything past its expiry time is dropped rather than shown.`
      : a.kind === "cyclone"
        ? "Parsed from IMD's CAP XML feed and cross-referenced with the Interactive Cyclone Track bulletin, which supplies the fixes drawn on the Places map. Cyclone entries are cached on issue, never on a timer."
        : a.kind === "flash-flood"
          ? "Parsed from IMD's Flash Flood Guidance bulletin, which publishes as CAP alongside district warnings. The same parser handles all three warning types."
          : "Parsed from IMD's Common Alerting Protocol XML feed. Warnings are cached on issue, not on a timer — a new CAP entry invalidates the old one immediately.",
  };
}
