import { useEffect, useRef } from "react";
import type { Condition, GlassMode, TimeOfDay } from "../design/tokens";

/**
 * Ambient weather motion behind the glass.
 *
 * Every condition gets its own treatment — previously `thunderstorm` silently
 * reused rain's, `overcast` showed stars through solid cloud at night, and
 * `clear`/`partly` had nothing at all during the day. See docs/condition-audit.md.
 *
 * Performance notes, since this is the one always-running animation and
 * CLAUDE.md targets mid-range Android:
 *   - throttled to ~30fps; nothing here reads as choppy at half rate
 *   - device pixel ratio capped at 1.5 — this sits behind a 20px blur, so
 *     rendering it at 2x is detail nobody can see
 *   - rain and snow batch every particle into ONE path per frame instead of a
 *     beginPath/stroke per drop
 *   - particle counts scale with viewport area rather than being fixed, so a
 *     phone does not pay a desktop's price
 */

type Kind = "rain" | "storm" | "snow" | "fog" | "stars" | "clouds" | "motes" | "none";

export function kindFor(condition: Condition, timeOfDay: TimeOfDay): Kind {
  const night = timeOfDay === "night";
  switch (condition) {
    case "rain":
      return "rain";
    case "thunderstorm":
      return "storm";
    case "snow":
      return "snow";
    case "fog":
      return "fog";
    case "overcast":
      // Never stars: you cannot see them through overcast cloud.
      return "clouds";
    case "partly":
      return night ? "stars" : "clouds";
    case "clear":
      return night ? "stars" : "motes";
    default:
      return "none";
  }
}

interface Particle {
  x: number;
  y: number;
  v: number;
  len: number;
  alpha: number;
  phase: number;
}

/**
 * Runs at the display's native frame rate. The previous 480px/24fps cap made
 * the rain visibly coarse — the fix for compositor cost is a *pixel budget*
 * and pausing when covered, not throwing away resolution and frames.
 *
 * If a device genuinely cannot hold the frame budget, `DOWNSHIFT_MS` trips a
 * one-time quality drop rather than letting it grind. One-way, so it can never
 * oscillate between quality levels mid-animation.
 */
const DOWNSHIFT_MS = 22;
const DOWNSHIFT_AFTER_FRAMES = 40;

/** Pixel budget for the backing store — the real lever on fill cost. */
const PIXEL_BUDGET_DESKTOP = 1_400_000;
const PIXEL_BUDGET_MOBILE = 800_000;

/** Particle budget per million device-independent pixels, by kind. */
const DENSITY: Record<Kind, number> = {
  rain: 150,
  storm: 190,
  snow: 95,
  fog: 14,
  stars: 120,
  clouds: 16,
  motes: 55,
  none: 0,
};

export function AmbientLayer({
  condition,
  timeOfDay,
  mode,
  paused = false,
}: {
  condition: Condition;
  timeOfDay: TimeOfDay;
  mode: GlassMode;
  /** Skip the loop entirely while something opaque covers the sky. */
  paused?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const kind = kindFor(condition, timeOfDay);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (paused) {
      const c = canvas.getContext("2d");
      c?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    let raf = 0;
    let particles: Particle[] = [];
    let w = 0;
    let h = 0;
    /** 1 = full quality. Raised once, permanently, if frames run long. */
    let quality = 1;
    let slowFrames = 0;

    const seed = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;

      // Budget total pixels rather than clamping an edge: full device
      // resolution where it is affordable, scaled down only once the backing
      // store would exceed what a frame can comfortably fill.
      const budget = w < 1024 ? PIXEL_BUDGET_MOBILE : PIXEL_BUDGET_DESKTOP;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const wanted = w * h * dpr * dpr;
      const scale = (wanted > budget ? Math.sqrt(budget / (w * h)) : dpr) / quality;

      canvas.width = Math.max(1, Math.round(w * scale));
      canvas.height = Math.max(1, Math.round(h * scale));
      ctx.setTransform(scale, 0, 0, scale, 0, 0);

      const area = (w * h) / 1_000_000;
      const n = Math.max(6, Math.round((DENSITY[kind] * Math.max(0.12, area)) / quality));

      particles = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        v:
          kind === "rain" || kind === "storm"
            ? 4 + Math.random() * 4
            : kind === "snow"
              ? 0.5 + Math.random() * 0.7
              : kind === "motes"
                ? 0.12 + Math.random() * 0.22
                : 0.15,
        len:
          kind === "rain" || kind === "storm"
            ? 9 + Math.random() * 11
            : 1 + Math.random() * 2,
        alpha: 0.25 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    seed();
    const ro = new ResizeObserver(seed);
    ro.observe(canvas);

    if (kind === "none" || reduced) {
      ctx.clearRect(0, 0, w, h);
      return () => ro.disconnect();
    }

    const onDark = mode === "onDark";
    let t = 0;
    let last = 0;
    /** Lightning: countdown to the next strike, then a short decaying flash. */
    let nextStrike = 1.2 + Math.random() * 3.5;
    let flash = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const gap = last ? now - last : 16.7;
      const dt = last ? Math.min(0.1, gap / 1000) : 0.0167;
      last = now;
      t += dt;

      // One-way quality downshift on hardware that cannot hold the budget.
      if (quality === 1 && gap > DOWNSHIFT_MS) {
        if (++slowFrames >= DOWNSHIFT_AFTER_FRAMES) {
          quality = 2;
          seed();
        }
      } else if (gap <= DOWNSHIFT_MS) {
        slowFrames = 0;
      }

      ctx.clearRect(0, 0, w, h);

      switch (kind) {
        case "rain":
        case "storm": {
          const heavy = kind === "storm";
          // One path for every drop — a stroke call per drop is the expensive way.
          ctx.beginPath();
          for (const p of particles) {
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - 1.6, p.y + p.len);
            p.y += p.v * (heavy ? 1.5 : 1) * (dt / 0.033);
            p.x -= 0.35 * (dt / 0.033);
            if (p.y > h) {
              p.y = -14;
              p.x = Math.random() * w;
            }
          }
          ctx.strokeStyle = onDark ? "rgba(190,220,245,.42)" : "rgba(255,255,255,.55)";
          ctx.lineWidth = 1.1;
          ctx.stroke();

          if (heavy) {
            nextStrike -= dt;
            if (nextStrike <= 0) {
              flash = 1;
              nextStrike = 1.6 + Math.random() * 4.5;
            }
            if (flash > 0) {
              // Two-stage decay reads like a real strike rather than a fade.
              flash = Math.max(0, flash - dt * (flash > 0.6 ? 6 : 2.4));
              ctx.fillStyle = `rgba(214,228,255,${(flash * 0.22).toFixed(3)})`;
              ctx.fillRect(0, 0, w, h);
            }
          }
          break;
        }

        case "snow": {
          ctx.beginPath();
          for (const p of particles) {
            const x = p.x + Math.sin(t + p.phase) * 7;
            ctx.moveTo(x + p.len, p.y);
            ctx.arc(x, p.y, p.len, 0, Math.PI * 2);
            p.y += p.v * (dt / 0.033);
            if (p.y > h) {
              p.y = -6;
              p.x = Math.random() * w;
            }
          }
          ctx.fillStyle = "rgba(255,255,255,.8)";
          ctx.fill();
          break;
        }

        case "stars": {
          ctx.fillStyle = "#fff";
          for (const p of particles) {
            ctx.globalAlpha = p.alpha * (0.55 + 0.45 * Math.sin(t * 1.4 + p.phase));
            ctx.beginPath();
            ctx.arc(p.x, p.y * 0.62, p.len * 0.6, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
          break;
        }

        case "fog": {
          ctx.fillStyle = onDark ? "#9AA6B4" : "#FFFFFF";
          particles.forEach((p, i) => {
            ctx.globalAlpha = 0.05 + 0.035 * Math.sin(t * 0.5 + p.phase);
            const y = (i / particles.length) * h + Math.sin(t * 0.3 + p.phase) * 10;
            ctx.fillRect(0, y, w, 46);
          });
          ctx.globalAlpha = 1;
          break;
        }

        case "clouds": {
          // Broad, very soft banks drifting sideways at different rates.
          ctx.fillStyle = onDark ? "#C6CFD8" : "#FFFFFF";
          particles.forEach((p, i) => {
            ctx.globalAlpha = 0.035 + 0.025 * Math.sin(t * 0.22 + p.phase);
            const bandH = h / 3.2;
            const y = ((i * 1.7) % 3.2) * bandH * 0.9 - bandH * 0.3;
            const x = ((t * (6 + (i % 3) * 4) + p.phase * 90) % (w + 460)) - 230;
            ctx.beginPath();
            ctx.ellipse(x, y + bandH * 0.5, 210, bandH * 0.42, 0, 0, Math.PI * 2);
            ctx.fill();
          });
          ctx.globalAlpha = 1;
          break;
        }

        case "motes": {
          // Clear day: slow sunlit dust, so the sky is never entirely static.
          ctx.fillStyle = onDark ? "#FFFFFF" : "#FFF6DC";
          ctx.beginPath();
          for (const p of particles) {
            const x = p.x + Math.sin(t * 0.5 + p.phase) * 12;
            const y = p.y - p.v * 12 * (dt / 0.033) * 0.6;
            p.y = y < -8 ? h + 8 : y;
            ctx.moveTo(x + p.len, p.y);
            ctx.arc(x, p.y, p.len * 0.75, 0, Math.PI * 2);
          }
          ctx.globalAlpha = 0.5;
          ctx.fill();
          ctx.globalAlpha = 1;
          break;
        }
      }
    };

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [condition, timeOfDay, mode, paused]);

  // h-full/w-full, not inset-0: a <canvas> is a replaced element and will sit at
  // its intrinsic 300x150 under inset-0 alone.
  return <canvas ref={ref} className="absolute inset-0 z-[1] h-full w-full pointer-events-none" />;
}
