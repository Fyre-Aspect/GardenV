'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useGarden } from '@/components/garden-provider';
import { Button } from '@/components/ui/button';

/**
 * Streak-milestone moment. Bigger and more celebratory than the level-up card —
 * a confetti burst plus a streak badge. Triggered by the provider's
 * `justHitStreak` flag (set when the streak hits 3/7/10/14/30/…) and dismissed
 * through it. A 7-day streak gets special "perfect week" treatment.
 */

const CONFETTI_COLORS = ['#2d5a27', '#eab64c', '#38bdf8', '#fb7185', '#a3e635', '#f59e0b'];

function headline(streak: number): { eyebrow: string; title: string; note: string } {
  if (streak === 7)
    return {
      eyebrow: 'Perfect week',
      title: '7-day streak!',
      note: 'Seven days in a row — your companions are flourishing.',
    };
  if (streak >= 100)
    return {
      eyebrow: 'Legendary',
      title: `${streak}-day streak!`,
      note: 'Incredible dedication. You never miss a day.',
    };
  if (streak >= 30)
    return {
      eyebrow: 'On fire',
      title: `${streak}-day streak!`,
      note: 'A whole month of showing up. Remarkable.',
    };
  return {
    eyebrow: 'Streak milestone',
    title: `${streak}-day streak!`,
    note: 'Consistency is everything. Keep it going.',
  };
}

export function MilestoneCelebration() {
  const { justHitStreak, acknowledgeStreak } = useGarden();
  const reduce = useReducedMotion();
  const open = justHitStreak !== null;
  const streak = justHitStreak ?? 0;
  const copy = headline(streak);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            aria-label="Dismiss"
            onClick={acknowledgeStreak}
            className="absolute inset-0 bg-foreground/45 backdrop-blur-sm"
          />

          {/* Confetti burst */}
          {!reduce && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {Array.from({ length: 28 }).map((_, i) => {
                const angle = (i / 28) * Math.PI * 2;
                const dist = 160 + (i % 5) * 36;
                return (
                  <motion.span
                    key={i}
                    className="absolute left-1/2 top-1/2 h-2.5 w-2.5 rounded-[2px]"
                    style={{ backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length] }}
                    initial={{ opacity: 0, x: 0, y: 0, rotate: 0 }}
                    animate={{
                      opacity: [0, 1, 1, 0],
                      x: Math.cos(angle) * dist,
                      y: Math.sin(angle) * dist + 120, // gravity drift
                      rotate: 360 + i * 12,
                    }}
                    transition={{ duration: 1.6, delay: 0.05, ease: 'easeOut' }}
                  />
                );
              })}
            </div>
          )}

          <motion.div
            role="dialog"
            aria-label={copy.title}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.85, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="relative w-full max-w-xs rounded-3xl border border-border bg-card p-8 text-center shadow-2xl"
          >
            <motion.div
              initial={reduce ? undefined : { scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.1 }}
              className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-reward-soft"
            >
              <div className="text-center leading-none">
                <div className="text-4xl font-black text-reward-foreground">{streak}</div>
                <div className="text-[10px] font-black uppercase tracking-wider text-reward-foreground/70">
                  days
                </div>
              </div>
            </motion.div>

            <div className="flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {copy.eyebrow}
            </div>
            <div className="mt-1 text-2xl font-black tracking-tight text-foreground">
              {copy.title}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy.note}</p>

            <Button className="mt-6 w-full" onClick={acknowledgeStreak}>
              Keep going
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
