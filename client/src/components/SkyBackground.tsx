import { useEffect, useRef, useState } from "react";
import { SKY_TOKENS, skyFor, heroScrimCss, TIMING, type Condition, type TimeOfDay } from "../design/tokens";
import { AmbientLayer } from "./AmbientLayer";

/**
 * The weather background.
 *
 * Built so that it cannot disappear. The previous version cross-faded by
 * mounting the new sky at `opacity: 0` and animating it up; if that animation
 * never ran — a paused rAF, a backgrounded tab, an AnimatePresence child that
 * failed to settle — the screen was left with no background at all. On a sky
 * whose text tokens are white, that means white-on-white: the page looks blank
 * even though every element rendered fine.
 *
 * So the current sky is now a plain, always-opaque base layer that no animation
 * touches. The cross-fade happens in a second layer *above* it holding the
 * OUTGOING sky, fading out and then unmounted by a timer rather than by an
 * animation callback. Worst case, a stale sky lingers for a moment. There is no
 * code path that leaves the background empty.
 */
export function SkyBackground({
  condition,
  timeOfDay,
  covered = false,
}: {
  condition: Condition;
  timeOfDay: TimeOfDay;
  /** An open sheet hides the sky entirely — no reason to keep animating it. */
  covered?: boolean;
}) {
  const sky = skyFor(condition, timeOfDay);
  const scrim = heroScrimCss(sky.hero);
  const key = `${condition}/${timeOfDay}`;

  const lastKey = useRef(key);
  const [outgoing, setOutgoing] = useState<{ key: string; gradient: string } | null>(null);

  useEffect(() => {
    if (lastKey.current === key) return;
    const previous = SKY_TOKENS[
      lastKey.current.split("/")[0] as Condition
    ]?.[lastKey.current.split("/")[1] as TimeOfDay];
    lastKey.current = key;
    if (!previous) return;

    setOutgoing({ key: `${previous.condition}/${previous.timeOfDay}`, gradient: previous.gradient });
    const fadeMs = TIMING.skyFade.duration * 1000;
    const t = window.setTimeout(() => setOutgoing(null), fadeMs + 60);
    return () => window.clearTimeout(t);
  }, [key]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* Base — the current sky, always fully opaque, never animated. */}
      <div className="absolute inset-0" style={{ background: sky.gradient }} />

      {/* The sky being left behind, fading out on top of the new one. Driven by
          a CSS transition and removed by a timer, so nothing here depends on an
          animation reporting completion. */}
      {outgoing ? (
        <div
          key={outgoing.key}
          className="absolute inset-0"
          style={{
            background: outgoing.gradient,
            animation: `sky-fade-out ${TIMING.skyFade.duration}s cubic-bezier(${TIMING.skyFade.ease.join(",")}) forwards`,
          }}
        />
      ) : null}

      <AmbientLayer condition={condition} timeOfDay={timeOfDay} mode={sky.mode} paused={covered} />

      {/* The smallest scrim that gets bare hero text to AA on this sky — 0 on
          skies that already clear it, so most conditions paint nothing here. */}
      {scrim ? <div className="absolute inset-0 z-[2]" style={{ backgroundImage: scrim }} /> : null}
    </div>
  );
}
