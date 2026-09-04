import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP, RADAR, RADAR_ATTRIBUTION, type RadarLayerId } from "../design/tokens";
import { fade, springSheet } from "../animations/variants";

/**
 * Full-screen weather radar.
 *
 * Expands from the Places map with the same shared-element transition the
 * cards use (`layoutId="radar-map"`) rather than inventing a second expand
 * language for one feature.
 *
 * One overlay at a time, by design: stacked raster layers over a dark basemap
 * turn into unreadable mud, and every mainstream radar UI (Windy, Apple,
 * Google) segments them for the same reason. Switching crossfades through
 * MapLibre's native `raster-opacity` transition — a hard pop between two
 * full-screen rasters is the most jarring thing this screen could do.
 */

interface LayerSpec {
  id: RadarLayerId;
  label: string;
  /** null when the provider needs a key that is not configured. */
  tiles: string[] | null;
  unavailableReason?: string;
}

const layerOpacity = (id: RadarLayerId) => `radar-${id}`;

export function RadarMap({ onClose }: { onClose: () => void }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [active, setActive] = useState<RadarLayerId>("precipitation");
  const [layers, setLayers] = useState<LayerSpec[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /* ---- resolve which layers are actually available ---- */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const owmKey = import.meta.env.VITE_OWM_KEY as string | undefined;
      const waqiToken =
        (import.meta.env.VITE_WAQI_TOKEN as string | undefined) || RADAR.waqiDemoToken;

      // RainViewer publishes an index of available radar frames; the newest
      // past frame is the current picture.
      let precipTiles: string[] | null = null;
      try {
        const res = await fetch(RADAR.rainviewerIndex);
        const json = await res.json();
        const frames: { path: string }[] = json?.radar?.past ?? [];
        const latest = frames[frames.length - 1];
        if (json?.host && latest?.path) {
          precipTiles = [`${json.host}${latest.path}/256/{z}/{x}/{y}/2/1_1.png`];
        }
      } catch {
        precipTiles = null;
      }

      if (cancelled) return;

      setLayers([
        {
          id: "precipitation",
          label: "Rain",
          tiles: precipTiles,
          unavailableReason: precipTiles ? undefined : "RainViewer is unreachable right now.",
        },
        {
          id: "wind",
          label: "Wind",
          tiles: owmKey ? [RADAR.owmTemplate(owmKey)] : null,
          unavailableReason: owmKey
            ? undefined
            : "Needs a free OpenWeather key in VITE_OWM_KEY.",
        },
        {
          id: "aqi",
          label: "Air quality",
          tiles: [RADAR.waqiTemplate(waqiToken)],
        },
      ]);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ---- build the map once the layer list is known ---- */
  useEffect(() => {
    const host = hostRef.current;
    if (!host || !layers.length) return;

    let disposed = false;
    let removed = false;
    let map: maplibregl.Map | null = null;

    const safeRemove = () => {
      if (removed || !map) return;
      removed = true;
      try {
        map.remove();
      } catch {
        /* partially-initialised map; nothing left to release */
      }
      mapRef.current = null;
    };

    const timeout = window.setTimeout(() => {
      if (!disposed) setStatus("failed");
    }, MAP.loadTimeoutMs);

    try {
      map = new maplibregl.Map({
        container: host,
        style: MAP.styleUrl,
        center: [80.5, 20.5],
        zoom: 3.2,
        attributionControl: { compact: true },
        dragRotate: false,
        pitchWithRotate: false,
      });
      mapRef.current = map;

      // Only a failure to get off the ground is fatal; individual tile misses
      // are normal on a global raster overlay.
      let styleUp = false;
      map.on("error", () => {
        if (!styleUp && !disposed) setStatus("failed");
      });

      map.on("load", () => {
        window.clearTimeout(timeout);
        if (disposed || !map) return;
        styleUp = true;
        map.resize();

        for (const layer of layers) {
          if (!layer.tiles) continue;
          const key = layerOpacity(layer.id);
          map.addSource(key, {
            type: "raster",
            tiles: layer.tiles,
            tileSize: 256,
            attribution: RADAR_ATTRIBUTION[layer.id].text,
          });
          map.addLayer({
            id: key,
            type: "raster",
            source: key,
            paint: { "raster-opacity": layer.id === active ? 0.85 : 0 },
          });
          // MapLibre supports paint transitions, but its published types omit
          // the `-transition` keys; this is what turns the layer switch into a
          // crossfade instead of a pop.
          map.setPaintProperty(key, "raster-opacity-transition", {
            duration: RADAR.fadeMs,
            delay: 0,
          } as never);
        }
        setStatus("ready");
      });
    } catch {
      window.clearTimeout(timeout);
      setStatus("failed");
    }

    return () => {
      disposed = true;
      window.clearTimeout(timeout);
      safeRemove();
    };
    // Rebuilt only when the resolved layer list changes; switching the active
    // overlay is a paint-property change, not a teardown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers]);

  /* ---- crossfade on switch ---- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;
    for (const layer of layers) {
      if (!layer.tiles) continue;
      const key = layerOpacity(layer.id);
      if (map.getLayer(key)) {
        map.setPaintProperty(key, "raster-opacity", layer.id === active ? 0.85 : 0);
      }
    }
  }, [active, layers, status]);

  const activeSpec = layers.find((l) => l.id === active);
  const credit = RADAR_ATTRIBUTION[active];

  return (
    <motion.div
      layoutId="radar-map"
      transition={springSheet}
      className="absolute inset-0 z-30 overflow-hidden"
      style={{ background: MAP.fallbackBackground, borderRadius: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label="Weather radar"
    >
      <div ref={hostRef} className="absolute inset-0 h-full w-full" />

      {/* Controls sit above the canvas; the map owns everything below. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...fade, delay: 0.14 }}
        className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4"
      >
        <div
          className="pointer-events-auto flex flex-wrap gap-1 rounded-xl p-1"
          style={{ background: "rgba(6,10,16,.74)", border: "1px solid rgba(255,255,255,.16)" }}
          role="group"
          aria-label="Radar layer"
        >
          {layers.map((l) => {
            const on = l.id === active;
            const disabled = !l.tiles;
            return (
              <button
                key={l.id}
                type="button"
                aria-pressed={on}
                disabled={disabled}
                title={l.unavailableReason}
                onClick={() => setActive(l.id)}
                className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors disabled:opacity-40"
                style={{
                  background: on ? "rgba(255,255,255,.16)" : "transparent",
                  color: on ? "#fff" : "rgba(255,255,255,.7)",
                }}
              >
                {l.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close radar"
          className="pointer-events-auto grid h-[36px] w-[36px] shrink-0 place-items-center rounded-full"
          style={{ background: "rgba(6,10,16,.74)", border: "1px solid rgba(255,255,255,.16)", color: "#fff" }}
        >
          <svg viewBox="0 0 16 16" width={15} height={15} fill="none" aria-hidden="true">
            <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </motion.div>

      {/* Attribution is a condition of use for RainViewer, so it is never
          conditional on taste — only on which layer is showing. */}
      <div
        className="pointer-events-auto absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-4 pb-5 pt-3 font-mono text-[10px]"
        style={{
          background: "linear-gradient(to top, rgba(6,10,16,.8), transparent)",
          color: "rgba(255,255,255,.72)",
        }}
      >
        <a href={credit.href} target="_blank" rel="noreferrer noopener" style={{ textDecoration: "underline" }}>
          {credit.text}
        </a>
        <span>
          {status === "loading"
            ? "Loading radar…"
            : status === "failed"
              ? "Radar unavailable"
              : (activeSpec?.unavailableReason ?? "Live")}
        </span>
      </div>

      {status === "failed" ? (
        <div className="absolute inset-0 grid place-items-center px-8 text-center">
          <p className="max-w-[42ch] text-[13.5px] leading-[1.5]" style={{ color: "rgba(255,255,255,.8)" }}>
            The radar basemap could not load. Your saved places and their warnings are still
            available on the previous screen.
          </p>
        </div>
      ) : null}
    </motion.div>
  );
}
