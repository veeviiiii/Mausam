import { motion } from "framer-motion";
import { RADIUS } from "../design/tokens";
import { fade } from "../animations/variants";
import { ADVISORY_TONE, advisoriesFor } from "../personalization/advisories";
import { sourcesFor } from "../data/provenance";
import { useT } from "../i18n/context";
import type { Place } from "../data/types";
import type { LiveAqi } from "../lib/useLiveAqi";

/**
 * The single most important thing to do, on the home screen.
 *
 * The advice engine lived entirely inside the warning sheet, which meant the
 * most useful thing the app produces — an instruction rather than a number —
 * was two taps deep, behind one specific element, and completely unreachable in
 * a city with no active warning. Someone opening the app and scrolling would
 * never learn it existed.
 *
 * So the top-ranked line surfaces here, under the banner. The ordering in
 * advisoriesFor already puts life-safety first, so "top-ranked" is the right
 * one to lift without any extra logic.
 *
 * Deliberately not a button. The banner directly above already opens the full
 * list, and a second tap target doing the same thing is noise — and in a city
 * with no warning there would be no sheet for it to open, so a tappable version
 * would have to behave differently on different screens.
 */
export function TopAdvice({ place, liveAqi }: { place: Place; liveAqi: LiveAqi | null }) {
  const t = useT();

  const top = advisoriesFor(place, sourcesFor(place, liveAqi, t)).find((a) => a.id !== "none");

  // The "nothing to act on" fallback is skipped: the no-warnings chip directly
  // above already says the same thing, and repeating it reads as padding.
  if (!top) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={fade}
      className="glass-chip mt-2 flex items-start gap-2.5 px-3.5 py-2.5"
      style={{ borderRadius: RADIUS.chip }}
    >
      <span
        className="mt-[5px] h-[8px] w-[8px] shrink-0 rounded-full"
        style={{ background: ADVISORY_TONE[top.tone] }}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <b className="block text-[13px] font-semibold">{t(top.titleKey)}</b>
        <small className="mt-0.5 block text-[11.5px] leading-[1.42]" style={{ color: "var(--txt-2)" }}>
          {t(top.whyKey, top.vars)}
        </small>
      </span>
      {/* Same provenance contract as the sheet: an instruction on screen says
          whether the reading behind it is live or demo data. */}
      <span
        className="mt-[3px] shrink-0 rounded-[4px] border px-1 py-px font-mono text-[8px] uppercase tracking-[0.06em]"
        style={{ borderColor: "var(--hair)", color: "var(--txt-2)" }}
      >
        {t(`src.status.${top.source.status}`)}
      </span>
    </motion.div>
  );
}
