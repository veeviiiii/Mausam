import { Suspense, lazy } from "react";
import { motion } from "framer-motion";
import { PLACES } from "../data/seed";
import { useApp } from "../state/AppState";
import { ScreenHeading } from "../components/ScreenHeading";
import { WeatherIcon } from "../components/WeatherIcon";
import { CONDITION_LABEL, RADIUS, WARNING_COLOR } from "../design/tokens";
import { springCard } from "../animations/variants";
import { timeOfDayFor } from "../lib/time";

/**
 * MapLibre is ~800 kB of the bundle on its own. Splitting it out keeps the
 * homepage's first load small, which is the whole point of this project — the
 * map only downloads when someone actually opens Places.
 */
const LocationMap = lazy(() =>
  import("../components/LocationMap").then((m) => ({ default: m.LocationMap })),
);

export function PlacesScreen() {
  const { place, selectPlace } = useApp();

  return (
    <>
      <ScreenHeading
        title="Places"
        blurb="Current location plus saved favourites. Each row shows that city's own local sky, derived from its sunrise — not yours."
      />

      <Suspense fallback={<MapSkeleton />}>
        <LocationMap places={PLACES} activeId={place.id} onSelect={selectPlace} />
      </Suspense>

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
                  {CONDITION_LABEL[p.condition]} · {timeOfDayFor(p)} · {p.station}
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
                  {p.alert.level} · {p.alert.kind.replace("-", " ")}
                </span>
              ) : (
                <span
                  className="chip-on rounded-[5px] px-1.5 py-0.5 font-mono text-[8.5px] font-bold uppercase tracking-[0.06em]"
                  style={{ color: "var(--txt-2)" }}
                >
                  No warning
                </span>
              )}
            </span>
          </motion.button>
        ))}
      </div>
    </>
  );
}

function MapSkeleton() {
  return (
    <div
      className="skeleton mx-4 mb-3 h-[188px] rounded-[20px] lg:mx-0 lg:mb-5 lg:h-[340px]"
      role="status"
      aria-label="Loading map"
    />
  );
}
