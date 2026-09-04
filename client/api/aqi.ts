import type { IncomingMessage, ServerResponse } from "node:http";
import { cityAqi } from "./_cpcb";

/**
 * GET /api/aqi?city=Mumbai
 *
 * The only server this prototype has, and the only one it needs today. CPCB
 * via data.gov.in is the fast path CLAUDE.md calls out: no IP whitelisting, so
 * it can go live from any host, unlike IMD's own APIs which need a static IP
 * on an approved list.
 *
 * Deployed as a Vercel function (client/api/ is picked up automatically with
 * Root Directory = client) and served in dev by the same handler through a
 * Vite middleware — see vite-plugin-api.ts. One code path, so a route that
 * works locally is the route that ships.
 *
 * Never 500s on an upstream problem. The client's contract is "live figure if
 * there is one, otherwise say why and keep the seeded value", so a failure is
 * a 200 with ok:false. A 500 here would turn a degraded reading into a broken
 * screen, which is the exact failure mode this project exists to avoid.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Parsed from the URL rather than a framework-supplied req.query, so the
  // handler behaves identically under Vercel and under the dev middleware.
  const url = new URL(req.url ?? "/", "http://localhost");
  const city = url.searchParams.get("city")?.trim();

  res.setHeader("content-type", "application/json; charset=utf-8");

  if (!city) {
    res.statusCode = 400;
    res.end(JSON.stringify({ ok: false, reason: "missing ?city" }));
    return;
  }

  const apiKey = process.env.DATA_GOV_KEY;
  if (!apiKey) {
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        ok: false,
        reason: "DATA_GOV_KEY is not set on the server — see client/.env.example",
      }),
    );
    return;
  }

  const result = await cityAqi(city, apiKey);

  // Matches the upstream cadence: CPCB publishes hourly, and a stale-while-
  // revalidate window means an edge miss never blocks a render.
  res.setHeader("cache-control", "public, max-age=900, stale-while-revalidate=3600");
  res.statusCode = 200;
  res.end(JSON.stringify(result));
}
