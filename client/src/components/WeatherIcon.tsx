import type { Condition } from "../design/tokens";

/**
 * Animated weather glyphs. CLAUDE.md rules out static icons, so each one
 * carries its own motion: the sun breathes, clouds drift against each other,
 * rain falls on staggered delays, the bolt flickers. All CSS keyframes (see
 * index.css) so they cost nothing on the main thread.
 */

interface Props {
  condition: Condition;
  size?: number;
  className?: string;
  title?: string;
}

export function WeatherIcon({ condition, size = 24, className = "", title }: Props) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      className={className}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      {GLYPH[condition]}
    </svg>
  );
}

const GLYPH: Record<Condition, JSX.Element> = {
  clear: (
    <g className="sunpulse">
      <circle cx="24" cy="24" r="9" fill="#FFD466" />
      <g stroke="#FFD466" strokeWidth="2.6" strokeLinecap="round">
        <path d="M24 5v5" />
        <path d="M24 38v5" />
        <path d="M5 24h5" />
        <path d="M38 24h5" />
        <path d="M10.6 10.6l3.5 3.5" />
        <path d="M33.9 33.9l3.5 3.5" />
        <path d="M37.4 10.6l-3.5 3.5" />
        <path d="M14.1 33.9l-3.5 3.5" />
      </g>
    </g>
  ),
  partly: (
    <>
      <circle cx="18" cy="17" r="7.5" fill="#FFD466" />
      <g className="drift">
        <path
          d="M14 34a7 7 0 0 1 1-13.9 9.5 9.5 0 0 1 18 2.2A6.4 6.4 0 0 1 32 34H14Z"
          fill="#EEF4FA"
        />
      </g>
    </>
  ),
  overcast: (
    <>
      <g className="drift2">
        <path
          d="M10 26a6 6 0 0 1 6-6 8 8 0 0 1 15 1.4A5.4 5.4 0 0 1 30 32H16a6 6 0 0 1-6-6Z"
          fill="#C6CFD8"
        />
      </g>
      <g className="drift">
        <path
          d="M16 36a6.4 6.4 0 0 1 1-12.7 8.7 8.7 0 0 1 16.4 2A5.8 5.8 0 0 1 32.5 36H16Z"
          fill="#EEF4FA"
        />
      </g>
    </>
  ),
  rain: (
    <>
      <g className="drift">
        <path
          d="M14 28a6.4 6.4 0 0 1 1-12.7 8.7 8.7 0 0 1 16.4 2A5.8 5.8 0 0 1 30.5 28H14Z"
          fill="#DDE6EF"
        />
      </g>
      <g stroke="#7FC4E8" strokeWidth="2.6" strokeLinecap="round">
        <path d="M17 33v5" className="rd1" />
        <path d="M24 33v6" className="rd2" />
        <path d="M31 33v5" className="rd3" />
      </g>
    </>
  ),
  thunderstorm: (
    <>
      <g className="drift">
        <path
          d="M13 26a6.4 6.4 0 0 1 1-12.7 8.7 8.7 0 0 1 16.4 2A5.8 5.8 0 0 1 29.5 26H13Z"
          fill="#C9D3DE"
        />
      </g>
      <path className="bolt" d="M25 27l-8 10h6l-2 8 9-11h-6l3-7h-2Z" fill="#FFD466" />
      <g stroke="#8FB0CC" strokeWidth="2.4" strokeLinecap="round">
        <path d="M16 30v4" className="rd2" />
        <path d="M33 30v4" className="rd3" />
      </g>
    </>
  ),
  fog: (
    <>
      <g className="drift">
        <path
          d="M14 24a6.4 6.4 0 0 1 1-12.7 8.7 8.7 0 0 1 16.4 2A5.8 5.8 0 0 1 30.5 24H14Z"
          fill="#D8DDE3"
          opacity=".8"
        />
      </g>
      <g stroke="#E3E8ED" strokeWidth="2.8" strokeLinecap="round">
        <path d="M11 30h26" className="fg1" />
        <path d="M14 36h22" className="fg2" />
        <path d="M12 42h20" className="fg3" />
      </g>
    </>
  ),
  snow: (
    <>
      <g className="drift">
        <path
          d="M14 26a6.4 6.4 0 0 1 1-12.7 8.7 8.7 0 0 1 16.4 2A5.8 5.8 0 0 1 30.5 26H14Z"
          fill="#E6EDF5"
        />
      </g>
      <g fill="#FFFFFF" className="drift2">
        <circle cx="17" cy="33" r="2.4" />
        <circle cx="25" cy="38" r="2.4" />
        <circle cx="32" cy="32" r="2.4" />
      </g>
    </>
  ),
};
