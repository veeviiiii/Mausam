# Language — English and हिन्दी

## What is translated

Every string a user can reach by tapping around the four tabs, the warning
sheet and the radar. 317 keys, both languages in step, enforced at build time.

That includes the parts most i18n retrofits skip:

- **CAP warning text.** The headline and body of every seeded IMD warning.
- **The "why this card" sentence.** Assembled from translated fragments rather
  than one template, because the numbers render as chips and because Hindi does
  not put the clauses where English does. The urgency thresholds live in
  `personalization/rules.ts` as `reasonKey` + readings; only the wording moves.
- **The advisories.** Both the instruction and the reading that fired it.

## The one deliberate exception

The "Where this comes from" provenance paragraph on each persona detail stays in
English in both languages. These are three-sentence technical notes quoting IMD
endpoint names and cache policy — a machine-flavoured Hindi rendering of
"cached until the next issue rather than on a clock" would read worse than the
original.

This is **stated on screen**, under the paragraph, in Hindi. It is a decision a
reader can see, not a gap they discover.

## Drift is a build failure, not a runtime surprise

`npm run check` fails if:

1. A key exists in one dictionary and not the other.
2. Source calls `t("some.key")` with a literal that no dictionary defines.
   (Template keys like `` t(`cond.${c}`) `` are skipped — this catches typos,
   not coverage.)
3. The English copy of a CAP warning in the dictionary stops matching
   `data/seed.ts`. The dictionary has to carry an English copy so the two
   languages stay key-for-key, and a copy is a drift risk, so it is **diffed
   rather than trusted**: reword a bulletin in `seed.ts` and the build fails
   until the Hindi beside it is updated too.

At runtime a missing key falls back to English rather than rendering the key —
a half-translated screen is bad, a screen full of `home.humidity` is worse.

## Fonts

Google Sans Flex has no Devanagari coverage, so Hindi would otherwise fall
through to whatever the device happens to have. `Noto Sans Devanagari` is added
to the stack after it (OFL, Google Fonts). Google Fonts subsets by
`unicode-range`, so an English session downloads the stylesheet and **none of
the font bytes**.

`<html lang>` is kept in sync with the choice — screen readers and font fallback
both key off it.

## "Other languages"

India's other scheduled languages are not bundled, and the interesting question
is what the UI does about that. Hiding them pretends the problem away; listing
them as if they were installed is a lie the first tap exposes.

So they are listed with real sizes, and **Download runs real state** — a
determinate progress bar driven off the wall clock, a disabled button while it
runs, then a plain statement that this build ships two languages and the pack
mechanism is being shown rather than faked.

Every control is wired to state that actually changes. CLAUDE.md's rule is no
dead UI, not no incomplete features.

> Progress is read from `performance.now()`, not accumulated per tick. A
> tick-counting bar looks identical until the tab is backgrounded, at which
> point the browser clamps the interval and a 900 ms bar takes half a minute.
> Found by measurement, not by reasoning — it happened in the test harness.

## No language detection

`navigator.language` is deliberately ignored. A user in India with an en-IN
device is not asking for Hindi, and a silent switch on first launch is the kind
of surprise this app is trying to design away. The choice is explicit and
remembered in `localStorage` per device.

## Fast Refresh note

`i18n/context.ts` holds the context and hooks; `i18n/LanguageProvider.tsx`
exports only the component. React Fast Refresh can only hot-swap a module that
exports components and nothing else — with `useT` beside the provider, editing
the provider made Vite invalidate the module rather than refresh it, the new
module got a new context object while mounted consumers held the old one, and
every `useT()` in the tree threw. One extra file, and editing the provider is a
normal edit again.
