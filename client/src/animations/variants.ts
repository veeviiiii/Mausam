import type { Transition, Variants } from "framer-motion";
import { SPRINGS, TIMING } from "../design/tokens";

/**
 * Every motion value in the app resolves back to design/tokens.ts. Nothing here
 * invents a duration, a stiffness or an easing curve — this file only decides
 * which named spring a given gesture gets.
 */

export const springCard = SPRINGS.card as Transition;
export const springReorder = SPRINGS.reorder as Transition;
export const springSheet = SPRINGS.sheet as Transition;
export const springRefresh = SPRINGS.refresh as Transition;
export const springHeading = SPRINGS.heading as Transition;

export const fade = { ...TIMING.fade } as Transition;
export const skyFade = { ...TIMING.skyFade } as Transition;
export const disclose = { ...TIMING.disclose } as Transition;

/**
 * Card enter / exit / layout.
 *
 * Exit matters as much as enter: a card leaving the stack because you dropped a
 * persona should read as *leaving*, not as having never been there. It scales
 * down and lifts slightly, so the gap it leaves is legible before the layout
 * spring closes it.
 */
export const cardVariants: Variants = {
  initial: { opacity: 0, y: 18, scale: 0.955 },
  animate: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ...springCard, delay: i * TIMING.stagger },
  }),
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.93,
    transition: { ...springCard, opacity: fade },
  },
};

/** The pinned severe-weather banner. Enters faster — it is the priority item. */
export const alertVariants: Variants = {
  initial: { opacity: 0, y: -12, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: springReorder },
  exit: { opacity: 0, y: -8, scale: 0.97, transition: fade },
};

/**
 * City name roll. The outgoing name rises out and the incoming one comes up
 * from below, so a location change reads as a change of place rather than a
 * text swap.
 */
export const cityRollVariants: Variants = {
  initial: { y: "70%", opacity: 0 },
  animate: { y: "0%", opacity: 1, transition: springHeading },
  exit: { y: "-70%", opacity: 0, transition: { ...springHeading, opacity: fade } },
};

/** Screen-level tab switch. */
export const screenVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: springCard },
  exit: { opacity: 0, y: -6, transition: fade },
};

export const skeletonStagger = TIMING.stagger;

/**
 * Detail sheet enter/exit.
 *
 * Transform and opacity only — no width/height/position, so nothing is
 * scaled and no glyph is ever stretched mid-flight. A shared-element morph
 * looked clever in a still frame but distorted the type on the way in and
 * needed a layout projection pass every frame to do it.
 *
 * The scale barely moves (0.985 -> 1). It reads as the surface settling
 * rather than as a zoom, which is what keeps it feeling liquid instead of
 * bouncy.
 */
export const sheetVariants: Variants = {
  initial: { opacity: 0, y: 22, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1, transition: SPRINGS.sheet as Transition },
  exit: {
    opacity: 0,
    y: 14,
    scale: 0.99,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
  },
};

/** Dim behind the sheet; separate so it can fade faster than the panel moves. */
export const scrimVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, transition: { duration: 0.16, ease: [0.4, 0, 1, 1] } },
};

/**
 * The disclosure row animates `grid-template-rows` between fr units, which
 * Framer cannot interpolate — CSS can. Same token, expressed as a CSS timing
 * function so there is still only one place the number lives.
 */
export const discloseCss = `${TIMING.disclose.duration}s cubic-bezier(${TIMING.disclose.ease.join(",")})`;
