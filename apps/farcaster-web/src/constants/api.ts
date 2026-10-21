import { isProd } from '~/constants/env';

// Dev-only escape hatch: persist `farcasterApi.local` in localStorage to
// flip the API base from prod (`farcaster.xyz/~api`) to a backend running
// on `localhost:8080`. Use the helper from `init/initFarcasterApi.ts` —
// don't poke localStorage directly.
const STORAGE_KEY = 'farcasterApi.local';

function isLocalApiEnabled(): boolean {
  if (isProd) {
    return false;
  }
  if (typeof window === 'undefined') {
    return false;
  }
  return window.localStorage.getItem(STORAGE_KEY) === 'true';
}

const useLocalApi = isLocalApiEnabled();

// Build with `VITE_SAME_ORIGIN_API=true` when the site is served by a Worker
// that proxies the API at `/~api` and the stream at `/stream` (the API's CORS
// only allows Farcaster's own origins).
const useSameOriginApi =
  !useLocalApi &&
  import.meta.env.VITE_SAME_ORIGIN_API === 'true' &&
  typeof window !== 'undefined';

const baseApiHost = useLocalApi
  ? 'localhost:8080'
  : useSameOriginApi
    ? `${window.location.host}/~api`
    : 'farcaster.xyz/~api';

const baseUseHttps = useSameOriginApi
  ? window.location.protocol === 'https:'
  : !useLocalApi;

const baseApiUrl = baseUseHttps
  ? `https://${baseApiHost}`
  : `http://${baseApiHost}`;

const wsUrl = useLocalApi
  ? `ws://${baseApiHost}/stream`
  : useSameOriginApi
    ? `${baseUseHttps ? 'wss' : 'ws'}://${window.location.host}/stream`
    : 'wss://ws.farcaster.xyz/stream';

export { baseApiHost, baseApiUrl, baseUseHttps, STORAGE_KEY, wsUrl };
