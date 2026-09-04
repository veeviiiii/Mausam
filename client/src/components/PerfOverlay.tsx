import { useEffect, useRef, useState } from "react";

/**
 * Frame-timing readout, enabled with `?perf=1`.
 *
 * Exists because neither the dev sandbox nor a screen recording can answer
 * "is this actually dropping frames, and where". This measures on the device
 * that is actually struggling, which is the only measurement that counts.
 *
 * Reports:
 *   fps    — frames in the last second
 *   worst  — longest single frame in that second (>16.7ms means a drop at 60Hz)
 *   jank   — frames over 33ms in the last second (a visible stutter)
 *   tasks  — main-thread long tasks (>50ms) since load; blocks input, not just
 *            animation, so this is the number that explains touch latency
 *
 * Not shipped behind a build flag on purpose: it costs nothing when the query
 * param is absent, and being able to ask someone to add `?perf=1` to a live
 * URL is worth more than keeping it out of the bundle.
 */
export function PerfOverlay() {
  const [stats, setStats] = useState({ fps: 0, worst: 0, jank: 0, tasks: 0 });
  const tasks = useRef(0);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let frames = 0;
    let worst = 0;
    let jank = 0;
    let windowStart = last;

    let observer: PerformanceObserver | null = null;
    try {
      observer = new PerformanceObserver((list) => {
        tasks.current += list.getEntries().length;
      });
      observer.observe({ entryTypes: ["longtask"] });
    } catch {
      /* Safari and older engines: no longtask support, leave the counter at 0 */
    }

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const delta = now - last;
      last = now;

      frames++;
      if (delta > worst) worst = delta;
      if (delta > 33) jank++;

      if (now - windowStart >= 1000) {
        setStats({
          fps: Math.round((frames * 1000) / (now - windowStart)),
          worst: Math.round(worst),
          jank,
          tasks: tasks.current,
        });
        frames = 0;
        worst = 0;
        jank = 0;
        windowStart = now;
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
    };
  }, []);

  const bad = stats.fps > 0 && stats.fps < 50;

  return (
    <div
      className="pointer-events-none fixed left-2 top-2 z-[999] rounded-lg px-2 py-1.5 font-mono text-[10px] leading-[1.5]"
      style={{
        background: "rgba(6,10,16,.82)",
        color: bad ? "#FF9E9E" : "#9EF7C4",
        border: "1px solid rgba(255,255,255,.18)",
      }}
    >
      <div>
        {stats.fps} fps · worst {stats.worst}ms
      </div>
      <div style={{ color: "rgba(255,255,255,.66)" }}>
        jank {stats.jank}/s · long tasks {stats.tasks}
      </div>
    </div>
  );
}
