# Mausam — Presentation Brief (SIH26076)

**For the team building the pitch deck.** Everything here is verified against
the actual code as of commit `5100bae`. You do not need to check anything in
this document with the developer.

---

## THE ONE RULE

> **If a feature is not in the "Approved claims" list below, do not put it on a
> slide.** There is a "Do not claim" list too. Anything not on either list —
> ask before writing it.

This matters more than it sounds. A judge can open the app on a laptop and tap
around for thirty seconds. Every claim on our slides has to survive that.

An earlier draft of the deck listed five features that don't exist (fixed
header, in-app search, persistent favourites, offline-first caching, real-time
condition sync). Any of those would have been disproved live, and once a judge
catches one invented claim they stop trusting the true ones — which is the real
cost, because the true ones are strong.

---

## 1. What the project is — copy-paste descriptions

**One line**

> A personalised home screen for IMD's Mausam weather app that reorders itself
> around what each user actually needs, and shows its working for every card.

**One paragraph**

> Mausam shows every user the same generic homepage. We rebuilt it so the
> homepage reorders itself around one to three "personas" a user picks — a
> commuter, a farmer, a parent, someone with asthma. Every card explains in one
> plain sentence why it is where it is, because the ranking is a small,
> readable rule, not a model. Severe weather warnings always sit above
> everything, and every reading on screen is labelled with where it came from,
> so a live government figure and demo data can never be mistaken for each
> other.

**The differentiator, in one sentence** (use this if you only get one)

> Every number in the app says where it came from — and the ones that are live
> come from CPCB and NDMA directly, not from a third-party weather API.

---

## 2. How it maps to the problem statement

SIH26076 (Ministry of Earth Sciences) asks for a **personalised homepage** for
Mausam. The requirements and what we built:

| Asked for | Status |
|---|---|
| Homepage reflows around user personas | ✅ Built — 8 personas, pick 1–3 |
| Cards are independent and reorderable | ✅ Built — score-ranked, plus manual drag order |
| Multi-location support | ✅ Built — 6 cities, each with its own local sky and time |
| Severe alerts always surface at the top | ✅ Built — pinned above all persona cards |
| Rule-based, explainable personalisation (no black box) | ✅ Built — every card states its own score maths |
| Offline: last-known data with "updated X ago", never blank | ⚠️ **Partial** — see "Do not claim" |
| Dramatically lighter than the current app | ✅ 130 kB gzipped first load |

---

## 3. APPROVED CLAIMS — safe to put on a slide

Wording is slide-ready. Trim it, don't embellish it.

### Personalisation (this is the headline — lead with it)

- **Eight personas, pick one to three.** Health-conscious, outdoor fitness,
  beach & surf, travellers, parents & families, farmers & gardeners, commuters,
  event planners.
- **The homepage re-ranks instantly** when personas change. No save button.
- **Every card explains its own position** in one sentence, for example:
  *"Health-conscious is persona 1 of 2, worth 100. In Mumbai right now, AQI is
  119, above the 100 watch line — that adds +18, for 118."*
- **The ranking is arithmetic, not a model** — a base score from the order you
  picked the persona, plus an urgency boost when a reading crosses a stated
  threshold. A judge can audit it.
- **Cards can be reordered by hand**, and a manual order overrides the score.
- **A hidden card explains why it's hidden** — the beach card disappears
  inland, with a sentence saying there is no tide station in range.

### Live data

- **Live severe weather warnings** from NDMA's public CAP feed, carrying the
  bulletins IMD, the state disaster authorities and the Central Water
  Commission actually issue.
- **Each warning is credited to the body that issued it** — "IMD New Delhi",
  "Maharashtra SDMA" — never generically to IMD.
- **Expired warnings are filtered out.** The feed keeps recently-lapsed alerts;
  we drop anything past its validity, cancelled, or not marked actual.
- **Live air quality from CPCB** via data.gov.in.
- **We compute India's AQI ourselves.** The government feed publishes
  per-pollutant concentrations, not an index — the server computes CPCB's own
  sub-indices and takes the maximum, which is the definition of the Indian AQI.
- **The air card names its source** — the reporting station, the pollutant that
  produced the number, and CPCB's own publish timestamp.
- **Live radar** with three layers: rainfall (RainViewer), wind (OpenWeather),
  and air quality across 156 Indian cities (Open-Meteo).
- **Radar labels thin out with zoom** — capitals and metros at country zoom,
  then large cities, then everything — so the map never becomes unreadable.

### Honesty and trust (this is genuinely unusual — use it)

- **Every reading is badged LIVE or SEEDED.** Demo data is never presented as
  measurement.
- **Every piece of advice shows the reading that triggered it**, and where that
  reading came from.
- **We removed a feature rather than fake it.** A swim advisory ("swell is
  2.3 m, above the advisory line") was cut because no marine data source exists
  in the build — a safety instruction with nothing behind it is worse than no
  instruction.
- **We corrected a threshold to match IMD's real definition.** Our fog rule
  cited a "3 km fog line"; IMD's fog classification tops out at 1 km. The rule
  below 1 km now cites IMD's real band, and the 1–3 km rule says on screen that
  it is our own driving caution, not a fog warning.

### Accessibility and design

- **Contrast is measured, not eyeballed.** All 28 weather × time-of-day
  background combinations are checked against WCAG AA at build time. The build
  fails if any drops below.
- **Full English and हिन्दी**, applied instantly and remembered per device.
- **Language coverage is enforced by the build** — 342 keys must exist in both,
  and any text in the code without a translation fails the build.
- **Hindi ships with its own font** (Noto Sans Devanagari), downloaded only when
  Hindi is actually used.
- **A low-end-device mode** that drops expensive blur effects while holding
  contrast.

### Engineering

- **First load is 130 kB gzipped.** The map (218 kB) downloads only when the
  Places screen is opened.
- **Four runtime dependencies total.** The two server routes have zero.
- **The API key never reaches the browser** — CPCB is called server-side only,
  verified absent from the built bundle.
- **Never a blank screen.** A complete demo dataset renders the full app even
  with every upstream source down.
- **Tested against a real outage.** data.gov.in returned errors mid-development;
  the app degraded to seeded data with a visible label instead of breaking.

---

## 4. DO NOT CLAIM — and what to say instead

These are the failure modes. Each one is disprovable in seconds.

| ❌ Do not write | Why | ✅ Say instead |
|---|---|---|
| "Offline-first" / "works offline" / "offline caching" | There is no service worker. Reloading without a connection fails completely. | "Renders a complete last-known state without a working backend" |
| "Persistent favourites" / "save your locations" | There is no favourites feature. Six cities are hardcoded; you cannot add or remove any. | "Six saved cities, each with its own local sky and time of day" |
| "Search" / "search your city" | There is no search box anywhere in the app. | Don't mention search. |
| "Fixed / sticky header" | The header scrolls with the page. | "Navigation is always reachable" (the tab bar *is* fixed) |
| "Real-time weather icons" / "syncs with current conditions" | Icons match the *seeded* condition. Nothing about them is live. | "Animated weather icons per condition — rain falls, clouds drift" |
| "Live forecast" / "live temperature" / "live humidity" | Only air quality and warnings are live. Temperature, humidity, wind, visibility, rainfall and tides are demo data. | "Live air quality and live severe warnings; forecast values are demo data pending IMD access" |
| "PWA" / "installable app" | No manifest, no service worker. | "Mobile-first web app, one codebase for phone and desktop" |
| "Uses IMD's APIs" | IMD's APIs are IP-whitelisted and return 401. We have never called them. | "Uses NDMA's public feed, which carries IMD's own bulletins" |
| "Tested" / "test suite" / "unit tests" | There is no test framework. | "Automated build-time verification of contrast, translations and data provenance" |
| "AI-powered" / "ML personalisation" | Deliberately rule-based. The problem statement forbids a black box. | "Rule-based and explainable by design" |
| Any user count, accuracy %, speed-up % | No such measurement exists. | Quote only the numbers in section 7. |

**If someone wants to keep "offline-first" and "persistent favourites" on the
deck, tell the developer.** Both are buildable — favourites in about an hour, a
service worker in about two. It is a decision, not a lie to be papered over.

---

## 5. Tech stack — slide-ready

**Frontend**
React 18 · TypeScript · Vite · Tailwind CSS · Framer Motion (animation) ·
MapLibre GL (maps)

**Backend**
Two serverless functions on Vercel. Plain Node, **no framework and no
dependencies**. One proxies CPCB air quality and computes the Indian AQI; one
fetches and parses NDMA's CAP warning feed.

**Data sources**
CPCB (via data.gov.in) · NDMA Sachet CAP feed · Open-Meteo · RainViewer ·
OpenWeather · OpenFreeMap

**Deployment**
GitHub → Vercel

**If a slide asks "why no Express / no database?"** — the whole backend is two
HTTP handlers. A framework and a database would be weight with nothing to carry.
Caching is in-memory with TTLs matched to how often each source actually
publishes.

**Do not list** on the stack slide: Express, MongoDB, PostgreSQL, SQLite,
Redis, TanStack Query, Redux, React Router, Next.js, Firebase. **None are used.**

---

## 6. Architecture — for the data-flow diagram

Redraw this; don't copy the ASCII.

```
        BROWSER                      OUR SERVER              GOVERNMENT / OPEN DATA
  ┌──────────────────┐        ┌────────────────────┐      ┌──────────────────────┐
  │ React app        │        │ /api/aqi           │      │ CPCB via data.gov.in │
  │                  │ ─────► │  computes Indian   │ ───► │  (API key, server    │
  │  personas        │        │  AQI sub-indices   │      │   side only)         │
  │  card ranking    │ ◄───── │                    │ ◄─── │                      │
  │  warnings        │        ├────────────────────┤      ├──────────────────────┤
  │  radar           │ ─────► │ /api/warnings      │ ───► │ NDMA Sachet CAP feed │
  │                  │        │  parses CAP XML,   │      │  (IMD + SDMA + CWC)  │
  │                  │ ◄───── │  drops expired     │ ◄─── │                      │
  └────────┬─────────┘        └────────────────────┘      └──────────────────────┘
           │
           │  keyless sources, called directly
           └──────────────────────────────────► Open-Meteo · RainViewer ·
                                                OpenWeather · OpenFreeMap

  If any source fails ──► seeded demo dataset renders, badged SEEDED
```

**Three points worth making on the diagram slide:**

1. The browser never talks to CPCB. The API key stays on the server.
2. IMD's own APIs are blocked behind IP whitelisting — NDMA's public feed
   carries the same bulletins, which is how we get real warnings today.
3. Every path has a fallback, and the fallback is labelled on screen.

---

## 7. Numbers you can quote

All verified. Do not round them up.

| Number | What it is |
|---|---|
| **130 kB** | Gzipped first load (excludes the map, which loads on demand) |
| **4** | Runtime dependencies in the whole frontend |
| **0** | Dependencies in the backend |
| **~9,900** | Lines of TypeScript written |
| **8** | Personas |
| **6** | Saved cities |
| **28** | Weather × time-of-day background combinations, all contrast-checked |
| **342 × 2** | Translation keys, English and Hindi, parity enforced at build |
| **156** | Indian cities on the radar's air-quality layer |
| **99** | CAP alerts scanned per refresh of the warnings feed |
| **44** | CPCB stations aggregated for Delhi's air quality figure |
| **7** | Automated checks that can fail the build |

---

## 8. Feasibility and viability slide

**Already proven (not projections):**

- Two government data sources are live in production today, with no special
  access — CPCB needs only a free data.gov.in key, NDMA's CAP feed needs
  nothing at all.
- Deployed and running on free-tier infrastructure.
- Survived a real upstream outage during development without breaking.

**The one real dependency:** IMD's own forecast APIs require the calling
server's IP to be whitelisted. That is a paperwork timeline, not a technical
one, and it is the only thing standing between the current build and live
forecast numbers. The architecture already assumes it — the client never talks
to a weather source directly, so switching IMD on is one more server route, not
a rewrite.

**Why the risk is contained:** we deliberately built the marquee feature —
severe weather warnings — on a source that needs no permission. The app is
useful and honest today, and gets more accurate the day IMD access arrives.

**Cost:** zero to run at demo scale. Free tiers throughout.

**Scaling honestly:** caching is currently in-process, which is right for a
prototype and would move to a shared cache for production traffic.

---

## 9. Impact and benefits

- **Warnings reach people faster** — pinned above everything, whatever the user
  personalised. In a cyclone, the alert is not something you scroll to find.
- **Advice, not just data.** "Take an umbrella — a red warning for heavy rain is
  active until 13:29" is more useful to a parent than a colour code.
- **Trustworthy by construction.** Labelling every reading's source is what
  keeps a government weather app credible; users who catch one wrong number stop
  believing the rest.
- **Reaches people the current app doesn't** — Hindi throughout, and a
  low-end-device mode for the phones where the existing app struggles most.
- **Explainability is a governance property**, not just a UX one. A public body
  can audit why any citizen saw any card.

---

## 10. Demo script (2 minutes)

1. **Open on Mumbai.** Point at the warning banner pinned at the top.
2. **Tap the warning.** Show "What to do" — the advice, each line with the
   reading that caused it *and* whether that reading is live or seeded.
3. **Tap a persona card → "Why this card".** Read the sentence out. This is the
   explainability requirement, answered on screen.
4. **Go to You → change personas.** The homepage re-ranks live.
5. **Switch to हिन्दी.** Everything changes, including the warnings.
6. **Places → Open full radar → Air quality.** Zoom in; watch more cities
   appear.

**Have ready for the obvious question:** the air card shows the CPCB station
name and publish time, so "is this real?" is answered by pointing at the screen.

---

## 11. Likely judge questions — honest answers

**"Is this real data or a mock-up?"**
Air quality and severe warnings are live from CPCB and NDMA. Forecast numbers
are demo data until IMD whitelists our server. Every value on screen is labelled
which it is — here, look.

**"Why isn't the forecast live?"**
IMD's APIs need the calling server's IP on an approved list. Rather than wait,
we built the headline feature on NDMA's public feed, which carries IMD's own
bulletins. Nothing changes architecturally when IMD access arrives.

**"How does the personalisation work? Is it AI?"**
Deliberately not. It's a base score from your persona order plus an urgency
boost when a reading crosses a stated threshold. Every card shows its own
arithmetic. The problem statement asks for explainability, and a model can't
give you that.

**"What happens if the internet drops?"**
The app keeps rendering with its last known state and labels it as such. It is
not a full offline app — there's no service worker yet — but it never shows a
blank or broken screen.

**"Can it scale?"**
The client makes one request per data type and caches on both sides with TTLs
matched to how often each source actually publishes. At production traffic the
in-process cache would move to a shared one — that's a known, contained change.

**"What would you build next?"**
IMD forecast integration once whitelisted; a service worker for true offline;
user-managed saved locations. All three are scoped, none are blocked
technically.

---

## 12. If it isn't covered here

`docs/PROJECT-REFERENCE.md` in the repository has the full technical detail —
every screen, every value's data source, the folder structure, and a complete
list of known limitations.

**If neither document answers it, the answer is "ask before putting it on a
slide."** Inventing a plausible-sounding feature is the one thing that can cost
us more than leaving a slide thin.
