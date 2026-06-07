'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { easeOut } from '@/lib/motion';

/**
 * A small "plant growing" loading animation, on-brand with the rest of Kindred.
 * A sprout pushes up out of the soil, leaves unfurl, and a bud opens — then the
 * whole thing sways gently while you wait. Used as the app's loading screen
 * (sign-in, route guards, the 3D scene boot).
 *
 * Under reduced-motion it renders the fully-grown plant, statically.
 */

const SOIL = '#c98a63';
const SOIL_TOP = '#b5764f';
const STEM = '#2d5a27';
const LEAF = '#3c7233';
const BUD = '#eab64c';

/** A leaf that scales up from its base, nested in a static translate/rotate. */
function GrowLeaf({
  x,
  y,
  rot,
  delay,
  reduce,
}: {
  x: number;
  y: number;
  rot: number;
  delay: number;
  reduce: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <motion.g
        style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
        initial={reduce ? false : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={reduce ? { duration: 0 } : { duration: 0.5, delay, ease: easeOut }}
      >
        {/* base at (0,0), tip up the -Y axis */}
        <path d="M0,0 C13,-5 15,-22 0,-32 C-15,-22 -13,-5 0,0 Z" fill={LEAF} />
      </motion.g>
    </g>
  );
}

function LoaderDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1 w-1 rounded-full bg-current"
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
        />
      ))}
    </span>
  );
}

export function PlantLoader({
  label,
  className,
}: {
  label?: string;
  className?: string;
}) {
  const reduce = useReducedMotion() ?? false;

  return (
    <div className={`flex flex-col items-center gap-4 ${className ?? ''}`}>
      <div className="relative">
        {/* Pulsing glow */}
        <motion.div
          className="absolute inset-0 -z-10 rounded-full bg-primary/15 blur-2xl"
          animate={reduce ? undefined : { scale: [0.85, 1.1, 0.85], opacity: [0.4, 0.75, 0.4] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Sway the whole sprout once it's grown (HTML wrapper = reliable origin). */}
        <motion.div
          style={{ transformOrigin: '50% 92%' }}
          animate={reduce ? undefined : { rotate: [-2.5, 2.5, -2.5] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 1.1 }}
        >
          <svg width="112" height="112" viewBox="0 0 140 140" aria-hidden="true">
            {/* Stem grows first */}
            <motion.path
              d="M70,122 C66,98 75,76 70,46"
              stroke={STEM}
              strokeWidth={5}
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: reduce ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={reduce ? { duration: 0 } : { duration: 0.7, delay: 0.1, ease: easeOut }}
            />

            {/* Leaves unfurl */}
            <GrowLeaf x={70} y={96} rot={-38} delay={0.5} reduce={reduce} />
            <GrowLeaf x={69} y={74} rot={40} delay={0.72} reduce={reduce} />

            {/* Bud opens last */}
            <motion.circle
              cx={70}
              cy={44}
              r={9}
              fill={BUD}
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
              initial={reduce ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={reduce ? { duration: 0 } : { duration: 0.45, delay: 1.0, ease: easeOut }}
            />

            {/* Soil */}
            <ellipse cx={70} cy={124} rx={34} ry={8} fill={SOIL} />
            <ellipse cx={70} cy={121} rx={28} ry={5} fill={SOIL_TOP} />
          </svg>
        </motion.div>

        {/* Rising growth specks */}
        {!reduce &&
          [
            { x: 'left-3', d: 0 },
            { x: 'right-4', d: 0.9 },
            { x: 'left-8', d: 1.6 },
          ].map((s) => (
            <motion.span
              key={s.x}
              className={`absolute bottom-8 ${s.x} h-1.5 w-1.5 rounded-full bg-primary/40`}
              animate={{ y: [0, -28], opacity: [0, 0.9, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, delay: s.d, ease: 'easeOut' }}
            />
          ))}
      </div>

      {label && (
        <p className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
          {label}
          <LoaderDots />
        </p>
      )}
    </div>
  );
}
