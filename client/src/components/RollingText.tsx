import { AnimatePresence, motion } from "framer-motion";
import { cityRollVariants } from "../animations/variants";

/**
 * A text slot whose contents roll rather than swap.
 *
 * Used for the city heading: the outgoing name rises out of the slot while the
 * incoming one comes up from below, so changing location reads as travelling
 * somewhere, not as a string being replaced. Timing comes from SPRINGS.heading.
 *
 * The slot clips its overflow, so both names are only ever visible inside the
 * line box — no layout shift while the two are in flight.
 */
export function RollingText({
  value,
  className = "",
  ariaLabel,
}: {
  value: string;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <span
      className={`relative block overflow-hidden ${className}`}
      aria-label={ariaLabel ?? value}
      role="text"
    >
      {/* Reserves the line box so the row never collapses mid-transition. */}
      <span className="invisible block" aria-hidden="true">
        {value}
      </span>
      <AnimatePresence initial={false}>
        <motion.span
          key={value}
          className="absolute inset-0 block"
          variants={cityRollVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          aria-hidden="true"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
