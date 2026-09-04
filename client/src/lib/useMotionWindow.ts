import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A short window during which the UI is "in motion".
 *
 * Used to strip `backdrop-filter` off surfaces while they animate. Scaling or
 * translating a backdrop-filtered element makes the browser re-sample and
 * re-blur its backdrop through the transform on every frame; with a stack of
 * glass cards animating at once, that is N simultaneous blur recomputes per
 * frame. Dropping to the flat surface for the duration removes the cost
 * entirely, and at 500ms nobody perceives the surface change.
 *
 * Closed by a timer, never by an animation-completion callback — a callback
 * that fails to fire would strand the UI in its flat state permanently, which
 * is the trap already hit twice in this codebase.
 */
export function useMotionWindow(ms = 520) {
  const [active, setActive] = useState(false);
  const timer = useRef<number | null>(null);

  const begin = useCallback(() => {
    setActive(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setActive(false);
    }, ms);
  }, [ms]);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  return [active, begin] as const;
}
