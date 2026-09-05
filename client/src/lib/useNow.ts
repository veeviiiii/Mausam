import { useEffect, useState } from "react";

/**
 * A clock that actually advances.
 *
 * The hourly strip and the sky's time-of-day are both functions of what time it
 * is, so something has to make "now" a value that changes. Without this, a
 * correctly-computed strip still freezes at whatever hour the page happened to
 * load — the same visible symptom as the baked `clock: "14:20"` this replaced,
 * and harder to spot because the first paint looks right.
 *
 * Ticks on the minute boundary rather than every 60s from mount, so the label
 * flips when the clock does instead of up to a minute late. The work it
 * triggers is a 24-point curve per place — cheap enough that aligning to the
 * boundary is worth more than skipping the render.
 */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer: number;

    const schedule = () => {
      const ms = 60_000 - (Date.now() % 60_000);
      timer = window.setTimeout(() => {
        setNow(new Date());
        schedule();
      }, ms);
    };

    schedule();
    return () => window.clearTimeout(timer);
  }, []);

  return now;
}
