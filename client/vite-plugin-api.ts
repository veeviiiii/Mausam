import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * Serves the /api routes in `vite dev`.
 *
 * Vercel runs client/api/*.ts as functions in production; nothing runs them
 * locally. Without this you develop against a 404 and only find out the route
 * is wrong after a deploy — which is how the last Vercel misconfiguration in
 * this project got found.
 *
 * The handler module is imported through Vite's own SSR loader, so it is the
 * same TypeScript file Vercel builds, transpiled on demand and hot-reloaded on
 * edit. No second copy of the logic.
 *
 * NOT `vite preview`, despite what this comment used to claim. Only
 * configureServer is implemented below, and the hook preview would need,
 * configurePreviewServer, has no ssrLoadModule to reach for — the preview
 * server serves built files and runs no module graph, so there is nothing there
 * that can transpile a .ts handler on demand. `npm run preview` therefore gets
 * a 404 on /api and the app falls back to its seeded data, which is a correct
 * and deliberately supported state rather than a break.
 *
 * If live data against a production build is ever needed locally, the honest
 * options are to build the routes to JS first and serve those, or to point the
 * client's API base at the deployed Vercel origin. Do not quietly re-add the
 * claim to this comment without implementing one of them.
 */
export function devApi(): Plugin {
  return {
    name: "mausam-dev-api",
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        const path = (req.url ?? "").split("?")[0];
        if (!path.startsWith("/api/")) return next();

        const name = path.slice("/api/".length).replace(/[^a-z0-9-]/gi, "");
        if (!name) return next();

        try {
          const mod = await server.ssrLoadModule(`/api/${name}.ts`);
          const handler = mod.default as (
            q: IncomingMessage,
            s: ServerResponse,
          ) => Promise<void> | void;
          if (typeof handler !== "function") return next();
          await handler(req, res);
        } catch (err) {
          // A dev-only route blowing up should say so in the response, not
          // vanish into the terminal while the browser sees Vite's index.html.
          server.config.logger.error(`[dev-api] /api/${name} failed: ${(err as Error).message}`);
          res.statusCode = 500;
          res.setHeader("content-type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ ok: false, reason: (err as Error).message }));
        }
      });
    },
  };
}
