import { useApp } from "../state/AppState";
import { relativeAge } from "../lib/time";

/**
 * The app's identity line.
 *
 * Deliberately quiet: it sits above the pinned warning banner, so it must read
 * as chrome, not as a competing headline. Weight and size do the work — the
 * wordmark is 20/600 against the 74/250 temperature and the saturated warning
 * fill below it, so it never wins the eye on a severe-weather day.
 */
export function BrandHeader() {
  const { offline, dataAgeMinutes } = useApp();

  return (
    <header className="sky-txt flex items-center gap-3 px-6 pb-1 pt-1">
      <MausamMark />
      <div className="flex min-w-0 flex-1 items-baseline gap-2">
        <h1
          className="font-ui text-[20px] font-semibold leading-none tracking-[-0.028em]">
          Mausam
        </h1>
        <span className="instrument on-sky shrink-0 leading-none">IMD</span>
      </div>

      <span
        className="instrument on-sky flex shrink-0 items-center gap-1.5 leading-none"
        aria-live="polite"
      >
        {offline ? (
          <span className="inline-block h-[6px] w-[6px] rounded-full bg-[#FFB466]" aria-hidden />
        ) : null}
        {offline ? "Offline" : relativeAge(dataAgeMinutes)}
      </span>
    </header>
  );
}

/**
 * The mark: a sun disc half-occluded by a cloud edge, drawn on the same grid as
 * the weather glyphs so it sits in the same family as the rest of the iconography.
 */
function MausamMark() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="none" aria-hidden="true" className="shrink-0">
      <circle cx="12" cy="10" r="5.4" stroke="currentColor" strokeWidth="1.7" opacity=".55" />
      <path
        d="M6.6 17.4a3.4 3.4 0 0 1 .6-6.75 4.7 4.7 0 0 1 8.85 1.05 3.1 3.1 0 0 1-.45 5.7H6.6Z"
        fill="currentColor"
        opacity=".92"
      />
      <path
        d="M8.8 19.8v1.6M12 19.8v2.2M15.2 19.8v1.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity=".6"
      />
    </svg>
  );
}
