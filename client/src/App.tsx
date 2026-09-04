import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "./state/AppState";
import { skyCssVars } from "./design/tokens";
import { PLACES } from "./data/seed";
import { SkyBackground } from "./components/SkyBackground";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { PerfOverlay } from "./components/PerfOverlay";
import { PullToRefresh } from "./components/PullToRefresh";
import { TabBar } from "./components/TabBar";
import { SideNav } from "./components/SideNav";
import { DetailSheet, type SheetTarget } from "./components/DetailSheet";
import { HomeScreen } from "./screens/HomeScreen";
import { AlertsScreen } from "./screens/AlertsScreen";
import { PlacesScreen } from "./screens/PlacesScreen";
import { YouScreen } from "./screens/YouScreen";
import { screenVariants } from "./animations/variants";

/**
 * One codebase, two shapes.
 *
 * Below `lg` this is the phone app: 430px column, bottom tab bar, single-column
 * card stack. From `lg` up it becomes a full-width site — vertical nav rail,
 * wide hero, multi-column card grid — because the demo runs on a laptop and a
 * phone-shaped strip floating in the middle of a 15" screen reads as a mockup
 * rather than a product.
 *
 * The sky, the glass tokens and the contrast audit are shape-independent, so
 * nothing about the design system forks between the two.
 */
/** Matches sheetVariants.exit; the unmount is timed, not callback-driven. */
const SHEET_EXIT_MS = 210;

export default function App() {
  const { tab, condition, timeOfDay, flatGlass, place, refresh } = useApp();
  const [sheet, setSheet] = useState<SheetTarget | null>(null);

  /**
   * The sheet is mounted and unmounted directly, with no AnimatePresence.
   *
   * A full-screen overlay that will not close reads as a frozen app, and
   * AnimatePresence holds an exiting child until its exit animation reports
   * completion — which does not happen on a paused rAF or a backgrounded tab,
   * leaving an undismissable modal. The opening morph still works (layoutId
   * matches the card, which is mounted at that moment); only the closing morph
   * is given up, and a sheet that always closes is worth more than one that
   * shrinks prettily most of the time.
   */
  /**
   * Closing plays the exit for a fixed beat, then unmounts on a timer. The
   * unmount never waits on an animation callback — that is what left a
   * full-screen sheet undismissable earlier in this project.
   */
  const [closing, setClosing] = useState(false);
  const closeSheet = useCallback(() => setClosing(true), []);

  useEffect(() => {
    if (!closing) return;
    const t = window.setTimeout(() => {
      setSheet(null);
      setClosing(false);
    }, SHEET_EXIT_MS);
    return () => window.clearTimeout(t);
  }, [closing]);

  // Close the detail sheet whenever the thing behind it changes underneath.
  useEffect(() => setSheet(null), [tab, place.id]);

  const vars = skyCssVars(condition, timeOfDay, flatGlass) as React.CSSProperties;

  const showPerf =
    typeof window !== "undefined" && new URLSearchParams(window.location.search).has("perf");

  return (
    <div className="flex h-full justify-center bg-[#05080d]">
      {showPerf ? <PerfOverlay /> : null}
      <main
        className="relative h-full w-full max-w-[430px] overflow-hidden lg:max-w-none"
        style={vars}
        data-condition={condition}
        data-time-of-day={timeOfDay}
      >
        {/* If the sky ever fails to build, the app keeps a legible ground
            rather than falling through to a blank page. */}
        <ErrorBoundary
          label="sky background"
          fallback={
            <div
              className="absolute inset-0 z-0"
              style={{ background: "linear-gradient(180deg,#273044 0%,#414A63 55%,#60647A 100%)" }}
              aria-hidden="true"
            />
          }
        >
          <SkyBackground condition={condition} timeOfDay={timeOfDay} covered={sheet !== null} />
        </ErrorBoundary>

        <div className="relative z-[4] mx-auto flex h-full lg:max-w-[1560px]">
          <SideNav />

          <div className="min-w-0 flex-1">
            <PullToRefresh onRefresh={refresh}>
              <div className="pb-28 pt-3 lg:px-5 lg:pb-14 lg:pt-7">
                {/* Enter-only, keyed on the tab. A single-child AnimatePresence
                    swap did not reliably unmount the outgoing screen here, and a
                    screen that never leaves is worse than one that does not fade
                    out, so the outgoing screen is dropped on the same frame. */}
                <motion.div
                  key={tab}
                  variants={screenVariants}
                  initial="initial"
                  animate="animate"
                >
                  <ErrorBoundary
                    label={`${tab} screen`}
                    fallback={
                      <div className="px-6 py-10" style={{ color: "var(--hero-txt)" }}>
                        <h2 className="text-[22px] font-medium tracking-[-0.02em]">
                          This view could not be drawn
                        </h2>
                        <p className="mt-2 max-w-[52ch] text-[13.5px]" style={{ color: "var(--hero-txt-2)" }}>
                          Your other places and warnings are still available from the navigation.
                          The details are in the browser console.
                        </p>
                      </div>
                    }
                  >
                    {tab === "home" ? <HomeScreen onOpen={setSheet} /> : null}
                    {tab === "alerts" ? <AlertsScreen onOpen={setSheet} /> : null}
                    {tab === "places" ? <PlacesScreen /> : null}
                    {tab === "you" ? <YouScreen /> : null}
                  </ErrorBoundary>
                </motion.div>
              </div>
            </PullToRefresh>
          </div>
        </div>

        <TabBar />

        {sheet ? (
          <DetailSheet
            key={`${sheet.kind}-${sheet.kind === "card" ? sheet.id : sheet.placeId}`}
            target={sheet}
            place={place}
            places={PLACES}
            onClose={closeSheet}
            closing={closing}
          />
        ) : null}
      </main>
    </div>
  );
}
