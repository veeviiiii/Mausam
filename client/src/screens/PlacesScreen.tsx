import { Suspense, lazy, useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "../state/AppState";
import { ScreenHeading } from "../components/ScreenHeading";
import { WeatherIcon } from "../components/WeatherIcon";
import { RADIUS, WARNING_COLOR } from "../design/tokens";
import { springCard } from "../animations/variants";
import { timeOfDayFor } from "../lib/time";
import { useT } from "../i18n/context";

/**
 * MapLibre is ~800 kB of the bundle on its own. Splitting it out keeps the
 * homepage's first load small, which is the whole point of this project — the
 * map only downloads when someone actually opens Places.
 */
const LocationMap = lazy(() =>
  import("../components/LocationMap").then((m) => ({ default: m.LocationMap })),
);

/** Same chunk-splitting rationale as the map: radar is not homepage weight. */
const RadarMap = lazy(() =>
  import("../components/RadarMap").then((m) => ({ default: m.RadarMap })),
);

export function PlacesScreen() {
  const t = useT();
  const { place, places: PLACES, selectPlace } = useApp();
  const [radarOpen, setRadarOpen] = useState(false);
  const [radarClosing, setRadarClosing] = useState(false);

  // Same pattern as the detail sheet: play the exit, unmount on a timer.
  const closeRadar = () => {
    setRadarClosing(true);
    window.setTimeout(() => {
      setRadarOpen(false);
      setRadarClosing(false);
    }, 210);
  };

  return (
    <>
      <ScreenHeading
        title={t("screen.places.title")}
        blurb={t("screen.places.blurb")}
      />

      <Suspense fallback={<MapSkeleton label={t("map.loading")} />}>
        <LocationMap
          places={PLACES}
          activeId={place.id}
          onSelect={selectPlace}
          onExpand={() => setRadarOpen(true)}
        />
      </Suspense>

      {radarOpen ? (
        <Suspense fallback={null}>
          <RadarMap onClose={closeRadar} closing={radarClosing} />
        </Suspense>
      ) : null}

      <div className="flex flex-col gap-2.5 px-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:px-0 2xl:grid-cols-3">
        {PLACES.map((p) => (
          <motion.button
            key={p.id}
            type="button"
            layout
            whileTap={{ scale: 0.98 }}
            transition={springCard}
            onClick={() => selectPlace(p.id)}
            className="glass flex h-full w-full flex-col px-4 py-3.5 text-left"
            style={{ borderRadius: RADIUS.plate }}
          >
            <span className="flex items-center gap-3">
              <WeatherIcon condition={p.condition} size={30} />
              <span className="min-w-0 flex-1">
                <b className="block text-[15px] font-semibold">{p.name}</b>
                <small className="mt-px block text-[11.5px]" style={{ color: "var(--txt-2)" }}>
                  {t(`cond.${p.condition}`)} · {t(`tod.${timeOfDayFor(p)}`)} · {p.station}
                </small>
              </span>
              <span className="tnum ml-auto text-[25px] font-light tracking-[-0.03em]">{p.temp}°</span>
            </span>

            {/* Always rendered, so every plate is the same height and a row of
                them shares one baseline. "No warning" is also the more useful
                thing to say than nothing at all. */}
            <span className="mt-2.5 flex">
              {p.alert ? (
                <span
                  className="rounded-[5px] px-1.5 py-0.5 font-mono text-[8.5px] font-bold uppercase tracking-[0.06em] text-white"
                  style={{ background: WARNING_COLOR[p.alert.level] }}
                >
                  {t(`level.${p.alert.level}`)} · {t(`alert.kind.${p.alert.kind}`)}
                </span>
              ) : (
                <span
                  className="chip-on rounded-[5px] px-1.5 py-0.5 font-mono text-[8.5px] font-bold uppercase tracking-[0.06em]"
                  style={{ color: "var(--txt-2)" }}
                >
                  {t("alert.noWarning")}
                </span>
              )}
            </span>
          </motion.button>
        ))}
      </div>
    </>
  );
}

function MapSkeleton({ label }: { label: string }) {
  return (
    <div
      className="skeleton mx-4 mb-3 h-[188px] rounded-[20px] lg:mx-0 lg:mb-5 lg:h-[340px]"
      role="status"
      aria-label={label}
    />
  );
}
