import { useRef, useState, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  useTransform,
} from "framer-motion";
import { SPRINGS } from "../design/tokens";

const MAX_PULL = 96;
const TRIP = 64;
const DIAL_CIRCUMFERENCE = 88; // 2 * pi * r, r = 14

/**
 * Custom pull-to-refresh.
 *
 * The dial is a rain gauge: the arc fills as you pull, a droplet fades in as it
 * approaches the trip point, and the whole thing spins while refreshing. The
 * release is a spring (SPRINGS.refresh), not a duration — so an over-pull
 * settles back with a little weight instead of snapping.
 */
export function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const startY = useRef<number | null>(null);
  const rawPull = useRef(0);
  const [busy, setBusy] = useState(false);

  const pull = useMotionValue(0);
  const y = useSpring(pull, SPRINGS.refresh);
  const progress = useTransform(pull, [0, TRIP], [0, 1], { clamp: true });
  const dialOpacity = useTransform(progress, [0, 0.25, 1], [0, 0.4, 1]);
  const dialScale = useTransform(progress, [0, 1], [0.6, 1]);
  const dashOffset = useTransform(
    progress,
    (p) => DIAL_CIRCUMFERENCE - DIAL_CIRCUMFERENCE * (p as number),
  );
  const dropOpacity = useTransform(progress, [0.4, 1], [0, 0.9], { clamp: true });

  /**
   * The pulled content is a plain div, written to directly from the spring.
   *
   * It used to be a motion.div, but that made it a *motion parent* for the whole
   * app, and Framer treats motion descendants that use variant labels as variant
   * children of the nearest motion ancestor — they then wait for that ancestor
   * to propagate a variant instead of running their own `animate`. Every screen
   * sat frozen at its `initial` values and no exit ever completed. Keeping this
   * wrapper out of the motion tree fixes both.
   */
  useMotionValueEvent(y, "change", (v) => {
    if (contentRef.current) {
      contentRef.current.style.transform = v ? `translateY(${v}px)` : "";
    }
  });

  const begin = (clientY: number) => {
    if (busy) return;
    if ((scrollerRef.current?.scrollTop ?? 0) > 0) return;
    startY.current = clientY;
  };

  const move = (clientY: number) => {
    if (startY.current === null) return;
    const dy = clientY - startY.current;
    if (dy <= 0) {
      rawPull.current = 0;
      pull.set(0);
      return;
    }
    // Resistance: the further you pull, the less it gives.
    rawPull.current = Math.min(MAX_PULL, dy * 0.55);
    pull.set(rawPull.current);
  };

  const end = async () => {
    if (startY.current === null) return;
    const tripped = rawPull.current >= TRIP;
    startY.current = null;

    if (tripped && !busy) {
      setBusy(true);
      pull.set(52);
      await onRefresh();
      setBusy(false);
    }
    rawPull.current = 0;
    pull.set(0);
  };

  return (
    <div className="relative h-full">
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-1.5 z-[6] flex justify-center"
        style={{ opacity: dialOpacity, scale: dialScale }}
      >
        <motion.svg
          viewBox="0 0 36 36"
          width={36}
          height={36}
          aria-hidden="true"
          animate={busy ? { rotate: 360 } : { rotate: 0 }}
          transition={busy ? { duration: 0.9, repeat: Infinity, ease: "linear" } : { duration: 0.2 }}
        >
          <circle cx="18" cy="18" r="14" fill="none" stroke="var(--hair-strong)" strokeWidth="2.5" />
          <motion.circle
            cx="18"
            cy="18"
            r="14"
            fill="none"
            stroke="var(--txt)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={DIAL_CIRCUMFERENCE}
            style={{ strokeDashoffset: busy ? 22 : dashOffset, rotate: -90, originX: "18px", originY: "18px" }}
          />
          <motion.path
            d="M18 8.5c2.4 3 4 5 4 6.6a4 4 0 0 1-8 0c0-1.6 1.6-3.6 4-6.6Z"
            fill="var(--txt)"
            style={{ opacity: busy ? 0.9 : dropOpacity }}
          />
        </motion.svg>
      </motion.div>

      <div
        ref={scrollerRef}
        className="no-scrollbar h-full overflow-y-auto overflow-x-hidden"
        onPointerDown={(e) => begin(e.clientY)}
        onPointerMove={(e) => move(e.clientY)}
        onPointerUp={end}
        onPointerCancel={end}
        onPointerLeave={end}
      >
        <div ref={contentRef}>{children}</div>
      </div>
    </div>
  );
}
