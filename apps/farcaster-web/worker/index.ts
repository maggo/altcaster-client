// Cloudflare Worker for the hosted web client (see wrangler.jsonc). It serves
// the production build and passes the API (`/~api/*`) and the live-update
// socket (`/stream`) straight through to Farcaster on the same origin, since
// the API's CORS only allows Farcaster's own origins. Pair it with a build made
// with `VITE_SAME_ORIGIN_API=true` (`pnpm deploy:cloudflare` does both).

type Env = {
  ASSETS: { fetch: (req: Request) => Promise<Response> };
  API_URL: string;
  STREAM_URL: string;
};

const API_PREFIX = '/~api';

// Headers describing the hop into this Worker, not the client's request. They
// (and all cf-* headers) are dropped so the user's IP isn't passed on.
const STRIP_REQUEST = new Set([
  'host',
  'content-length',
  'x-real-ip',
  'x-forwarded-for',
  'x-forwarded-proto',
  'x-forwarded-host',
]);

function forwardHeaders(req: Request): Headers {
  const headers = new Headers();
  req.headers.forEach((value, name) => {
    if (!STRIP_REQUEST.has(name) && !name.startsWith('cf-')) {
      headers.append(name, value);
    }
  });
  return headers;
}

// Workers load the handler from the module's default export.
// eslint-disable-next-line import/no-default-export
export default {
  fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname.startsWith(`${API_PREFIX}/`)) {
      const path = url.pathname.slice(API_PREFIX.length);
      return fetch(env.API_URL + path + url.search, {
        method: req.method,
        headers: forwardHeaders(req),
        body: req.body,
        redirect: 'manual',
      });
    }
    // A plain fetch, returned as-is: Workers pipes a WebSocket upgrade through.
    if (url.pathname === '/stream') {
      return fetch(env.STREAM_URL + url.pathname + url.search, {
        headers: forwardHeaders(req),
      });
    }
    return env.ASSETS.fetch(req);
  },
};
