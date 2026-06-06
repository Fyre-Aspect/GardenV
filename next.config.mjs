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
