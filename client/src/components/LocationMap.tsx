import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP, WARNING_COLOR } from "../design/tokens";
import type { Place } from "../data/types";

type Status = "loading" | "live" | "fallback";

/**
 * Saved locations on a map.
 *
 * Tiles come from OpenFreeMap: free, keyless, unmetered, MIT-licensed and
 * self-hostable if reliability during judging becomes a concern. Explicitly not
 * CARTO — despite what older tutorials say, their current licence restricts
 * hosted basemap tiles to enterprise and non-profit-grant customers.
 *
 * If the style does not arrive inside MAP.loadTimeoutMs we drop to a static
 * plate that projects the same markers over a graticule. That is a designed
 * state, not an error state — same reasoning as the seeded fallback dataset.
 */
export function LocationMap({
  places,
  activeId,
  onSelect,
  onExpand,
}: {
  places: Place[];
  activeId: string;
  onSelect: (id: string) => void;
  /** Opens the full-screen radar; the container is its morph source. */
  onExpand?: () => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let map: maplibregl.Map | null = null;
    let removed = false;
    let drew = false;
    let styleUp = false;
    let tileCheck = 0;
    let sizeWatcher: ResizeObserver | null = null;

    /**
     * Exactly once, and never allowed to throw. A map that failed mid-style-load
     * has a half-built internal state, and calling remove() on it twice — once
     * from the fallback path, once from unmount — throws during cleanup and
     * takes the whole React tree down with it.
     */
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

    const fail = () => {
      if (disposed) return;
      window.clearTimeout(tileCheck);
      setStatus("fallback");
      safeRemove();
    };

    /**
     * Both timers below must respect page visibility. MapLibre renders on
     * requestAnimationFrame, which browsers pause entirely on a hidden tab — so
     * a backgrounded tab can never "draw", and timing out against that would
     * flip a perfectly healthy map to the offline outline.
     */
    const armGrace = () => {
      window.clearTimeout(tileCheck);
      tileCheck = window.setTimeout(() => {
        if (disposed || drew) return;
        if (document.visibilityState !== "visible") {
          document.addEventListener("visibilitychange", onVisible, { once: true });
          return;
        }
        fail();
      }, MAP.tileGraceMs);
    };
    const onVisible = () => {
      if (!disposed && !drew) armGrace();
    };

    const timeout = window.setTimeout(fail, MAP.loadTimeoutMs);

    try {
      map = new maplibregl.Map({
        container: host,
        style: MAP.styleUrl,
        center: [80.5, 20.5],
        zoom: 3.3,
        attributionControl: { compact: true },
        dragRotate: false,
        pitchWithRotate: false,
      });
      mapRef.current = map;

      /**
       * Only a failure to get off the ground is fatal. Once the style is up,
       * MapLibre reports individual tile 404s, missing glyph ranges and sprite
       * hiccups through the same channel, and tearing the map down over one of
       * those would be a self-inflicted outage.
       */
      map.on("error", () => {
        if (!styleUp) fail();
      });

      /**
       * A style that loads is not the same as a map that draws. If tiles are
       * blocked, MapLibre still fires `load` and we would sit there showing a
       * black rectangle labelled "live" — worse than the fallback, and exactly
       * what would happen in front of judges on a restricted network.
       *
       * `idle` is MapLibre's own "everything requested has been rendered"
       * signal, so it is the honest test. (Counting `data` events is not: the
       * payload shape varies by source type and silently never matched, which
       * made every map fall back even with tiles loading fine.)
       */
      map.once("idle", () => {
        drew = true;
        window.clearTimeout(tileCheck);
      });

      /* The container changes height at the lg breakpoint, and a map that
         missed a resize renders into stale dimensions. */
      sizeWatcher = new ResizeObserver(() => map?.resize());
      sizeWatcher.observe(host);

      map.on("load", () => {
        window.clearTimeout(timeout);
        if (disposed || !map) return;
        styleUp = true;
        map.resize();
        setStatus("live");

        armGrace();

        // Cyclone tracks, where the CAP entry carries fixes.
        const tracked = places.filter((p) => p.alert?.track);
        if (tracked.length) {
          map.addSource("cyclone-track", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: tracked.map((p) => ({
                type: "Feature" as const,
                properties: { name: p.alert!.track!.systemName },
                geometry: { type: "LineString" as const, coordinates: p.alert!.track!.fixes },
              })),
            },
          });
          map.addLayer({
            id: "cyclone-track-line",
            type: "line",
            source: "cyclone-track",
            paint: {
              "line-color": WARNING_COLOR.orange,
              "line-width": 2.5,
              "line-dasharray": [2, 1.5],
              "line-opacity": 0.9,
            },
          });
        }

        for (const p of places) {
          const el = markerElement(p, p.id === activeId);
          el.addEventListener("click", () => onSelect(p.id));
          new maplibregl.Marker({ element: el }).setLngLat([p.lon, p.lat]).addTo(map);
        }

        map.fitBounds(
          [
            [MAP.bounds.west, MAP.bounds.south],
            [MAP.bounds.east, MAP.bounds.north],
          ],
          { padding: 26, duration: 0 },
        );
      });
    } catch {
      window.clearTimeout(timeout);
      fail();
    }

    return () => {
      disposed = true;
      window.clearTimeout(timeout);
      window.clearTimeout(tileCheck);
      document.removeEventListener("visibilitychange", onVisible);
      sizeWatcher?.disconnect();
      safeRemove();
    };
    // Markers are rebuilt when the place list changes; activeId is handled by
    // the highlight ring below rather than by tearing the map down.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places]);

  return (
    <motion.div
      layoutId="radar-map"
      className="relative mx-4 mb-3 h-[188px] overflow-hidden rounded-[20px] border lg:mx-0 lg:mb-5 lg:h-[340px]"
      style={{ borderColor: "var(--hair)", background: MAP.fallbackBackground }}
    >
      {status === "fallback" ? (
        <StaticPlate places={places} activeId={activeId} onSelect={onSelect} />
      ) : (
        /* Sized with h/w rather than inset-0: MapLibre stamps
           class="maplibregl-map" on this node and its stylesheet forces
           position:relative, which would make inset-0 a no-op and collapse the
           container to zero height — a black box with a working map inside it. */
        <div ref={hostRef} className="h-full w-full" />
      )}

      {onExpand ? (
        <button
          type="button"
          onClick={onExpand}
          className="absolute bottom-3 right-3 z-[2] rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold"
          style={{
            background: "rgba(6,10,16,.74)",
            border: "1px solid rgba(255,255,255,.18)",
            color: "#fff",
          }}
        >
          Open radar
        </button>
      ) : null}

      <span
        className="instrument pointer-events-none absolute left-3 top-3 rounded px-1.5 py-0.5"
        style={{ background: "rgba(6,10,16,.6)", color: "rgba(255,255,255,.72)" }}
      >
        {status === "live" ? "OpenFreeMap · live" : status === "fallback" ? "Offline outline" : "Loading map"}
      </span>
    </motion.div>
  );
}

function markerElement(place: Place, active: boolean): HTMLElement {
  const el = document.createElement("button");
  el.type = "button";
  el.setAttribute("aria-label", `${place.name}, ${place.temp} degrees`);
  el.style.cssText = [
    "display:flex;align-items:center;gap:5px;padding:3px 7px 3px 4px",
    "border-radius:999px;cursor:pointer;font:600 11px/1 var(--font-ui,sans-serif)",
    "background:rgba(10,16,24,.82);color:#fff",
    `border:1px solid ${place.alert ? WARNING_COLOR[place.alert.level] : "rgba(255,255,255,.28)"}`,
    active ? "box-shadow:0 0 0 3px rgba(255,255,255,.24)" : "",
  ].join(";");

  const dot = document.createElement("span");
  dot.style.cssText = `width:7px;height:7px;border-radius:50%;background:${
    place.alert ? WARNING_COLOR[place.alert.level] : "#37C57D"
  }`;
  el.append(dot, document.createTextNode(`${place.name} ${place.temp}°`));
  return el;
}

/** No live tiles: same data, projected by hand over a graticule. */
function StaticPlate({
  places,
  activeId,
  onSelect,
}: {
  places: Place[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const { west, east, south, north } = MAP.bounds;
  const x = (lon: number) => ((lon - west) / (east - west)) * 100;
  const y = (lat: number) => ((north - lat) / (north - south)) * 100;

  return (
    <div className="absolute inset-0">
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
        {[0, 25, 50, 75, 100].map((p) => (
          <line key={`h${p}`} x1="0" y1={`${p}%`} x2="100%" y2={`${p}%`} stroke={MAP.graticule} strokeWidth="1" />
        ))}
        {[0, 25, 50, 75, 100].map((p) => (
          <line key={`v${p}`} x1={`${p}%`} y1="0" x2={`${p}%`} y2="100%" stroke={MAP.graticule} strokeWidth="1" />
        ))}
      </svg>

      {places.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onSelect(p.id)}
          className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold text-white"
          style={{
            left: `${x(p.lon)}%`,
            top: `${y(p.lat)}%`,
            background: "rgba(10,16,24,.82)",
            borderColor: p.alert ? WARNING_COLOR[p.alert.level] : "rgba(255,255,255,.28)",
            boxShadow: p.id === activeId ? "0 0 0 3px rgba(255,255,255,.24)" : undefined,
          }}
        >
          <span
            className="block h-[6px] w-[6px] rounded-full"
            style={{ background: p.alert ? WARNING_COLOR[p.alert.level] : "#37C57D" }}
          />
          {p.name}
        </button>
      ))}
    </div>
  );
}
