import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Condition, TimeOfDay } from "../design/tokens";
import type { PersonaId, Place } from "../data/types";
import { PLACES, PLACE_BY_ID } from "../data/seed";
import { scoreCards, setPlaceUniverse, type ScoredCard } from "../personalization/rules";
import { timeOfDayFor } from "../lib/time";
import { useLiveAqi, type LiveAqi } from "../lib/useLiveAqi";
import { useLiveWarnings, type LiveWarnings } from "../lib/useLiveWarnings";

setPlaceUniverse(PLACES);

export type TabId = "home" | "alerts" | "places" | "you";

interface AppState {
  personas: PersonaId[];
  placeId: string;
  /** Design-review overrides. null = derived from the location, which is the shipped behaviour. */
  condOverride: Condition | null;
  todOverride: TimeOfDay | null;
  offline: boolean;
  /** Low-end GPU fallback: drop backdrop-filter, raise fill opacity. */
  flatGlass: boolean;
  arrange: boolean;
  manualOrder: PersonaId[];
  tab: TabId;
  loading: boolean;
  /** Minutes since the last successful fetch. */
  dataAgeMinutes: number;
}

interface AppActions {
  togglePersona: (id: PersonaId) => void;
  selectPlace: (id: string) => void;
  setCondOverride: (c: Condition | null) => void;
  setTodOverride: (t: TimeOfDay | null) => void;
  setOffline: (v: boolean) => void;
  setFlatGlass: (v: boolean) => void;
  setArrange: (v: boolean) => void;
  moveCard: (id: PersonaId, dir: "up" | "down") => void;
  setTab: (t: TabId) => void;
  refresh: () => Promise<void>;
}

interface Derived {
  place: Place;
  /**
   * Every saved place with whatever live data has arrived folded in. Screens
   * read this, never the raw seed array — otherwise the Warnings tab and the
   * side rail would disagree with the homepage about what is happening.
   */
  places: Place[];
  /** Non-null once CPCB answers for this city; null on the seeded floor. */
  liveAqi: LiveAqi | null;
  /** Non-null once the CAP feed answers; null on the seeded floor. */
  liveWarnings: LiveWarnings | null;
  condition: Condition;
  timeOfDay: TimeOfDay;
  isDerivedSky: boolean;
  cards: ScoredCard[];
}

const Ctx = createContext<(AppState & AppActions & Derived) | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    personas: ["health", "commute"],
    placeId: "mumbai",
    condOverride: null,
    todOverride: null,
    offline: false,
    flatGlass: false,
    arrange: false,
    manualOrder: [],
    tab: "home",
    loading: false,
    dataAgeMinutes: 4,
  });

  const loadTimer = useRef<number | null>(null);
  useEffect(() => () => {
    if (loadTimer.current) window.clearTimeout(loadTimer.current);
  }, []);

  /** Single owner of the loading flag — two competing timers is one too many. */
  const scheduleLoaded = useCallback((ms = 430) => {
    if (loadTimer.current) window.clearTimeout(loadTimer.current);
    loadTimer.current = window.setTimeout(() => {
      loadTimer.current = null;
      setState((s) => (s.loading ? { ...s, loading: false } : s));
    }, ms);
  }, []);

  /**
   * Persona and location changes re-fetch in the real app, so they show the
   * skeleton state here too. CLAUDE.md: never spinner-only, never blank.
   */
  const withReload = useCallback(
    (next: Partial<AppState>, ms = 430) => {
      setState((s) => ({ ...s, ...next, loading: true }));
      scheduleLoaded(ms);
    },
    [scheduleLoaded],
  );

  const actions = useMemo<AppActions>(
    () => ({
      togglePersona: (id) => {
        scheduleLoaded();
        setState((s) => {
          const has = s.personas.includes(id);
          if (!has && s.personas.length >= 3) return s;
          const personas = has ? s.personas.filter((p) => p !== id) : [...s.personas, id];
          return { ...s, personas, manualOrder: [], loading: true };
        });
      },

      selectPlace: (id) => withReload({ placeId: id, condOverride: null, todOverride: null, tab: "home" }),
      setCondOverride: (c) => setState((s) => ({ ...s, condOverride: c })),
      setTodOverride: (t) => setState((s) => ({ ...s, todOverride: t })),
      setOffline: (v) => setState((s) => ({ ...s, offline: v, dataAgeMinutes: v ? 134 : 4 })),
      setFlatGlass: (v) => setState((s) => ({ ...s, flatGlass: v })),

      setArrange: (v) =>
        setState((s) => ({
          ...s,
          arrange: v,
          manualOrder:
            v && !s.manualOrder.length
              ? scoreCards(PLACE_BY_ID[s.placeId], s.personas).map((c) => c.id)
              : s.manualOrder,
        })),

      moveCard: (id, dir) =>
        setState((s) => {
          const order = s.manualOrder.length
            ? [...s.manualOrder]
            : scoreCards(PLACE_BY_ID[s.placeId], s.personas).map((c) => c.id);
          const i = order.indexOf(id);
          const j = dir === "up" ? i - 1 : i + 1;
          if (i < 0 || j < 0 || j >= order.length) return s;
          [order[i], order[j]] = [order[j], order[i]];
          return { ...s, manualOrder: order };
        }),

      setTab: (t) => setState((s) => ({ ...s, tab: t })),

      refresh: async () => {
        setState((s) => ({ ...s, loading: true }));
        await new Promise((r) => setTimeout(r, 420));
        setState((s) => ({ ...s, loading: false, offline: false, dataAgeMinutes: 0 }));
      },
    }),
    [withReload, scheduleLoaded],
  );

  /**
   * The one live feed wired today. CPCB needs no IP whitelisting, so it works
   * from any host — CLAUDE.md's "fast path". It arrives through /api/aqi so the
   * key stays server-side.
   *
   * Merged into the place rather than displayed beside it, deliberately: the
   * scoring rules, the advisories and the cards then all read the real number
   * with no further wiring, and the seeded value stays the floor for the
   * moment before it lands (and forever, if data.gov.in is down mid-demo).
   */
  const seedPlace = PLACE_BY_ID[state.placeId];
  const liveAqi = useLiveAqi(seedPlace.name);

  /**
   * Live severe-weather warnings, from NDMA's public CAP feed.
   *
   * IMD's own APIs need the calling server's IP whitelisted, which is a
   * procurement timeline. NDMA republishes the same IMD/SDMA/CWC bulletins
   * with no key, so the app's headline feature runs on real warnings while the
   * forecast numbers stay seeded. Each alert keeps its issuing office, so
   * nothing is passed off as ours.
   */
  const liveWarnings = useLiveWarnings();

  /**
   * One merge, at the place level, so everything downstream lights up without
   * further wiring: the banner, the Warnings tab, the side-rail dots, the
   * advisories, the travel card's boost and the tab-bar badge all read `alert`
   * off a place and neither know nor care where it came from.
   */
  const places = useMemo<Place[]>(
    () =>
      PLACES.map((p) => {
        const alert = liveWarnings?.alerts[p.id];
        return alert ? { ...p, alert } : p;
      }),
    [liveWarnings],
  );

  // The travel card scores against the other saved places, so it has to see
  // the merged set or it will count seeded warnings that are no longer there.
  useEffect(() => setPlaceUniverse(places), [places]);

  const derived = useMemo<Derived>(() => {
    const merged = places.find((p) => p.id === state.placeId) ?? seedPlace;
    const place: Place = liveAqi
      ? { ...merged, aqi: liveAqi.aqi, aqiCategory: liveAqi.category }
      : merged;
    return {
      place,
      places,
      liveAqi,
      liveWarnings,
      condition: state.condOverride ?? place.condition,
      timeOfDay: state.todOverride ?? timeOfDayFor(place),
      isDerivedSky: state.condOverride === null && state.todOverride === null,
      cards: scoreCards(place, state.personas, state.manualOrder),
    };
  }, [
    places,
    seedPlace,
    liveAqi,
    liveWarnings,
    state.placeId,
    state.condOverride,
    state.todOverride,
    state.personas,
    state.manualOrder,
  ]);

  const value = useMemo(() => ({ ...state, ...actions, ...derived }), [state, actions, derived]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside <AppProvider>");
  return v;
}
