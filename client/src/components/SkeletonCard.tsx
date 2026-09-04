import { motion } from "framer-motion";
import { RADIUS } from "../design/tokens";
import { cardVariants } from "../animations/variants";

/**
 * Skeletons, never spinners. CLAUDE.md requires a skeleton wherever data is
 * fetched, and the bar widths below match the real card's shape — label,
 * readout, viz, footnote — so the transition into content doesn't jump.
 */
export function SkeletonCard({ index = 0 }: { index?: number }) {
  return (
    <motion.div
      layout
      custom={index}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="skeleton"
      style={{ borderRadius: RADIUS.card }}
      aria-hidden="true"
    >
      <div className="flex flex-col gap-2.5 p-4">
        <Bar w="44%" h={9} />
        <Bar w="70%" h={20} />
        <Bar w="100%" h={9} />
        <Bar w="82%" h={9} />
      </div>
    </motion.div>
  );
}

function Bar({ w, h }: { w: string; h: number }) {
  return (
    <div
      className="chip-on rounded-[5px]"
      style={{ width: w, height: h }}
    />
  );
}

export function SkeletonStack({ count }: { count: number }) {
  return (
    <div
      className="flex flex-col gap-3 px-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 lg:px-0 2xl:grid-cols-3"
      role="status"
      aria-label="Loading your cards"
    >
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} index={i} />
      ))}
    </div>
  );
}
