import type { TabId } from "../state/AppState";

/**
 * The four sections, shared by the mobile tab bar and the desktop side rail so
 * the two navigations can never drift apart.
 */
export const NAV_ITEMS: { id: TabId; label: string; icon: JSX.Element }[] = [
  {
    id: "home",
    label: "Home",
    icon: (
      <path
        d="M3.6 10.6 12 4l8.4 6.6V19a1.6 1.6 0 0 1-1.6 1.6H5.2A1.6 1.6 0 0 1 3.6 19v-8.4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    ),
  },
  {
    id: "alerts",
    label: "Warnings",
    icon: (
      <>
        <path d="M12 4.2 21.4 20H2.6L12 4.2Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M12 10v4.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        <circle cx="12" cy="17.1" r="1.1" fill="currentColor" />
      </>
    ),
  },
  {
    id: "places",
    label: "Places",
    icon: (
      <>
        <path
          d="M12 2.8c3.6 0 6.6 3 6.6 6.6 0 4.8-6.6 11.8-6.6 11.8S5.4 14.2 5.4 9.4c0-3.6 3-6.6 6.6-6.6Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="9.4" r="2.4" stroke="currentColor" strokeWidth="1.7" />
      </>
    ),
  },
  {
    id: "you",
    label: "You",
    icon: (
      <>
        <circle cx="12" cy="8.4" r="3.8" stroke="currentColor" strokeWidth="1.7" />
        <path d="M4.4 20.4c0-4 3.4-7 7.6-7s7.6 3 7.6 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </>
    ),
  },
];

export function NavIcon({ icon, size = 21 }: { icon: JSX.Element; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true">
      {icon}
    </svg>
  );
}
