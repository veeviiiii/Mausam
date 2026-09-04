import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { springSheet, fade } from "../animations/variants";
import { CARD_RULES } from "../personalization/rules";
import { CARD_UI } from "../features/cards/registry";
import { PERSONA_BY_ID } from "../data/seed";
import type { PersonaId, Place } from "../data/types";

export type SheetTarget =
  | { kind: "card"; id: PersonaId }
  | { kind: "alert"; placeId: string };

/**
 * Card -> detail, as a shared-element expand.
 *
 * The overlay carries the same `layoutId` as the card that opened it, so Framer
 * morphs one into the other rather than cross-fading two separate surfaces.
 * That is the transition CLAUDE.md asks for, and it also means the card's
 * position on screen is what the detail grows out of — the user never loses
 * track of what they tapped.
 */
export function DetailSheet({
  target,
  place,
  places,
  onClose,
}: {
  target: SheetTarget;
  place: Place;
  places: Place[];
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /**
   * Backdrop blur is applied only once the morph has landed. Blurring an
   * element while its size animates forces a full blur recompute every frame
   * over a growing area, which is what made the card open feel heavy. During
   * the morph we use an opaque-enough stand-in that costs nothing.
   */
  const [settled, setSettled] = useState(false);

  // Belt and braces: if the layout animation never reports completion (a
  // backgrounded tab, a morph with nothing to move), the frosted surface would
  // never appear. Nothing in this codebase gets to depend on an animation
  // callback firing.
  useEffect(() => {
    const t = window.setTimeout(() => setSettled(true), 450);
    return () => window.clearTimeout(t);
  }, []);

  const content =
    target.kind === "card"
      ? cardContent(target.id, place)
      : alertContent(places.find((p) => p.id === target.placeId) ?? place);

  if (!content) return null;

  const layoutId = target.kind === "card" ? `card-${target.id}` : `alert-${target.placeId}`;

  return (
    <motion.div
      layoutId={layoutId}
      transition={springSheet}
      onLayoutAnimationComplete={() => setSettled(true)}
      className={`absolute inset-0 z-20 overflow-hidden ${settled ? "glass-sheet" : "glass-sheet-solid"}`}
      style={{ borderRadius: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label={content.title}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
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
        transition={{ ...fade, delay: 0.16 }}
        className="no-scrollbar mx-auto h-full max-w-[760px] overflow-y-auto px-5 pb-8 pt-14 lg:px-10 lg:pt-20"
      >
        <div className="instrument">{content.eyebrow}</div>
        <h2 className="mb-1.5 mt-2 text-[24px] font-medium tracking-[-0.028em] lg:text-[34px]">
          {content.title}
        </h2>
        <p className="text-[13.5px] leading-[1.5]" style={{ color: "var(--txt-2)" }}>
          {content.lede}
        </p>

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
          <b className="instrument mb-1.5 block">Where this comes from</b>
          <p className="text-[12.5px] leading-[1.5]">{content.source}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface SheetContent {
  eyebrow: string;
  title: string;
  lede: string;
  rows: [string, string][];
  source: string;
}

function cardContent(id: PersonaId, place: Place): SheetContent {
  const rule = CARD_RULES[id];
  const detail = CARD_UI[id].detail(place);
  return {
    eyebrow: `${PERSONA_BY_ID[id].label} · ${place.name}`,
    title: rule.title,
    lede: detail.lede,
    rows: detail.rows,
    source: detail.source,
  };
}

function alertContent(place: Place): SheetContent | null {
  const a = place.alert;
  if (!a) return null;

  const rows: [string, string][] = [
    ["Colour code", a.level.toUpperCase()],
    ["Alert type", a.kind],
    ["Valid until", a.validUntil],
    ["Issuing office", a.issuingOffice],
    ["District", place.station],
  ];

  if (a.track) {
    rows.push(
      ["System", a.track.systemName],
      ["Forecast landfall", a.track.landfall],
      ["Track fixes held", `${a.track.fixes.length}`],
    );
  }

  return {
    eyebrow: `IMD CAP feed · ${place.name}`,
    title: a.headline,
    lede: a.body,
    rows,
    source:
      a.kind === "cyclone"
        ? "Parsed from IMD's CAP XML feed and cross-referenced with the Interactive Cyclone Track bulletin, which supplies the fixes drawn on the Places map. Cyclone entries are cached on issue, never on a timer."
        : a.kind === "flash-flood"
          ? "Parsed from IMD's Flash Flood Guidance bulletin, which publishes as CAP alongside district warnings. The same parser handles all three warning types."
          : "Parsed from IMD's Common Alerting Protocol XML feed. Warnings are cached on issue, not on a timer — a new CAP entry invalidates the old one immediately.",
  };
}
