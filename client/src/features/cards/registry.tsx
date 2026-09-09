import { AQI_BANDS, aqiBand } from "../../data/seed";
import type { PersonaId, Place } from "../../data/types";
import { WARNING_COLOR } from "../../design/tokens";
import { WeatherIcon } from "../../components/WeatherIcon";
import { savedPlaces } from "../../personalization/rules";
import { packingFor } from "../../personalization/packing";
import { useT } from "../../i18n/context";
import { placeName, seedEnum, seedText } from "../../i18n/seedText";
import type { LiveAqi } from "../../lib/useLiveAqi";
import { Band, Bars, Gauge, KeyValues, Note, Readout, WindowPair } from "./viz";

export type Translate = (key: string, vars?: Record<string, string>) => string;

export interface CardDetail {
  lede: string;
  rows: [string, string][];
  /**
   * Provenance and cache policy — one sentence, no hand-waving.
   *
   * Kept in English in both languages: these name endpoints, feeds and cache
   * TTLs, and a machine-flavoured Hindi rendering of "cached until the next
   * issue rather than on a clock" would read worse than the original.
   * The sheet says so on screen rather than leaving it as a gap to discover.
   */
  source: string;
}

export interface CardPresentation {
  /**
   * `liveAqi` is passed rather than pulled from context on purpose: a card
   * presentation reaching into app state both inverts the layering and makes
   * this module un-hot-reloadable, which cost a blank screen once already.
   */
  Body: (props: { place: Place; liveAqi?: LiveAqi | null }) => JSX.Element;
  detail: (place: Place, t: Translate) => CardDetail;
  icon: JSX.Element;
}

const one = (n: number) => n.toFixed(1);

/**
 * Highest rain probability in the next `hours` hours.
 *
 * Reads the hourly strip rather than `rainProbability`, because the strip is
 * anchored to the real local hour and has one entry per hour — so a "next 3 h"
 * figure covers three hours rather than the 2.4-hour slot that indexing
 * `rainProbability[0]` actually returns. Falls back to the first slot for a
 * place whose hourly strip has not been built yet (the raw seed export ships
 * with `hourly: []`; AppState fills it in).
 */
const rainWithin = (p: Place, hours: number) =>
  p.hourly.length
    ? Math.max(...p.hourly.slice(0, hours).map((h) => h.precipitation))
    : (p.rainProbability[0] ?? 0);

export const CARD_UI: Record<PersonaId, CardPresentation> = {
  /* ---------------------------------------------------------------- */
  health: {
    icon: (
      <>
        <path d="M3 15c3.5 0 3.5-6 7-6s3.5 6 7 6 4-2 4-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="18" cy="7" r="2.4" fill="currentColor" opacity=".55" />
      </>
    ),
    Body: ({ place, liveAqi }) => {
      const t = useT();
      const band = aqiBand(place.aqi);
      // With a live station, show the pollutant that actually produced the
      // index and its own concentration. Showing "PM2.5 34" beside a live
      // NO2-governed AQI of 169 reads as a contradiction, and the station may
      // not report PM2.5 at all.
      const governing: [string, string] = liveAqi
        ? [
            `${liveAqi.pollutant} µg/m³`,
            String(liveAqi.readings[liveAqi.pollutant] ?? place.pm25),
          ]
        : [t("kv.pm25"), String(place.pm25)];
      return (
        <>
          <Readout
            value={place.aqi}
            unit={t("unit.aqi", { band: seedEnum(t, "aqiCat", band.name) })}
          />
          {/* Which station and when, on the card itself. Without this a figure
              that disagrees with another source is unverifiable rather than
              explainable — which is the whole point of the rest of this app. */}
          <Note>
            {liveAqi
              ? t("card.health.station", {
                  station: liveAqi.station,
                  pollutant: liveAqi.pollutant,
                  at: liveAqi.updated,
                })
              : place.cpcbCity
                ? t("card.health.noLive")
                : t("card.health.noStation", { place: placeName(t, place) })}
          </Note>
          <Band
            segments={AQI_BANDS.map((b) => ({ color: b.color }))}
            activeIndex={AQI_BANDS.indexOf(band)}
            labels={[t("band.good"), t("band.moderate"), t("band.severe")]}
          />
          {/* UV sits here because the persona spec lists it under
              Health-conscious — skin sensitivity, not athletic load. It also
              stays on the Fitness card, whose scoring rule fires on UV >= 8 and
              whose "why this card" sentence names the reading; removing it
              there would leave that explanation pointing at a number the card
              no longer shows. Same field, two readings of it. */}
          <KeyValues
            items={[
              governing,
              [t("kv.pollen"), seedEnum(t, "pollenLevel", place.pollen)],
              [t("kv.peakUv"), String(place.uv)],
              [t("kv.humidity"), `${place.humidity}%`],
            ]}
          />
        </>
      );
    },
    detail: (p, t) => ({
      lede: t("card.health.lede"),
      rows: [
        [t("row.aqi"), `${p.aqi} · ${seedEnum(t, "aqiCat", p.aqiCategory)}`],
        [t("row.pm25"), `${p.pm25} µg/m³`],
        [t("row.pm10"), `${Math.round(p.pm25 * 1.9)} µg/m³`],
        [t("row.pollenLoad"), seedEnum(t, "pollenLevel", p.pollen)],
        [t("row.peakUv"), String(p.uv)],
        [t("row.rh"), `${p.humidity} %`],
        [t("row.dewPoint"), `${p.dewPoint} °C`],
      ],
      source:
        "AQI, PM2.5 and PM10 are live from CPCB via data.gov.in, cached 20 minutes. CPCB publishes on the hour, so a full-hour cache could serve a reading nearly two hours old — long enough to visibly disagree with another source during rain, when PM2.5 moves fast. No IP whitelisting needed, which is why this is the first live feed we wired up. Pollen, UV index, humidity and dew point are seeded: CPCB publishes pollutant concentrations only, and no live source for those four is wired.",
    }),
  },

  /* ---------------------------------------------------------------- */
  fitness: {
    icon: (
      <>
        <circle cx="12" cy="12" r="8.4" stroke="currentColor" strokeWidth="1.7" />
        <path d="M12 7.2V12l3.2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
    Body: ({ place }) => {
      const t = useT();
      const temps = place.hourly.slice(0, 8).map((h) => h.temp);
      const min = Math.min(...temps);
      return (
        <>
          <Readout value={place.runStart} unit={t("unit.to", { v: place.runEnd })} />
          <Note>{t("card.fitness.note")}</Note>
          <Bars
            values={temps.map((v) => v - min + 4)}
            highlight={temps.indexOf(min)}
            axis={["04:00", "10:00", "16:00", "22:00"]}
          />
          <KeyValues
            items={[
              [t("kv.peakUv"), String(place.uv)],
              [t("kv.wind"), t("unit.kmh", { v: String(place.wind) })],
              [t("kv.feelsLike"), `${place.feelsLike}°`],
            ]}
          />
        </>
      );
    },
    detail: (p, t) => ({
      lede: t("card.fitness.lede"),
      rows: [
        [t("row.bestWindow"), `${p.runStart} – ${p.runEnd}`],
        [t("row.peakUv"), String(p.uv)],
        [t("row.feelsPeak"), `${p.feelsLike} °C`],
        [t("row.heatIndex"), `${p.urban.heatIndex} °C`],
        [t("row.wind"), t("unit.kmh", { v: String(p.wind) })],
        [t("row.sunrise"), `${p.sunrise} IST`],
      ],
      source:
        "Seeded. The best-window, UV, feels-like and heat-index figures are demo values: no IMD hourly city forecast is called anywhere in this build, and neither is the sunrise/sunset endpoint. The temperature curve is derived from the station's current reading over a diurnal shape — only its hour labels are real, counting forward from the actual local time in this city.",
    }),
  },

  /* ---------------------------------------------------------------- */
  beach: {
    icon: (
      <>
        <path
          d="M2 15c2 0 2-1.6 4-1.6S8 15 10 15s2-1.6 4-1.6 2 1.6 4 1.6 2-1.6 4-1.6"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M2 20c2 0 2-1.6 4-1.6S8 20 10 20s2-1.6 4-1.6 2 1.6 4 1.6 2-1.6 4-1.6"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          opacity=".5"
        />
        <circle cx="17" cy="6.6" r="2.8" fill="currentColor" opacity=".55" />
      </>
    ),
    Body: ({ place }) => {
      const t = useT();
      // No swim recommendation here either. The advisory version was dropped
      // because `waveHeight` is a seeded constant with no marine API behind it;
      // repeating the same instruction on the card would just move it.
      const wave = place.waveHeight ?? 0;
      const regime =
        place.moon.tideRegime === "spring"
          ? t("card.beach.spring")
          : place.moon.tideRegime === "neap"
            ? t("card.beach.neap")
            : t("card.beach.transitional", {
                phase: seedEnum(t, "moonPhase", place.moon.phase).toLowerCase(),
                pct: String(place.moon.illumination),
              });
      return (
        <>
          <Readout value={one(wave)} unit={t("unit.mSwell")} />
          <Note>{regime}</Note>
          <KeyValues
            items={[
              [
                t("kv.nextHigh", { m: one(place.tideHighM ?? 0) }),
                place.tideHigh ?? "—",
              ],
              [t("kv.lowTide"), place.tideLow ?? "—"],
              [t("kv.seaTemp"), `${one(place.seaTemp ?? 0)}°`],
            ]}
          />
        </>
      );
    },
    detail: (p, t) => ({
      lede: t("card.beach.lede"),
      rows: [
        [t("row.waveHeight"), `${one(p.waveHeight ?? 0)} m`],
        [t("row.nextHigh"), `${p.tideHigh} · ${one(p.tideHighM ?? 0)} m`],
        [t("row.nextLow"), p.tideLow ?? "—"],
        [t("row.seaTemp"), `${one(p.seaTemp ?? 0)} °C`],
        [
          t("row.moonPhase"),
          `${seedEnum(t, "moonPhase", p.moon.phase)} · ${p.moon.illumination}%`,
        ],
        [t("row.tideRegime"), seedEnum(t, "tide", p.moon.tideRegime)],
        [t("row.onshoreWind"), t("unit.kmh", { v: String(p.wind) })],
      ],
      source:
        "Seeded. There is no marine data source in this build: INCOIS has never been called, and no wave-height or tide API is wired. The wave, tide and sea-temperature figures here are demo values shaped to be plausible, and the swim advisory that used to read off them has been removed rather than shown without backing. Moon phase is carried only because it explains the tide range.",
    }),
  },

  /* ---------------------------------------------------------------- */
  travel: {
    icon: (
      <path
        d="M3 13.4 21 6l-4.4 8.6L12 15.4l-1.6 4.2-1.8-4.4L3 13.4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    ),
    Body: ({ place }) => {
      const t = useT();
      // savedPlaces(), not the raw seed array: this has live warnings merged
      // in, so the badge here agrees with the banner and with the travel rule's
      // own boost, which already scored against the merged set.
      const all = savedPlaces().filter((x) => x.id !== place.id);
      // The list shows the first three; the COUNT is over all of them, because
      // the travel rule's boost counts all of them. Counting only the visible
      // three put "2 of 3 saved destinations are under an active warning" on
      // the card directly above a "why this card" line reading "4 saved
      // destinations have an active warning".
      const others = all.slice(0, 3);
      const warned = all.filter((d) => d.alert).length;
      // The packing line per destination, from the same advice engine the home
      // screen uses. See personalization/packing.ts for why this is a
      // projection of existing advisories rather than rules of its own.
      const packing = new Map(packingFor(others, t).map((x) => [x.placeId, x]));
      return (
        <>
          <div className="mt-1">
            {others.map((d, i) => {
              const pack = packing.get(d.id);
              return (
                <div
                  key={d.id}
                  className={`flex items-center gap-2.5 py-2 ${i === 0 ? "" : "border-t"}`}
                  style={{ borderColor: "var(--hair)" }}
                >
                  <WeatherIcon condition={d.condition} size={22} />
                  <span className="min-w-0 flex-1">
                    <b className="block text-[13.5px] font-semibold">{placeName(t, d)}</b>
                    {pack ? (
                      <small
                        className="block text-[11px] leading-[1.35]"
                        style={{ color: "var(--txt-2)" }}
                      >
                        {t(pack.itemKey)}
                      </small>
                    ) : null}
                  </span>
                  {d.alert ? (
                    <span
                      className="rounded-[5px] px-1.5 py-0.5 font-mono text-[8.5px] font-bold uppercase tracking-[0.06em] text-white"
                      style={{ background: WARNING_COLOR[d.alert.level] }}
                    >
                      {t(`level.${d.alert.level}`)}
                    </span>
                  ) : null}
                  <span className="tnum font-mono text-[13.5px] font-semibold">{d.temp}°</span>
                </div>
              );
            })}
          </div>
          <Note>
            {t("card.travel.note", {
              warned: String(warned),
              total: String(all.length),
            })}
          </Note>
        </>
      );
    },
    detail: (p, t) => {
      const others = savedPlaces().filter((x) => x.id !== p.id);
      const packing = packingFor(others, t);
      return {
        lede: t("card.travel.lede"),
        rows: [
          ...others.map(
            (d) =>
              [
                placeName(t, d),
                `${d.temp}° · ${
                  d.alert
                    ? `${t(`level.${d.alert.level}`)} ${t(`alert.kind.${d.alert.kind}`)}`
                    : t("val.noWarningShort")
                }`,
              ] as [string, string],
          ),
          ...(packing.length
            ? ([
                [
                  t("row.packing"),
                  packing.map((x) => `${x.placeName}: ${t(x.itemKey)}`).join(" · "),
                ],
              ] as [string, string][])
            : []),
          ...(p.aviation
            ? ([
                [t("row.airport"), seedText(t, `aviationAirport.${p.id}`, p.aviation.airport)],
                [t("row.runwayVis"), `${p.aviation.visibilityM} m`],
                [t("row.crosswind"), `${p.aviation.crosswindKt} kt`],
                [
                  t("row.terminal"),
                  seedText(t, `aviationText.${p.id}`, p.aviation.terminalStatus),
                ],
              ] as [string, string][])
            : []),
        ],
        source:
          "The warnings on this card are live, from NDMA's public CAP feed — the same bulletins the banner carries, re-checked whenever a new one is issued rather than on a timer. Everything else is seeded: there is no IMD 7-day city forecast in this build, so the destination temperatures are demo values and the airport rows are illustrative rather than IMD Aviation Services data. The packing line is not a separate forecast — it is the top advisory the rule engine already produces for that destination, projected onto something you can put in a bag.",
      };
    },
  },

  /* ---------------------------------------------------------------- */
  family: {
    icon: (
      <>
        <circle cx="8.4" cy="7.6" r="2.8" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="16.4" cy="9.6" r="2.1" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M3.4 20c0-3.1 2.2-5.4 5-5.4s5 2.3 5 5.4M14.2 20c0-2.3 1.4-4 3.2-4s3.2 1.7 3.2 4"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </>
    ),
    Body: ({ place }) => {
      const t = useT();
      const worst = Math.max(place.schoolDropRain, place.schoolPickupRain);
      return (
        <>
          <WindowPair
            items={[
              {
                label: t("kv.drop"),
                value: `${place.schoolDropRain}%`,
                caption: t("kv.rainChance"),
              },
              {
                label: t("kv.pickup"),
                value: `${place.schoolPickupRain}%`,
                caption: t("kv.rainChance"),
              },
            ]}
          />
          <Note>
            {t("card.family.note", {
              advice: t(worst >= 60 ? "card.family.umbrella" : "card.family.noUmbrella"),
            })}
          </Note>
        </>
      );
    },
    detail: (p, t) => ({
      lede: t("card.family.lede"),
      rows: [
        [t("row.morningDrop"), `${p.schoolDropRain}%`],
        [t("row.afternoonPickup"), `${p.schoolPickupRain}%`],
        [t("row.windAtPickup"), t("unit.kmh", { v: String(p.wind) })],
        [t("row.visibility"), `${one(p.visibility)} km`],
        [
          t("row.lightning"),
          p.condition === "thunderstorm" ? t("val.present") : t("val.noneReported"),
        ],
      ],
      source:
        "Seeded. The drop and pick-up rain probabilities, the wind, the visibility and the lightning row are demo values: there is no IMD district nowcast in this build, and nothing on this card refreshes on a fifteen-minute timer. Severe weather does reach this persona for real — through the alert banner and the advice line under it, which run on NDMA's live CAP feed — but not through these two windows.",
    }),
  },

  /* ---------------------------------------------------------------- */
  farm: {
    icon: (
      <>
        <path d="M12 21v-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path
          d="M12 13c0-3.3 2.4-6 5.4-6 0 3.3-2.4 6-5.4 6ZM12 15c0-2.8-2-5-4.6-5 0 2.8 2 5 4.6 5Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </>
    ),
    Body: ({ place }) => {
      const t = useT();
      return (
        <>
          <Readout value={place.rain24} unit={t("unit.mmNext24")} />
          {/* The full ten slots. This was slicing to six — the first
              14.4 hours — under an axis labelled "+24 h". */}
          <Bars
            values={place.rainProbability}
            highlight={0}
            axis={[t("home.now"), t("axis.plus12h"), t("axis.plus24h")]}
          />
          <Gauge percent={place.agromet.soilMoisture * 100} />
          <Note>{seedText(t, `agrometText.${place.id}`, place.agromet.advisory)}</Note>
          <KeyValues
            items={[
              [
                t("kv.soil", { cat: seedEnum(t, "soil", place.agromet.soilCategory) }),
                place.agromet.soilMoisture.toFixed(2),
              ],
              [t("kv.humidity"), `${place.humidity}%`],
            ]}
          />
        </>
      );
    },
    detail: (p, t) => ({
      lede: t("card.farm.lede"),
      rows: [
        [t("row.rain24"), `${p.rain24} mm`],
        [
          t("row.soilMoisture"),
          `${p.agromet.soilMoisture.toFixed(2)} m³/m³ · ${seedEnum(t, "soil", p.agromet.soilCategory)}`,
        ],
        [t("row.advisoryIssued"), seedText(t, `agrometIssued.${p.id}`, p.agromet.issued)],
        [t("row.rh"), `${p.humidity} %`],
        [t("row.frostRisk"), p.temp < 6 ? t("val.watch") : t("val.none")],
      ],
      source:
        "Seeded. The rainfall total, the 24-hour rain curve, the soil-moisture reading and the advisory paragraph are all demo values: no IMD subdivision rainfall forecast is called, and no Agromet Advisory Service bulletin is fetched. The advisory text is written to read like a real AAS bulletin, which is exactly why it is labelled here — an invented paragraph in an official register is the easiest thing on this card to mistake for the real one.",
    }),
  },

  /* ---------------------------------------------------------------- */
  commute: {
    icon: (
      <>
        <path
          d="M4 16.4V11l1.9-4.4A2 2 0 0 1 7.7 5.4h8.6a2 2 0 0 1 1.8 1.2L20 11v5.4"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="M4 11h16" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="7.6" cy="16.4" r="1.6" fill="currentColor" />
        <circle cx="16.4" cy="16.4" r="1.6" fill="currentColor" />
      </>
    ),
    Body: ({ place }) => {
      const t = useT();
      // "Clear roads" used to be the third branch. Visibility above 5 km
      // says nothing about what is on the road — there is no traffic source in
      // this build — so the phrase now describes the reading it actually has.
      const risk = t(
        place.visibility < 3
          ? "card.commute.spray"
          : place.visibility < 5
            ? "card.commute.reduced"
            : "card.commute.clear",
      );
      return (
        <>
          <Readout value={one(place.visibility)} unit={t("unit.kmVisibility")} />
          <Gauge percent={(place.visibility / 10) * 100} />
          <Note>
            {t("card.commute.note", {
              risk,
              advisory: seedText(t, `urbanText.${place.id}`, place.urban.advisory),
            })}
          </Note>
          <KeyValues
            items={[
              [t("kv.wind"), t("unit.kmh", { v: String(place.wind) })],
              [t("kv.gusting"), t("unit.kmh", { v: String(place.gust) })],
              [t("kv.waterlogging"), seedEnum(t, "risk", place.urban.waterloggingRisk)],
            ]}
          />
        </>
      );
    },
    detail: (p, t) => ({
      lede: t("card.commute.lede"),
      rows: [
        [t("row.visibility"), `${one(p.visibility)} km`],
        [t("row.waterlogging"), seedEnum(t, "risk", p.urban.waterloggingRisk)],
        [t("row.urbanAdvisory"), seedText(t, `urbanText.${p.id}`, p.urban.advisory)],
        [t("row.wind"), t("unit.kmh", { v: String(p.wind) })],
        [t("row.gustingTo"), t("unit.kmh", { v: String(p.gust) })],
        [t("row.rain3h"), `${rainWithin(p, 3)} %`],
      ],
      source:
        "Weather-side conditions only. There is no traffic or road-status source anywhere in this build and nothing on this card implies one: the visibility, gust and waterlogging figures are seeded demo values, and the named junctions are illustrative rather than an urban nowcast. Live severe warnings do reach this card, through the alert banner above it — that is the one feed here that is real.",
    }),
  },

  /* ---------------------------------------------------------------- */
  event: {
    icon: (
      <>
        <rect x="3.4" y="5.4" width="17.2" height="15.2" rx="3" stroke="currentColor" strokeWidth="1.7" />
        <path d="M3.4 10.4h17.2M8.4 3.4v4M15.6 3.4v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </>
    ),
    Body: ({ place }) => {
      const t = useT();
      const min = Math.min(...place.rainProbability);
      return (
        <>
          <Readout value={place.comfortIndex} unit={t("unit.comfort")} />
          {/* Was "Today / +5 d / +10 d" over the same array the farm card drew
              as 24 hours and buildHourly spreads across 24 hours. There is no
              multi-day series in this build; the axis says what the numbers
              are. */}
          <Bars
            values={place.rainProbability}
            highlight={place.rainProbability.indexOf(min)}
            axis={[t("home.now"), t("axis.plus12h"), t("axis.plus24h")]}
          />
          <Note>{t("card.event.note", { pct: String(min) })}</Note>
        </>
      );
    },
    detail: (p, t) => ({
      lede: t("card.event.lede"),
      rows: [
        [t("row.comfortToday"), `${p.comfortIndex} / 100`],
        [t("row.driestDay"), seedText(t, `tourismDay.${p.id}`, p.tourism.bestDay)],
        [t("row.lowestRain"), `${Math.min(...p.rainProbability)} %`],
        [t("row.tourismOutlook"), seedText(t, `tourismText.${p.id}`, p.tourism.outlook)],
        [t("row.rh"), `${p.humidity} %`],
      ],
      source:
        "Seeded. The chart is a single 24-hour rain-probability curve in ten slots — the same series the hourly strip interpolates — and the comfort index is scored from it on every screen load. There is no IMD extended-range product in this build, so nothing here covers more than a day; the driest-day and tourism-outlook rows are seeded narrative text rather than a forecast.",
    }),
  },
};
