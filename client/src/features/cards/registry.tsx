import { AQI_BANDS, PLACES, aqiBand } from "../../data/seed";
import type { PersonaId, Place } from "../../data/types";
import { WARNING_COLOR } from "../../design/tokens";
import { WeatherIcon } from "../../components/WeatherIcon";
import { Band, Bars, Gauge, KeyValues, Note, Readout, WindowPair } from "./viz";

export interface CardDetail {
  lede: string;
  rows: [string, string][];
  /** Provenance and cache policy — one sentence, no hand-waving. */
  source: string;
}

export interface CardPresentation {
  Body: (props: { place: Place }) => JSX.Element;
  detail: (place: Place) => CardDetail;
  icon: JSX.Element;
}

const one = (n: number) => n.toFixed(1);

export const CARD_UI: Record<PersonaId, CardPresentation> = {
  /* ---------------------------------------------------------------- */
  health: {
    icon: (
      <>
        <path d="M3 15c3.5 0 3.5-6 7-6s3.5 6 7 6 4-2 4-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="18" cy="7" r="2.4" fill="currentColor" opacity=".55" />
      </>
    ),
    Body: ({ place }) => {
      const band = aqiBand(place.aqi);
      return (
        <>
          <Readout value={place.aqi} unit={`AQI · ${band.name}`} />
          <Band
            segments={AQI_BANDS.map((b) => ({ color: b.color }))}
            activeIndex={AQI_BANDS.indexOf(band)}
            labels={["Good", "Moderate", "Severe"]}
          />
          <KeyValues
            items={[
              ["PM2.5 µg/m³", String(place.pm25)],
              ["Pollen", place.pollen],
              ["Humidity", `${place.humidity}%`],
            ]}
          />
        </>
      );
    },
    detail: (p) => ({
      lede: "Continuous ambient monitoring from the nearest CPCB station.",
      rows: [
        ["Air Quality Index", `${p.aqi} · ${p.aqiCategory}`],
        ["PM2.5", `${p.pm25} µg/m³`],
        ["PM10", `${Math.round(p.pm25 * 1.9)} µg/m³`],
        ["Pollen load", p.pollen],
        ["Relative humidity", `${p.humidity} %`],
        ["Dew point", `${p.dewPoint} °C`],
      ],
      source:
        "CPCB real-time AQI via data.gov.in, cached 60 minutes — the interval CPCB actually publishes on. No IP whitelisting needed, which is why this is the first live feed we wire up.",
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
      const temps = place.hourly.slice(0, 8).map((h) => h.temp);
      const min = Math.min(...temps);
      return (
        <>
          <Readout value={place.runStart} unit={`to ${place.runEnd}`} />
          <Note>Coolest stretch before the sun clears the horizon.</Note>
          <Bars
            values={temps.map((t) => t - min + 4)}
            highlight={temps.indexOf(min)}
            axis={["04:00", "10:00", "16:00", "22:00"]}
          />
          <KeyValues
            items={[
              ["Peak UV", String(place.uv)],
              ["Wind", `${place.wind} km/h`],
              ["Feels like", `${place.feelsLike}°`],
            ]}
          />
        </>
      );
    },
    detail: (p) => ({
      lede: "Hour-by-hour heat and UV load, scored for sustained outdoor effort.",
      rows: [
        ["Best window", `${p.runStart} – ${p.runEnd}`],
        ["Peak UV index", String(p.uv)],
        ["Feels like (peak)", `${p.feelsLike} °C`],
        ["Heat index", `${p.urban.heatIndex} °C`],
        ["Wind", `${p.wind} km/h`],
        ["Sunrise", `${p.sunrise} IST`],
      ],
      source:
        "IMD hourly city forecast plus the sunrise/sunset endpoint, cached 3 hours to match IMD's forecast refresh.",
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
      const wave = place.waveHeight ?? 0;
      const advice =
        wave >= 2 ? "Swimming not advised" : wave >= 1.2 ? "Caution near the shore" : "Calm enough to swim";
      return (
        <>
          <Readout value={one(wave)} unit="m swell" />
          <Note>
            {advice} — {wave >= 2 ? "above" : "below"} the 2 m advisory line. {place.moon.tideRegime === "spring"
              ? "Spring tides this week, so the range is at its widest."
              : place.moon.tideRegime === "neap"
                ? "Neap tides this week, so the range is unusually narrow."
                : `Moon is ${place.moon.phase.toLowerCase()} at ${place.moon.illumination}%, so the range is moderate.`}
          </Note>
          <KeyValues
            items={[
              [`Next high · ${one(place.tideHighM ?? 0)} m`, place.tideHigh ?? "—"],
              ["Low tide", place.tideLow ?? "—"],
              ["Sea temp", `${one(place.seaTemp ?? 0)}°`],
            ]}
          />
        </>
      );
    },
    detail: (p) => ({
      lede: "Sea state and tide timings for the nearest coastal station.",
      rows: [
        ["Significant wave height", `${one(p.waveHeight ?? 0)} m`],
        ["Next high tide", `${p.tideHigh} · ${one(p.tideHighM ?? 0)} m`],
        ["Next low tide", p.tideLow ?? "—"],
        ["Sea surface temp", `${one(p.seaTemp ?? 0)} °C`],
        ["Moon phase", `${p.moon.phase} · ${p.moon.illumination}%`],
        ["Tide regime", p.moon.tideRegime],
        ["Onshore wind", `${p.wind} km/h`],
      ],
      source:
        "INCOIS sea-state bulletin joined to the IMD coastal station list, cached 6 hours. Moon phase is carried only because it explains the tide range — moonrise and moonset themselves are out of scope.",
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
      const others = PLACES.filter((x) => x.id !== place.id).slice(0, 3);
      const warned = others.filter((d) => d.alert).length;
      return (
        <>
          <div className="mt-1">
            {others.map((d, i) => (
              <div
                key={d.id}
                className={`flex items-center gap-2.5 py-2 ${i === 0 ? "" : "border-t"}`}
                style={{ borderColor: "var(--hair)" }}
              >
                <WeatherIcon condition={d.condition} size={22} />
                <b className="flex-1 text-[13.5px] font-semibold">{d.name}</b>
                {d.alert ? (
                  <span
                    className="rounded-[5px] px-1.5 py-0.5 font-mono text-[8.5px] font-bold uppercase tracking-[0.06em] text-white"
                    style={{ background: WARNING_COLOR[d.alert.level] }}
                  >
                    {d.alert.level}
                  </span>
                ) : null}
                <span className="tnum font-mono text-[13.5px] font-semibold">{d.temp}°</span>
              </div>
            ))}
          </div>
          <Note>
            Pack for {warned ? "rain and delays" : "warm, dry days"} — {warned} of {others.length} saved
            cities are under a warning.
          </Note>
        </>
      );
    },
    detail: (p) => ({
      lede: "Your saved destinations, checked against every active district, cyclone and flash-flood warning.",
      rows: [
        ...PLACES.filter((x) => x.id !== p.id).map(
          (d) => [d.name, `${d.temp}° · ${d.alert ? `${d.alert.level} ${d.alert.kind}` : "no warning"}`] as [string, string],
        ),
        ...(p.aviation
          ? ([
              ["Departure airport", p.aviation.airport],
              ["Runway visibility", `${p.aviation.visibilityM} m`],
              ["Crosswind", `${p.aviation.crosswindKt} kt`],
              ["Terminal status", p.aviation.terminalStatus],
            ] as [string, string][])
          : []),
      ],
      source:
        "IMD 7-day city forecast and the CAP warning feed, re-checked whenever a new CAP alert is issued rather than on a timer. Airport rows come from IMD's Aviation Services, surfaced here rather than as a persona of their own.",
    }),
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
      const worst = Math.max(place.schoolDropRain, place.schoolPickupRain);
      return (
        <>
          <WindowPair
            items={[
              { label: "Drop 07:30", value: `${place.schoolDropRain}%`, caption: "rain chance" },
              { label: "Pick-up 14:45", value: `${place.schoolPickupRain}%`, caption: "rain chance" },
            ]}
          />
          <Note>
            {worst >= 60 ? "Send an umbrella." : "No umbrella needed."} Nowcast refreshes for your
            district every 15 minutes.
          </Note>
        </>
      );
    },
    detail: (p) => ({
      lede: "The two windows that matter, taken from the district nowcast.",
      rows: [
        ["Morning drop 07:30", `${p.schoolDropRain}% rain`],
        ["Afternoon pick-up 14:45", `${p.schoolPickupRain}% rain`],
        ["Wind at pick-up", `${p.wind} km/h`],
        ["Visibility", `${one(p.visibility)} km`],
        ["Lightning risk", p.condition === "thunderstorm" ? "Present" : "None reported"],
      ],
      source:
        "IMD district nowcast, refreshed every 15 minutes — the shortest TTL in the cache, because this is the data most likely to change between the school run and the pick-up.",
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
    Body: ({ place }) => (
      <>
        <Readout value={place.rain24} unit="mm next 24 h" />
        <Bars values={place.rainProbability.slice(0, 6)} highlight={0} axis={["Now", "+12 h", "+24 h"]} />
        <Gauge percent={place.agromet.soilMoisture * 100} />
        <Note>{place.agromet.advisory}</Note>
        <KeyValues
          items={[
            [`Soil m³/m³ · ${place.agromet.soilCategory}`, place.agromet.soilMoisture.toFixed(2)],
            ["Humidity", `${place.humidity}%`],
          ]}
        />
      </>
    ),
    detail: (p) => ({
      lede: "Field-scale rainfall, soil moisture and the current Agromet advisory.",
      rows: [
        ["Rainfall next 24 h", `${p.rain24} mm`],
        ["Soil moisture", `${p.agromet.soilMoisture.toFixed(2)} m³/m³ · ${p.agromet.soilCategory}`],
        ["Advisory issued", p.agromet.issued],
        ["Relative humidity", `${p.humidity} %`],
        ["Frost risk", p.temp < 6 ? "Watch" : "None"],
      ],
      source:
        "IMD subdivision rainfall forecast cached 6 hours, plus the district Agromet Advisory Service bulletin — issued Tuesdays and Fridays, so it is cached until the next issue rather than on a clock.",
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
      const risk =
        place.visibility < 3
          ? "High spray and low visibility"
          : place.visibility < 5
            ? "Reduced visibility"
            : "Clear roads";
      return (
        <>
          <Readout value={one(place.visibility)} unit="km visibility" />
          <Gauge percent={(place.visibility / 10) * 100} />
          <Note>
            {risk} on the 18:30 run home. {place.urban.advisory}
          </Note>
          <KeyValues
            items={[
              ["Wind", `${place.wind} km/h`],
              ["Gusting", `${place.gust} km/h`],
              ["Waterlogging", place.urban.waterloggingRisk],
            ]}
          />
        </>
      );
    },
    detail: (p) => ({
      lede: "Road-relevant conditions for the evening run home.",
      rows: [
        ["Visibility", `${one(p.visibility)} km`],
        ["Waterlogging risk", p.urban.waterloggingRisk],
        ["Urban advisory", p.urban.advisory],
        ["Wind", `${p.wind} km/h`],
        ["Gusting to", `${p.gust} km/h`],
        ["Rain in next 3 h", `${p.rainProbability[0]} %`],
      ],
      source:
        "IMD district nowcast for visibility and precipitation, cached 15 minutes, joined to IMD's Urban Meteorological Services bulletin for the city-scale waterlogging call.",
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
      const min = Math.min(...place.rainProbability);
      return (
        <>
          <Readout value={place.comfortIndex} unit="/ 100 comfort" />
          <Bars
            values={place.rainProbability}
            highlight={place.rainProbability.indexOf(min)}
            axis={["Today", "+5 d", "+10 d"]}
          />
          <Note>
            Driest day in the outlook is <b className="font-semibold">{place.tourism.bestDay}</b> at {min}%
            rain probability.
          </Note>
        </>
      );
    },
    detail: (p) => ({
      lede: "Ten days of rain probability, scored into one comfort number.",
      rows: [
        ["Comfort index today", `${p.comfortIndex} / 100`],
        ["Driest day ahead", p.tourism.bestDay],
        ["Lowest rain probability", `${Math.min(...p.rainProbability)} %`],
        ["Tourism outlook", p.tourism.outlook],
        ["Humidity", `${p.humidity} %`],
      ],
      source:
        "IMD extended-range outlook cached 12 hours and re-scored on every screen load, with the narrative line taken from IMD's Tourism Forecast for the station.",
    }),
  },
};
