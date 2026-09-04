import { forwardRef } from "react";
import { motion } from "framer-motion";
import { WARNING_SURFACE, RADIUS } from "../design/tokens";
import { fade, springReorder } from "../animations/variants";
import type { Alert } from "../data/types";

const KIND_LABEL: Record<Alert["kind"], string> = {
  district: "District warning",
  cyclone: "Cyclone warning",
  "flash-flood": "Flash flood bulletin",
};

/**
 * The pinned severe-weather banner.
 *
 * This is the one element that ignores personalization entirely — it renders
 * above every persona card whatever the user's personas are, because a warning
 * you have to scroll to find is a warning that failed. CLAUDE.md makes that a
 * hard rule, and the colour is IMD's own code, never our accent.
 */
export const AlertBanner = forwardRef<
  HTMLButtonElement,
  { alert: Alert; place: string; placeId?: string; onOpen?: () => void }
>(function AlertBanner({ alert, place, placeId, onOpen }, ref) {
  const [from, to] = WARNING_SURFACE[alert.level];

  return (
    <motion.button
      ref={ref}
      // Matches DetailSheet's layoutId so the warning morphs open the same way
      // a persona card does. Without it the sheet simply appeared.
      layoutId={placeId ? `alert-${placeId}` : undefined}
      type="button"
      initial={{ opacity: 0, y: -12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1, transition: springReorder }}
      exit={{ opacity: 0, y: -8, scale: 0.97, transition: fade }}
      whileTap={{ scale: 0.98 }}
      onClick={onOpen}
      className="flex w-full items-start gap-3 border border-white/25 p-3.5 text-left text-white shadow-[0_8px_24px_rgba(4,10,20,.3)]"
      style={{
        borderRadius: RADIUS.alert,
        backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
      }}
    >
      <WarnGlyph />
      <span className="min-w-0 flex-1">
        <span className="instrument block !text-white/90">
          {place} · {alert.level} · {KIND_LABEL[alert.kind]}
        </span>
        <span className="mt-1 block text-[12.8px] font-medium leading-[1.38]">
          {alert.body}
        </span>
        <span className="mt-1.5 block font-mono text-[10.5px] text-white/85">
          Valid till {alert.validUntil} · {alert.issuingOffice}
        </span>
      </span>
    </motion.button>
  );
});

/** The empty state is a designed state, not a missing one. */
export const NoAlerts = forwardRef<
  HTMLDivElement,
  { place: string; checked: string }
>(function NoAlerts({ place, checked }, ref) {
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1, transition: springReorder }}
      exit={{ opacity: 0, y: -8, scale: 0.97, transition: fade }}
      className="glass-chip flex items-center gap-2.5 px-3.5 py-2.5 text-[12.3px]"
      style={{ borderRadius: RADIUS.chip, color: "var(--txt-2)" }}
    >
      <span
        className="h-[7px] w-[7px] shrink-0 rounded-full bg-[#37C57D] shadow-[0_0_0_3px_rgba(55,197,125,.26)]"
        aria-hidden
      />
      No active IMD warnings for {place}. Checked {checked}.
    </motion.div>
  );
});

function WarnGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={25}
      height={25}
      fill="none"
      className="mt-0.5 shrink-0"
      aria-hidden="true"
    >
      <path
        d="M12 3.2 22 20H2L12 3.2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="rgba(255,255,255,.16)"
      />
      <path
        d="M12 9.5v5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="17.4" r="1.15" fill="currentColor" />
    </svg>
  );
}
