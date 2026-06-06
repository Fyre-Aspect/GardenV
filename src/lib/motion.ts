import type { Transition, Variants } from 'framer-motion';

// Calm, premium cubic-bezier easing (gentle ease-out) used for entrances.
export const easeOut = [0.22, 1, 0.36, 1] as const;

/**
 * Shared motion vocabulary. Keeping durations, easings and variants in one place
 * keeps the whole app feeling consistent and intentional rather than each
 * component inventing its own timing. Components should prefer these over
 * ad-hoc inline transitions.
 *
 * For reduced-motion, use framer-motion's `useReducedMotion()` in the component
 * and fall back to `fadeOnly` / skip transforms. globals.css also clamps
 * animation/transition durations as a platform-level safety net.
 */

// Restrained spring for interactive press/hover feedback.
export const springSoft: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 26,
};

export const springSnappy: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 24,
};

/** Container that staggers its children into view. */
export const stagger: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.02 },
  },
};

/** Standard entrance: small rise + fade. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeOut },
  },
};

/** Entrance with no transform — the reduced-motion fallback. */
export const fadeOnly: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
};

/** Scale+fade for emphasis moments (CTAs, celebrations). */
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: easeOut } },
};

/** Standard whileInView config so sections reveal once, partway up the viewport. */
export const inView = {
  initial: 'hidden' as const,
  whileInView: 'show' as const,
  viewport: { once: true, amount: 0.2 },
};
