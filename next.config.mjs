import withPWAInit from '@ducanh2912/next-pwa';

/**
 * PWA setup (next-pwa / Workbox).
 *
 * - Disabled in dev so the service worker doesn't cache stale code while
 *   iterating; enabled for production builds.
 * - `register` + `skipWaiting` so a new SW activates promptly after deploy.
 * - A network-first fallback for navigations means the app still opens (from
 *   cache) when offline, while Firestore's own offline cache handles data.
 */
const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  reloadOnOnline: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  // The 3D plant model (red_rose.glb) is ~37 MB. Precaching it would block the
  // service worker from activating until that whole file downloads — a brutal
  // first-run on mobile/cellular and needless cache bloat. Keep it out of the
  // precache; it loads from the network on demand when the 3D scene mounts, and
  // next-pwa's default same-origin "pages" NetworkFirst rule still caches it at
  // runtime on first load (so repeat/offline visits work) without gating
  // activation on it. (Don't set `runtimeCaching` here — doing so would replace
  // next-pwa's entire default cache list and break the app-shell offline.)
  publicExcludes: ['!*.glb'],
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withPWA(nextConfig);
