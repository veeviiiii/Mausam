/**
 * English and Hindi, one key at a time.
 *
 * Scope, stated rather than discovered: every string a user can reach by
 * tapping around the four tabs, the warning sheet and the radar is translated.
 * The one deliberate exception is the "Where this comes from" provenance
 * paragraph on each persona detail — those are three-sentence technical notes
 * about IMD endpoints and cache TTLs, and a machine-flavoured Hindi rendering
 * of "cached until the next issue rather than on a clock" would read worse
 * than the English. The heading is translated and the sheet says so, so it is
 * a stated decision on screen, not a gap someone finds.
 *
 * `{name}` placeholders are filled by the `t()` helper. Both maps must carry
 * the same key set — scripts/verify-tokens.ts fails the build if they drift.
 */

export type Lang = "en" | "hi";

export const LANGUAGES: { id: Lang; label: string; english: string }[] = [
  { id: "en", label: "English", english: "English" },
  { id: "hi", label: "हिन्दी", english: "Hindi" },
];

type Dict = Record<string, string>;

const en: Dict = {
  /* ---- navigation ---- */
  "nav.home": "Home",
  "nav.alerts": "Warnings",
  "nav.places": "Places",
  "nav.you": "You",

  /* ---- chrome ---- */
  "brand.offline": "Offline",
  "time.justNow": "just now",
  "time.minAgo": "{n} min ago",
  "time.hAgo": "{n} h ago",
  "time.hmAgo": "{n} h {m} min ago",
  "ptr.pull": "Pull to refresh",
  "ptr.release": "Release to refresh",
  "ptr.loading": "Refreshing…",

  /* ---- conditions ---- */
  "cond.clear": "Clear",
  "cond.partly": "Partly cloudy",
  "cond.overcast": "Overcast",
  "cond.rain": "Rain",
  "cond.thunderstorm": "Thunderstorm",
  "cond.fog": "Fog",
  "cond.snow": "Snow",

  /* ---- time of day ---- */
  "tod.dawn": "Dawn",
  "tod.day": "Day",
  "tod.dusk": "Dusk",
  "tod.night": "Night",

  /* ---- home ---- */
  "home.humidity": "Humidity",
  "home.wind": "Wind",
  "home.visibility": "Visibility",
  "home.sunset": "Sunset",
  "home.feelsLike": "feels like {v}°",
  "home.offline": "Showing last known data, updated {age}",
  "home.next24": "Next 24 hours",
  "home.now": "Now",
  "home.suppressedOne": "{names} card is hidden here — {place} is inland, so there is no tide station in range.",
  "home.suppressedMany": "{names} cards are hidden here — {place} is inland, so there is no tide station in range.",

  /* ---- warnings ---- */
  "alert.kind.district": "District warning",
  "alert.kind.cyclone": "Cyclone warning",
  "alert.kind.flash-flood": "Flash flood bulletin",
  "alert.validTill": "Valid till {until} · {office}",
  "alert.none": "No active IMD warnings for {place}. Checked {age}.",
  "alert.noWarning": "No warning",
  "level.green": "green",
  "level.yellow": "yellow",
  "level.orange": "orange",
  "level.red": "red",

  /* ---- screens ---- */
  "screen.alerts.title": "Warnings",
  "screen.alerts.blurb":
    "Every CAP alert across your saved places — district warnings, cyclone bulletins and flash flood guidance, from one parser. These sit above your persona cards on the homepage too: a warning is never something you scroll to find.",
  "screen.places.title": "Places",
  "screen.places.blurb":
    "Current location plus saved favourites. Each row shows that city's own local sky, derived from its sunrise — not yours.",
  "screen.places.mapLoading": "Loading map",
  "screen.you.title": "Your personas",
  "screen.you.blurb":
    "Pick one to three. The homepage re-scores instantly — nothing here needs a save button. The order you pick them in sets each card's base score.",
  "screen.you.selected": "{n} of 3 selected",

  /* ---- you: settings ---- */
  "you.display": "Display",
  "you.language": "Language",
  "you.demo": "Demo controls",
  "you.demoNote":
    "Not shipped UI. In the app the sky is derived from IMD data and the location's own sunrise — these exist so the whole system can be reviewed without waiting for weather.",
  "you.arrange": "Arrange cards",
  "you.arrangeNote": "Reorder by hand. A manual order overrides the score until you clear it.",
  "you.flat": "Reduce transparency",
  "you.flatNote":
    "Drops the backdrop blur and raises fill opacity instead. Contrast is held; frame cost falls on low-end hardware.",
  "you.offline": "Simulate offline",
  "you.offlineNote": "Shows last-known data with its age, which is the required offline behaviour.",
  "you.skyOverridden": "Sky overridden",
  "you.nowShowing": "Now showing {tod}",

  /* ---- language picker ---- */
  "lang.title": "App language",
  "lang.note": "Applies everywhere immediately. Your choice is remembered on this device.",
  "lang.other": "Other languages",
  "lang.packTitle": "Language packs",
  "lang.packNote":
    "English and हिन्दी are built in. Every other language ships as a downloadable pack so the first install stays small — the whole point of this rebuild.",
  "lang.download": "Download",
  "lang.downloading": "Downloading…",
  "lang.notInBuild":
    "Not in this prototype build. English and हिन्दी are the two bundled languages; the pack mechanism is shown here rather than faked as a working download.",
  "lang.close": "Close",
  "lang.size": "{mb} MB",

  /* ---- hourly chart ---- */
  "chart.title": "Next 24 hours · {metric}",
  "chart.rain": "Rain",
  "chart.wind": "Wind",
  "chart.humidity": "Humidity",
  "chart.uv": "UV",
  "chart.peakNow": "Peaks at {v} right now.",
  "chart.peakAt": "Peaks at {v} around {time}.",
  "chart.noUv": "Peaks at {v} right now — no UV after dark.",

  /* ---- radar ---- */
  "radar.title": "Weather radar",
  "radar.close": "Close radar",
  "radar.layerGroup": "Radar layer",
  "radar.rain": "Rain",
  "radar.wind": "Wind",
  "radar.air": "Air quality",
  "radar.loading": "Loading radar…",
  "radar.unavailable": "Radar unavailable",
  "radar.live": "Live",
  "radar.rainDown": "RainViewer is unreachable right now.",
  "radar.windNeedsKey": "Needs a free OpenWeather key in VITE_OWM_KEY.",
  "radar.aqiCount": "{n} cities · US AQI",
  "radar.tier0": "Capitals and metros · zoom in for more cities",
  "radar.tier1": "Capitals and large cities · keep zooming for the rest",
  "radar.tier2": "All cities in view",
  "radar.failedBody":
    "The radar basemap could not load. Your saved places and their warnings are still available on the previous screen.",
  "radar.expand": "Open full radar",

  /* ---- personas ---- */
  "persona.health": "Health-conscious",
  "persona.fitness": "Outdoor fitness",
  "persona.beach": "Beachgoers & surfers",
  "persona.travel": "Travellers",
  "persona.family": "Parents & families",
  "persona.farm": "Farmers & gardeners",
  "persona.commute": "Commuters",
  "persona.event": "Event planners",

  /* ---- card titles ---- */
  "card.health.title": "Air & allergens",
  "card.fitness.title": "Best run window",
  "card.beach.title": "Sea & tide",
  "card.travel.title": "Saved destinations",
  "card.family.title": "School run",
  "card.farm.title": "Field conditions",
  "card.commute.title": "Commute watch",
  "card.event.title": "Comfort index",

  /* ---- card ledes ---- */
  "card.health.lede": "Continuous ambient monitoring from the nearest CPCB station.",
  "card.fitness.lede": "Hour-by-hour heat and UV load, scored for sustained outdoor effort.",
  "card.beach.lede": "Sea state and tide timings for the nearest coastal station.",
  "card.travel.lede":
    "Your saved destinations, checked against every active district, cyclone and flash-flood warning.",
  "card.family.lede": "The two windows that matter, taken from the district nowcast.",
  "card.farm.lede": "Field-scale rainfall, soil moisture and the current Agromet advisory.",
  "card.commute.lede": "Road-relevant conditions for the evening run home.",
  "card.event.lede": "Ten days of rain probability, scored into one comfort number.",

  /* ---- card body copy ---- */
  "card.fitness.note": "Coolest stretch before the sun clears the horizon.",
  "card.beach.noSwim": "Swimming not advised",
  "card.beach.caution": "Caution near the shore",
  "card.beach.calm": "Calm enough to swim",
  "card.beach.above": "above",
  "card.beach.below": "below",
  "card.beach.line": "{advice} — {side} the 2 m advisory line.",
  "card.beach.spring": "Spring tides this week, so the range is at its widest.",
  "card.beach.neap": "Neap tides this week, so the range is unusually narrow.",
  "card.beach.transitional": "Moon is {phase} at {pct}%, so the range is moderate.",
  "card.travel.packWet": "Pack for rain and delays",
  "card.travel.packDry": "Pack for warm, dry days",
  "card.travel.note": "{pack} — {warned} of {total} saved cities are under a warning.",
  "card.family.umbrella": "Send an umbrella.",
  "card.family.noUmbrella": "No umbrella needed.",
  "card.family.note": "{advice} Nowcast refreshes for your district every 15 minutes.",
  "card.commute.spray": "High spray and low visibility",
  "card.commute.reduced": "Reduced visibility",
  "card.commute.clear": "Clear roads",
  "card.commute.note": "{risk} on the 18:30 run home. {advisory}",
  "card.event.note": "Driest day in the outlook is {day} at {pct}% rain probability.",

  /* ---- units and readouts ---- */
  "unit.aqi": "AQI · {band}",
  "unit.mSwell": "m swell",
  "unit.mmNext24": "mm next 24 h",
  "unit.kmVisibility": "km visibility",
  "unit.comfort": "/ 100 comfort",
  "unit.kmh": "{v} km/h",
  "unit.to": "to {v}",
  "unit.pct": "{v}%",
  "band.good": "Good",
  "band.moderate": "Moderate",
  "band.severe": "Severe",

  /* ---- key-value labels on card bodies ---- */
  "kv.pm25": "PM2.5 µg/m³",
  "kv.pollen": "Pollen",
  "kv.humidity": "Humidity",
  "kv.peakUv": "Peak UV",
  "kv.wind": "Wind",
  "kv.feelsLike": "Feels like",
  "kv.nextHigh": "Next high · {m} m",
  "kv.lowTide": "Low tide",
  "kv.seaTemp": "Sea temp",
  "kv.gusting": "Gusting",
  "kv.waterlogging": "Waterlogging",
  "kv.soil": "Soil m³/m³ · {cat}",
  "kv.drop": "Drop 07:30",
  "kv.pickup": "Pick-up 14:45",
  "kv.rainChance": "rain chance",

  /* ---- detail sheet ---- */
  "sheet.close": "Close",
  "sheet.whyHeading": "Where this comes from",
  "sheet.sourceEnglish": "Source notes are kept in English — they quote IMD endpoint names and cache policy.",
  "sheet.advice": "What to do",
  "sheet.capEyebrow": "IMD CAP feed · {place}",

  /* ---- alert detail rows ---- */
  "row.colourCode": "Colour code",
  "row.alertType": "Alert type",
  "row.validUntil": "Valid until",
  "row.issuingOffice": "Issuing office",
  "row.district": "District",
  "row.system": "System",
  "row.landfall": "Forecast landfall",
  "row.trackFixes": "Track fixes held",

  /* ---- persona detail rows ---- */
  "row.aqi": "Air Quality Index",
  "row.pm25": "PM2.5",
  "row.pm10": "PM10",
  "row.pollenLoad": "Pollen load",
  "row.rh": "Relative humidity",
  "row.dewPoint": "Dew point",
  "row.bestWindow": "Best window",
  "row.peakUv": "Peak UV index",
  "row.feelsPeak": "Feels like (peak)",
  "row.heatIndex": "Heat index",
  "row.wind": "Wind",
  "row.sunrise": "Sunrise",
  "row.waveHeight": "Significant wave height",
  "row.nextHigh": "Next high tide",
  "row.nextLow": "Next low tide",
  "row.seaTemp": "Sea surface temp",
  "row.moonPhase": "Moon phase",
  "row.tideRegime": "Tide regime",
  "row.onshoreWind": "Onshore wind",
  "row.airport": "Departure airport",
  "row.runwayVis": "Runway visibility",
  "row.crosswind": "Crosswind",
  "row.terminal": "Terminal status",
  "row.morningDrop": "Morning drop 07:30",
  "row.afternoonPickup": "Afternoon pick-up 14:45",
  "row.windAtPickup": "Wind at pick-up",
  "row.visibility": "Visibility",
  "row.lightning": "Lightning risk",
  "row.rain24": "Rainfall next 24 h",
  "row.soilMoisture": "Soil moisture",
  "row.advisoryIssued": "Advisory issued",
  "row.frostRisk": "Frost risk",
  "row.waterlogging": "Waterlogging risk",
  "row.urbanAdvisory": "Urban advisory",
  "row.gustingTo": "Gusting to",
  "row.rain3h": "Rain in next 3 h",
  "row.comfortToday": "Comfort index today",
  "row.driestDay": "Driest day ahead",
  "row.lowestRain": "Lowest rain probability",
  "row.tourismOutlook": "Tourism outlook",
  "val.present": "Present",
  "val.noneReported": "None reported",
  "val.watch": "Watch",
  "val.none": "None",
  "val.noWarningShort": "no warning",

  /* ---- advisories ---- */
  "adv.umbrella": "Take an umbrella",
  "adv.umbrellaWhy": "Rain probability is {pct}% in the next few hours.",
  "adv.sunscreen": "Apply sunscreen",
  "adv.sunscreenWhy": "UV index peaks at {uv} — burn time is under 25 minutes at this level.",
  "adv.hydrate": "Carry water and pace yourself",
  "adv.hydrateWhy": "Feels-like reaches {v}°C, which is where heat illness starts.",
  "adv.mask": "Wear an N95 outdoors",
  "adv.maskWhy": "AQI is {aqi} ({band}) — above the level where a cloth mask stops helping.",
  "adv.windows": "Keep windows shut and run a purifier",
  "adv.windowsWhy": "PM2.5 is {pm} µg/m³ indoors follows outdoors within the hour.",
  "adv.fogLights": "Use fog lights and leave earlier",
  "adv.fogLightsWhy": "Visibility is down to {v} km, under the 3 km fog line.",
  "adv.avoidUnderpass": "Avoid underpasses and low roads",
  "adv.avoidUnderpassWhy": "Urban waterlogging risk is high for {place}.",
  "adv.indoors": "Get indoors and off open ground",
  "adv.indoorsWhy": "Lightning is reported in this district — vehicles and buildings are safe, open fields are not.",
  "adv.secure": "Secure loose items and charge devices",
  "adv.secureWhy": "{system} is forecast to make landfall {when}.",
  "adv.higherGround": "Move to higher ground if water rises",
  "adv.higherGroundWhy": "Flash flood guidance is active for {place} — these rise in minutes, not hours.",
  "adv.noSwim": "Stay out of the water",
  "adv.noSwimWhy": "Swell is {m} m, above the 2 m swim-advisory line.",
  "adv.frost": "Cover young plants tonight",
  "adv.frostWhy": "Temperature drops to {v}°C, inside frost range.",
  "adv.delayField": "Delay spraying and field work",
  "adv.delayFieldWhy": "{mm} mm of rain is expected in the next 24 hours.",
  "adv.schoolUmbrella": "Send an umbrella to school",
  "adv.schoolUmbrellaWhy": "Rain probability reaches {pct}% inside a school window.",
  "adv.none": "Nothing to act on right now",
  "adv.noneWhy": "No reading for {place} crosses an advisory threshold.",


  /* ---- CAP alert text, keyed by place.
     The English here must match data/seed.ts exactly; verify-tokens diffs the
     two so a reworded warning cannot silently leave the Hindi behind. ---- */
  "capText.mumbai.headline": "Orange warning · heavy to very heavy rainfall",
  "capText.mumbai.body":
    "Heavy to very heavy rainfall very likely at isolated places over Mumbai, Thane and Raigad districts.",
  "capText.delhi.headline": "Yellow warning · thunderstorm with lightning",
  "capText.delhi.body":
    "Thunderstorm accompanied by lightning and gusty winds reaching 40 km/h likely at isolated places.",
  "capText.kochi.headline": "Flash flood risk · Ernakulam and Idukki",
  "capText.kochi.body":
    "Moderate flash flood risk over parts of Ernakulam and Idukki following heavy rainfall in the preceding 24 hours.",
  "capText.vizag.headline": "Deep depression · north Andhra coast",
  "capText.vizag.body":
    "Deep depression over the west-central Bay of Bengal likely to cross between Kakinada and Visakhapatnam. Squally winds 55–65 km/h gusting to 75 km/h.",
  "capText.indore.headline": "Yellow warning · heavy rainfall",
  "capText.indore.body":
    "Heavy rainfall very likely at isolated places over Indore, Dewas and Ujjain districts.",

  /* ---- rules table ---- */
  "why.heading": "Why this card",
  "why.score": "score",

  /* ---- nav / map / skeleton chrome ---- */
  "nav.ariaSections": "Mausam sections",
  "nav.savedPlaces": "Saved places",
  "nav.offlineLastKnown": "Offline · last known",
  "nav.updated": "Updated {age}",
  "map.live": "OpenFreeMap · live",
  "map.offline": "Offline outline",
  "map.loading": "Loading map",
  "map.markerAria": "{name}, {temp} degrees",
  "skeleton.loading": "Loading your cards",
  "card.moveUp": "Move {label} up",
  "card.moveDown": "Move {label} down",

  /* ---- time-of-day derivation, shown so the choice is never mysterious ---- */
  "tod.reason.dawn": "Dawn — sun rose at {rise} IST in {place}",
  "tod.reason.day": "Day — between {rise} and {set} IST in {place}",
  "tod.reason.dusk": "Dusk — sun sets at {set} IST in {place}",
  "tod.reason.night": "Night — sun set at {set} IST in {place}",

  /* ---- card source lines ---- */
  "source.health": "CPCB · live",
  "source.health.fallback": "CPCB · seeded",
  "row.station": "Reporting station",
  "row.governing": "Governing pollutant",
  "row.stations": "Stations in city",
  "row.lastUpdate": "CPCB last update",
  "source.fitness": "IMD hourly · UV index",
  "source.beach": "INCOIS · IMD coastal",
  "source.travel": "IMD city forecast · CAP",
  "source.family": "IMD nowcast · district",
  "source.farm": "IMD subdivision · Agromet AAS",
  "source.commute": "IMD nowcast · urban met",
  "source.event": "IMD extended range · tourism",

  /* ---- why-this-card, assembled from parts so it can be reordered ---- */
  "explain.manual": "You moved {persona} to position {n} by hand, so the manual order wins over the score.",
  "explain.head": "{persona} is persona {rank} of {count}, worth ",
  "explain.boost": ". In {place} right now, {reason} — that adds ",
  "explain.for": ", for ",
  "explain.none": ". Nothing in {place}'s current readings trips an urgency threshold, so it stays at ",
  "explain.end": ".",

  /* ---- urgency boosts, each one threshold on one reading ---- */
  "boost.health.severe": "AQI is {aqi} ({cat}), past the 150 threshold",
  "boost.health.watch": "AQI is {aqi}, above the 100 watch line",
  "boost.fitness.heat": "feels-like hits {v}°C",
  "boost.fitness.uv": "UV index peaks at {uv}, so the safe window narrows",
  "boost.beach.wave": "wave height is {m} m, above the 2 m swim-advisory line",
  "boost.travel.one": "1 saved destination has an active warning",
  "boost.travel.many": "{n} saved destinations have an active warning",
  "boost.family.rain": "rain probability reaches {pct}% inside a school window",
  "boost.farm.rain": "{mm} mm expected in 24 h, enough to change field work",
  "boost.farm.soil": "soil moisture is down to {v} m³/m³",
  "boost.commute.fog": "visibility is down to {v} km, under the 3 km fog line",
  "boost.commute.water": "urban waterlogging risk is high for {place}",
  "boost.commute.vis": "visibility is {v} km",
  "boost.event.comfort": "comfort index is only {v}/100 today",
};

const hi: Dict = {
  /* ---- navigation ---- */
  "nav.home": "होम",
  "nav.alerts": "चेतावनियाँ",
  "nav.places": "स्थान",
  "nav.you": "आप",

  /* ---- chrome ---- */
  "brand.offline": "ऑफ़लाइन",
  "time.justNow": "अभी",
  "time.minAgo": "{n} मिनट पहले",
  "time.hAgo": "{n} घंटे पहले",
  "time.hmAgo": "{n} घंटे {m} मिनट पहले",
  "ptr.pull": "ताज़ा करने के लिए खींचें",
  "ptr.release": "ताज़ा करने के लिए छोड़ें",
  "ptr.loading": "ताज़ा किया जा रहा है…",

  /* ---- conditions ---- */
  "cond.clear": "साफ़",
  "cond.partly": "आंशिक बादल",
  "cond.overcast": "घने बादल",
  "cond.rain": "वर्षा",
  "cond.thunderstorm": "आँधी-तूफ़ान",
  "cond.fog": "कोहरा",
  "cond.snow": "हिमपात",

  /* ---- time of day ---- */
  "tod.dawn": "भोर",
  "tod.day": "दिन",
  "tod.dusk": "संध्या",
  "tod.night": "रात",

  /* ---- home ---- */
  "home.humidity": "आर्द्रता",
  "home.wind": "हवा",
  "home.visibility": "दृश्यता",
  "home.sunset": "सूर्यास्त",
  "home.feelsLike": "महसूस {v}°",
  "home.offline": "अंतिम ज्ञात डेटा — {age} अपडेट हुआ",
  "home.next24": "अगले 24 घंटे",
  "home.now": "अभी",
  "home.suppressedOne": "{names} कार्ड यहाँ छिपा है — {place} तटीय नहीं है, इसलिए पास कोई ज्वार स्टेशन नहीं है।",
  "home.suppressedMany": "{names} कार्ड यहाँ छिपे हैं — {place} तटीय नहीं है, इसलिए पास कोई ज्वार स्टेशन नहीं है।",

  /* ---- warnings ---- */
  "alert.kind.district": "ज़िला चेतावनी",
  "alert.kind.cyclone": "चक्रवात चेतावनी",
  "alert.kind.flash-flood": "आकस्मिक बाढ़ बुलेटिन",
  "alert.validTill": "{until} तक मान्य · {office}",
  "alert.none": "{place} के लिए कोई सक्रिय IMD चेतावनी नहीं। {age} जाँचा गया।",
  "alert.noWarning": "कोई चेतावनी नहीं",
  "level.green": "हरा",
  "level.yellow": "पीला",
  "level.orange": "नारंगी",
  "level.red": "लाल",

  /* ---- screens ---- */
  "screen.alerts.title": "चेतावनियाँ",
  "screen.alerts.blurb":
    "आपके सहेजे गए सभी स्थानों की हर CAP चेतावनी — ज़िला चेतावनी, चक्रवात बुलेटिन और आकस्मिक बाढ़ मार्गदर्शन, एक ही पार्सर से। ये होमपेज पर भी आपके कार्डों के ऊपर रहती हैं: चेतावनी ढूँढ़ने के लिए स्क्रॉल नहीं करना पड़ता।",
  "screen.places.title": "स्थान",
  "screen.places.blurb":
    "वर्तमान स्थान और सहेजे गए पसंदीदा। हर पंक्ति उस शहर का अपना आकाश दिखाती है, जो उसके सूर्योदय से तय होता है — आपके नहीं।",
  "screen.places.mapLoading": "मानचित्र लोड हो रहा है",
  "screen.you.title": "आपके व्यक्तित्व",
  "screen.you.blurb":
    "एक से तीन चुनें। होमपेज तुरंत दोबारा क्रम तय करता है — यहाँ सेव बटन की ज़रूरत नहीं। जिस क्रम में आप चुनते हैं, वही हर कार्ड का आधार अंक तय करता है।",
  "screen.you.selected": "3 में से {n} चुने गए",

  /* ---- you: settings ---- */
  "you.display": "प्रदर्शन",
  "you.language": "भाषा",
  "you.demo": "डेमो नियंत्रण",
  "you.demoNote":
    "यह शिप होने वाला UI नहीं है। ऐप में आकाश IMD डेटा और स्थान के अपने सूर्योदय से तय होता है — ये नियंत्रण इसलिए हैं ताकि मौसम बदलने का इंतज़ार किए बिना पूरा सिस्टम जाँचा जा सके।",
  "you.arrange": "कार्ड क्रम बदलें",
  "you.arrangeNote": "हाथ से क्रम बदलें। मैनुअल क्रम तब तक अंक पर भारी रहता है जब तक आप उसे हटा न दें।",
  "you.flat": "पारदर्शिता घटाएँ",
  "you.flatNote":
    "बैकड्रॉप ब्लर हटाकर भराव की अपारदर्शिता बढ़ाता है। कंट्रास्ट बना रहता है; कम क्षमता वाले फ़ोन पर फ़्रेम लागत घटती है।",
  "you.offline": "ऑफ़लाइन जैसा दिखाएँ",
  "you.offlineNote": "अंतिम ज्ञात डेटा उसकी आयु के साथ दिखाता है — यही अनिवार्य ऑफ़लाइन व्यवहार है।",
  "you.skyOverridden": "आकाश मैन्युअल रूप से तय",
  "you.nowShowing": "अभी {tod} दिख रहा है",

  /* ---- language picker ---- */
  "lang.title": "ऐप की भाषा",
  "lang.note": "हर जगह तुरंत लागू होता है। आपका चुनाव इसी डिवाइस पर याद रखा जाता है।",
  "lang.other": "अन्य भाषाएँ",
  "lang.packTitle": "भाषा पैक",
  "lang.packNote":
    "अंग्रेज़ी और हिन्दी ऐप में शामिल हैं। बाकी हर भाषा डाउनलोड करने योग्य पैक के रूप में आती है ताकि पहला इंस्टॉल हल्का रहे — इसी हल्केपन के लिए यह ऐप दोबारा बनाया गया है।",
  "lang.download": "डाउनलोड",
  "lang.downloading": "डाउनलोड हो रहा है…",
  "lang.notInBuild":
    "इस प्रोटोटाइप बिल्ड में उपलब्ध नहीं। अंग्रेज़ी और हिन्दी ही दो शामिल भाषाएँ हैं; पैक की व्यवस्था यहाँ दिखाई गई है, नकली डाउनलोड के रूप में नहीं।",
  "lang.close": "बंद करें",
  "lang.size": "{mb} MB",

  /* ---- hourly chart ---- */
  "chart.title": "अगले 24 घंटे · {metric}",
  "chart.rain": "वर्षा",
  "chart.wind": "हवा",
  "chart.humidity": "आर्द्रता",
  "chart.uv": "UV",
  "chart.peakNow": "अभी सर्वाधिक {v}।",
  "chart.peakAt": "{time} के आसपास सर्वाधिक {v}।",
  "chart.noUv": "अभी सर्वाधिक {v} — अंधेरे के बाद UV नहीं।",

  /* ---- radar ---- */
  "radar.title": "मौसम रडार",
  "radar.close": "रडार बंद करें",
  "radar.layerGroup": "रडार परत",
  "radar.rain": "वर्षा",
  "radar.wind": "हवा",
  "radar.air": "वायु गुणवत्ता",
  "radar.loading": "रडार लोड हो रहा है…",
  "radar.unavailable": "रडार उपलब्ध नहीं",
  "radar.live": "लाइव",
  "radar.rainDown": "RainViewer अभी उपलब्ध नहीं है।",
  "radar.windNeedsKey": "VITE_OWM_KEY में एक निःशुल्क OpenWeather कुंजी चाहिए।",
  "radar.aqiCount": "{n} शहर · US AQI",
  "radar.tier0": "राजधानियाँ और महानगर · और शहरों के लिए ज़ूम करें",
  "radar.tier1": "राजधानियाँ और बड़े शहर · बाकी के लिए और ज़ूम करें",
  "radar.tier2": "दृश्य के सभी शहर",
  "radar.failedBody":
    "रडार का बेसमैप लोड नहीं हो सका। आपके सहेजे गए स्थान और उनकी चेतावनियाँ पिछली स्क्रीन पर उपलब्ध हैं।",
  "radar.expand": "पूरा रडार खोलें",

  /* ---- personas ---- */
  "persona.health": "स्वास्थ्य-सजग",
  "persona.fitness": "बाहरी व्यायाम",
  "persona.beach": "समुद्र तट और सर्फ़र",
  "persona.travel": "यात्री",
  "persona.family": "माता-पिता और परिवार",
  "persona.farm": "किसान और बागवान",
  "persona.commute": "दैनिक यात्री",
  "persona.event": "आयोजक",

  /* ---- card titles ---- */
  "card.health.title": "हवा और एलर्जन",
  "card.fitness.title": "दौड़ने का सर्वोत्तम समय",
  "card.beach.title": "समुद्र और ज्वार",
  "card.travel.title": "सहेजे गए गंतव्य",
  "card.family.title": "स्कूल का समय",
  "card.farm.title": "खेत की स्थिति",
  "card.commute.title": "आवागमन निगरानी",
  "card.event.title": "आराम सूचकांक",

  /* ---- card ledes ---- */
  "card.health.lede": "निकटतम CPCB स्टेशन से लगातार परिवेशी निगरानी।",
  "card.fitness.lede": "घंटे-दर-घंटे गर्मी और UV भार, लगातार बाहरी परिश्रम के हिसाब से आँका गया।",
  "card.beach.lede": "निकटतम तटीय स्टेशन की समुद्री स्थिति और ज्वार समय।",
  "card.travel.lede":
    "आपके सहेजे गए गंतव्य, हर सक्रिय ज़िला, चक्रवात और आकस्मिक बाढ़ चेतावनी के विरुद्ध जाँचे गए।",
  "card.family.lede": "ज़िला नाउकास्ट से लिए गए वे दो समय जो मायने रखते हैं।",
  "card.farm.lede": "खेत-स्तर की वर्षा, मिट्टी की नमी और वर्तमान कृषि-मौसम सलाह।",
  "card.commute.lede": "शाम की वापसी यात्रा के लिए सड़क से जुड़ी स्थितियाँ।",
  "card.event.lede": "दस दिन की वर्षा संभावना, एक आराम अंक में समेटी गई।",

  /* ---- card body copy ---- */
  "card.fitness.note": "सूरज क्षितिज पार करने से पहले का सबसे ठंडा समय।",
  "card.beach.noSwim": "तैरने की सलाह नहीं",
  "card.beach.caution": "किनारे के पास सावधानी",
  "card.beach.calm": "तैरने के लिए पर्याप्त शांत",
  "card.beach.above": "ऊपर",
  "card.beach.below": "नीचे",
  "card.beach.line": "{advice} — 2 मी सलाह-रेखा से {side}।",
  "card.beach.spring": "इस सप्ताह वृहद ज्वार, इसलिए उतार-चढ़ाव सबसे अधिक है।",
  "card.beach.neap": "इस सप्ताह लघु ज्वार, इसलिए उतार-चढ़ाव असामान्य रूप से कम है।",
  "card.beach.transitional": "चंद्रमा {phase} है, {pct}% पर, इसलिए उतार-चढ़ाव मध्यम है।",
  "card.travel.packWet": "बारिश और देरी के लिए तैयारी करें",
  "card.travel.packDry": "गर्म, सूखे दिनों के लिए तैयारी करें",
  "card.travel.note": "{pack} — {total} में से {warned} सहेजे शहर चेतावनी में हैं।",
  "card.family.umbrella": "छाता भेजें।",
  "card.family.noUmbrella": "छाते की ज़रूरत नहीं।",
  "card.family.note": "{advice} नाउकास्ट आपके ज़िले के लिए हर 15 मिनट में ताज़ा होता है।",
  "card.commute.spray": "अधिक छींटे और कम दृश्यता",
  "card.commute.reduced": "घटी हुई दृश्यता",
  "card.commute.clear": "साफ़ सड़कें",
  "card.commute.note": "18:30 की वापसी पर {risk}। {advisory}",
  "card.event.note": "आगे का सबसे सूखा दिन {day} है, {pct}% वर्षा संभावना पर।",

  /* ---- units and readouts ---- */
  "unit.aqi": "AQI · {band}",
  "unit.mSwell": "मी लहर",
  "unit.mmNext24": "मिमी अगले 24 घं",
  "unit.kmVisibility": "किमी दृश्यता",
  "unit.comfort": "/ 100 आराम",
  "unit.kmh": "{v} किमी/घं",
  "unit.to": "{v} तक",
  "unit.pct": "{v}%",
  "band.good": "अच्छी",
  "band.moderate": "मध्यम",
  "band.severe": "गंभीर",

  /* ---- key-value labels on card bodies ---- */
  "kv.pm25": "PM2.5 µg/m³",
  "kv.pollen": "पराग",
  "kv.humidity": "आर्द्रता",
  "kv.peakUv": "अधिकतम UV",
  "kv.wind": "हवा",
  "kv.feelsLike": "महसूस",
  "kv.nextHigh": "अगला उच्च · {m} मी",
  "kv.lowTide": "निम्न ज्वार",
  "kv.seaTemp": "समुद्री तापमान",
  "kv.gusting": "झोंके",
  "kv.waterlogging": "जलभराव",
  "kv.soil": "मिट्टी मी³/मी³ · {cat}",
  "kv.drop": "छोड़ना 07:30",
  "kv.pickup": "लेना 14:45",
  "kv.rainChance": "वर्षा संभावना",

  /* ---- detail sheet ---- */
  "sheet.close": "बंद करें",
  "sheet.whyHeading": "यह कहाँ से आता है",
  "sheet.sourceEnglish": "स्रोत विवरण अंग्रेज़ी में रखे गए हैं — इनमें IMD एंडपॉइंट नाम और कैश नीति उद्धृत है।",
  "sheet.advice": "क्या करें",
  "sheet.capEyebrow": "IMD CAP फ़ीड · {place}",

  /* ---- alert detail rows ---- */
  "row.colourCode": "रंग कोड",
  "row.alertType": "चेतावनी प्रकार",
  "row.validUntil": "मान्य तक",
  "row.issuingOffice": "जारीकर्ता कार्यालय",
  "row.district": "ज़िला",
  "row.system": "सिस्टम",
  "row.landfall": "अनुमानित लैंडफ़ॉल",
  "row.trackFixes": "दर्ज पथ बिंदु",

  /* ---- persona detail rows ---- */
  "row.aqi": "वायु गुणवत्ता सूचकांक",
  "row.pm25": "PM2.5",
  "row.pm10": "PM10",
  "row.pollenLoad": "पराग भार",
  "row.rh": "सापेक्ष आर्द्रता",
  "row.dewPoint": "ओसांक",
  "row.bestWindow": "सर्वोत्तम समय",
  "row.peakUv": "अधिकतम UV सूचकांक",
  "row.feelsPeak": "महसूस (अधिकतम)",
  "row.heatIndex": "ऊष्मा सूचकांक",
  "row.wind": "हवा",
  "row.sunrise": "सूर्योदय",
  "row.waveHeight": "सार्थक लहर ऊँचाई",
  "row.nextHigh": "अगला उच्च ज्वार",
  "row.nextLow": "अगला निम्न ज्वार",
  "row.seaTemp": "समुद्र सतह तापमान",
  "row.moonPhase": "चंद्र कला",
  "row.tideRegime": "ज्वार प्रकार",
  "row.onshoreWind": "तटवर्ती हवा",
  "row.airport": "प्रस्थान हवाई अड्डा",
  "row.runwayVis": "रनवे दृश्यता",
  "row.crosswind": "पार्श्व हवा",
  "row.terminal": "टर्मिनल स्थिति",
  "row.morningDrop": "सुबह छोड़ना 07:30",
  "row.afternoonPickup": "दोपहर लेना 14:45",
  "row.windAtPickup": "लेने के समय हवा",
  "row.visibility": "दृश्यता",
  "row.lightning": "बिजली का ख़तरा",
  "row.rain24": "अगले 24 घंटे में वर्षा",
  "row.soilMoisture": "मिट्टी की नमी",
  "row.advisoryIssued": "सलाह जारी",
  "row.frostRisk": "पाला जोखिम",
  "row.waterlogging": "जलभराव जोखिम",
  "row.urbanAdvisory": "शहरी सलाह",
  "row.gustingTo": "झोंके तक",
  "row.rain3h": "अगले 3 घंटे में वर्षा",
  "row.comfortToday": "आज का आराम सूचकांक",
  "row.driestDay": "आगे का सबसे सूखा दिन",
  "row.lowestRain": "न्यूनतम वर्षा संभावना",
  "row.tourismOutlook": "पर्यटन पूर्वानुमान",
  "val.present": "मौजूद",
  "val.noneReported": "कोई रिपोर्ट नहीं",
  "val.watch": "निगरानी",
  "val.none": "कोई नहीं",
  "val.noWarningShort": "कोई चेतावनी नहीं",

  /* ---- advisories ---- */
  "adv.umbrella": "छाता साथ रखें",
  "adv.umbrellaWhy": "अगले कुछ घंटों में वर्षा की संभावना {pct}% है।",
  "adv.sunscreen": "सनस्क्रीन लगाएँ",
  "adv.sunscreenWhy": "UV सूचकांक {uv} तक पहुँचता है — इस स्तर पर त्वचा 25 मिनट से कम में झुलस सकती है।",
  "adv.hydrate": "पानी साथ रखें और गति धीमी रखें",
  "adv.hydrateWhy": "महसूस तापमान {v}°C तक पहुँचता है, जहाँ से लू का असर शुरू होता है।",
  "adv.mask": "बाहर N95 पहनें",
  "adv.maskWhy": "AQI {aqi} ({band}) है — इस स्तर पर कपड़े का मास्क काम नहीं करता।",
  "adv.windows": "खिड़कियाँ बंद रखें और प्यूरीफ़ायर चलाएँ",
  "adv.windowsWhy": "PM2.5 {pm} µg/m³ है; भीतर की हवा एक घंटे में बाहर जैसी हो जाती है।",
  "adv.fogLights": "फ़ॉग लाइट जलाएँ और जल्दी निकलें",
  "adv.fogLightsWhy": "दृश्यता {v} किमी रह गई है, 3 किमी कोहरा-रेखा से नीचे।",
  "adv.avoidUnderpass": "अंडरपास और नीची सड़कों से बचें",
  "adv.avoidUnderpassWhy": "{place} के लिए शहरी जलभराव का जोखिम अधिक है।",
  "adv.indoors": "भीतर जाएँ, खुले मैदान से हटें",
  "adv.indoorsWhy": "इस ज़िले में बिजली गिरने की सूचना है — वाहन और इमारतें सुरक्षित हैं, खुले खेत नहीं।",
  "adv.secure": "खुली चीज़ें बाँधें और डिवाइस चार्ज करें",
  "adv.secureWhy": "{system} का लैंडफ़ॉल {when} अनुमानित है।",
  "adv.higherGround": "पानी बढ़े तो ऊँची जगह जाएँ",
  "adv.higherGroundWhy": "{place} के लिए आकस्मिक बाढ़ मार्गदर्शन सक्रिय है — यह घंटों में नहीं, मिनटों में बढ़ती है।",
  "adv.noSwim": "पानी से दूर रहें",
  "adv.noSwimWhy": "लहर {m} मी है, 2 मी तैराकी सलाह-रेखा से ऊपर।",
  "adv.frost": "आज रात छोटे पौधे ढँक दें",
  "adv.frostWhy": "तापमान {v}°C तक गिरता है, जो पाले की सीमा में है।",
  "adv.delayField": "छिड़काव और खेत का काम टालें",
  "adv.delayFieldWhy": "अगले 24 घंटों में {mm} मिमी वर्षा अनुमानित है।",
  "adv.schoolUmbrella": "स्कूल के लिए छाता भेजें",
  "adv.schoolUmbrellaWhy": "स्कूल के समय के भीतर वर्षा संभावना {pct}% तक पहुँचती है।",
  "adv.none": "अभी कुछ करने की ज़रूरत नहीं",
  "adv.noneWhy": "{place} का कोई भी माप सलाह-सीमा पार नहीं करता।",


  /* ---- CAP alert text, keyed by place ---- */
  "capText.mumbai.headline": "नारंगी चेतावनी · भारी से अति भारी वर्षा",
  "capText.mumbai.body":
    "मुंबई, ठाणे और रायगढ़ ज़िलों में कुछ स्थानों पर भारी से अति भारी वर्षा की प्रबल संभावना है।",
  "capText.delhi.headline": "पीली चेतावनी · बिजली के साथ आंधी-तूफ़ान",
  "capText.delhi.body":
    "कुछ स्थानों पर बिजली और 40 किमी/घं तक की तेज़ हवाओं के साथ आंधी-तूफ़ान की संभावना है।",
  "capText.kochi.headline": "आकस्मिक बाढ़ का जोखिम · एर्णाकुलम और इडुक्की",
  "capText.kochi.body":
    "पिछले 24 घंटों की भारी वर्षा के बाद एर्णाकुलम और इडुक्की के कुछ भागों में आकस्मिक बाढ़ का मध्यम जोखिम है।",
  "capText.vizag.headline": "गहरा अवदाब · उत्तरी आंध्र तट",
  "capText.vizag.body":
    "पश्चिम-मध्य बंगाल की खाड़ी पर बना गहरा अवदाब काकिनाडा और विशाखापत्तनम के बीच तट पार कर सकता है। 55–65 किमी/घं की झोंकेदार हवाएँ, 75 किमी/घं तक।",
  "capText.indore.headline": "पीली चेतावनी · भारी वर्षा",
  "capText.indore.body":
    "इंदौर, देवास और उज्जैन ज़िलों में कुछ स्थानों पर भारी वर्षा की प्रबल संभावना है।",

  /* ---- rules table ---- */
  "why.heading": "यह कार्ड क्यों",
  "why.score": "अंक",

  /* ---- nav / map / skeleton chrome ---- */
  "nav.ariaSections": "मौसम अनुभाग",
  "nav.savedPlaces": "सहेजे गए स्थान",
  "nav.offlineLastKnown": "ऑफ़लाइन · अंतिम ज्ञात",
  "nav.updated": "{age} अपडेट हुआ",
  "map.live": "OpenFreeMap · लाइव",
  "map.offline": "ऑफ़लाइन रूपरेखा",
  "map.loading": "मानचित्र लोड हो रहा है",
  "map.markerAria": "{name}, {temp} डिग्री",
  "skeleton.loading": "आपके कार्ड लोड हो रहे हैं",
  "card.moveUp": "{label} को ऊपर ले जाएँ",
  "card.moveDown": "{label} को नीचे ले जाएँ",

  /* ---- time-of-day derivation ---- */
  "tod.reason.dawn": "भोर — {place} में सूर्योदय {rise} IST पर हुआ",
  "tod.reason.day": "दिन — {place} में {rise} और {set} IST के बीच",
  "tod.reason.dusk": "संध्या — {place} में सूर्यास्त {set} IST पर",
  "tod.reason.night": "रात — {place} में सूर्यास्त {set} IST पर हुआ",

  /* ---- card source lines ---- */
  "source.health": "CPCB · लाइव",
  "source.health.fallback": "CPCB · संग्रहीत",
  "row.station": "रिपोर्टिंग स्टेशन",
  "row.governing": "निर्धारक प्रदूषक",
  "row.stations": "शहर में स्टेशन",
  "row.lastUpdate": "CPCB अंतिम अपडेट",
  "source.fitness": "IMD घंटेवार · UV सूचकांक",
  "source.beach": "INCOIS · IMD तटीय",
  "source.travel": "IMD शहर पूर्वानुमान · CAP",
  "source.family": "IMD नाउकास्ट · ज़िला",
  "source.farm": "IMD उपसंभाग · कृषि-मौसम AAS",
  "source.commute": "IMD नाउकास्ट · शहरी मौसम",
  "source.event": "IMD विस्तारित परिसर · पर्यटन",

  /* ---- why-this-card ---- */
  "explain.manual": "आपने {persona} को हाथ से स्थान {n} पर रखा, इसलिए मैनुअल क्रम अंक पर भारी है।",
  "explain.head": "{persona} आपका {count} में से {rank}वाँ व्यक्तित्व है, मूल्य ",
  "explain.boost": "। {place} में अभी {reason} — इससे जुड़ता है ",
  "explain.for": ", कुल ",
  "explain.none": "। {place} के मौजूदा मापों में कोई तात्कालिकता सीमा पार नहीं होती, इसलिए यह बना रहता है ",
  "explain.end": "।",

  /* ---- urgency boosts ---- */
  "boost.health.severe": "AQI {aqi} ({cat}) है, 150 की सीमा के पार",
  "boost.health.watch": "AQI {aqi} है, 100 की निगरानी रेखा से ऊपर",
  "boost.fitness.heat": "महसूस तापमान {v}°C तक पहुँचता है",
  "boost.fitness.uv": "UV सूचकांक {uv} तक जाता है, इसलिए सुरक्षित समय घटता है",
  "boost.beach.wave": "लहर की ऊँचाई {m} मी है, 2 मी तैराकी सलाह-रेखा से ऊपर",
  "boost.travel.one": "1 सहेजे गंतव्य पर सक्रिय चेतावनी है",
  "boost.travel.many": "{n} सहेजे गंतव्यों पर सक्रिय चेतावनी है",
  "boost.family.rain": "स्कूल के समय के भीतर वर्षा संभावना {pct}% तक पहुँचती है",
  "boost.farm.rain": "24 घंटे में {mm} मिमी अनुमानित, जो खेत के काम को बदल देता है",
  "boost.farm.soil": "मिट्टी की नमी घटकर {v} मी³/मी³ रह गई है",
  "boost.commute.fog": "दृश्यता {v} किमी रह गई है, 3 किमी कोहरा-रेखा से नीचे",
  "boost.commute.water": "{place} के लिए शहरी जलभराव जोखिम अधिक है",
  "boost.commute.vis": "दृश्यता {v} किमी है",
  "boost.event.comfort": "आराम सूचकांक आज केवल {v}/100 है",
};

export const DICT: Record<Lang, Dict> = { en, hi };
