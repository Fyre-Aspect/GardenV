'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useGarden } from '@/components/garden-provider';
import { Button } from '@/components/ui/button';

/**
 * Tasteful level-up moment. A soft scrim + card with a single restrained accent
 * burst — celebratory but not confetti spam. Triggered by the provider's
 * `justLeveledUp` flag and dismissed back through it.
 */
export function LevelUpCelebration() {
  const { justLeveledUp, acknowledgeLevelUp } = useGarden();
  const reduce = useReducedMotion();
  const open = justLeveledUp !== null;

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
            onClick={acknowledgeLevelUp}
            className="absolute inset-0 bg-foreground/45 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-label={`Level ${justLeveledUp} reached`}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            className="relative w-full max-w-xs rounded-3xl border border-border bg-card p-8 text-center shadow-2xl"
          >
            <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
              {!reduce &&
                [0, 1, 2, 3, 4, 5].map((i) => (
                  <motion.span
                    key={i}
                    className="absolute h-1.5 w-1.5 rounded-full bg-reward"
                    initial={{ opacity: 0, x: 0, y: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      x: Math.cos((i / 6) * Math.PI * 2) * 46,
                      y: Math.sin((i / 6) * Math.PI * 2) * 46,
                    }}
                    transition={{ duration: 0.9, delay: 0.1, ease: 'easeOut' }}
                  />
                ))}
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-accent text-primary">
                <Sparkles className="h-9 w-9" strokeWidth={1.75} />
              </div>
            </div>

            <div className="text-xs font-black uppercase tracking-wider text-primary">
              Level up
            </div>
            <div className="mt-1 text-3xl font-black tracking-tight text-foreground">
              Level {justLeveledUp}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Your green thumb is growing. Keep the streak alive.
            </p>

            <Button className="mt-6 w-full" onClick={acknowledgeLevelUp}>
              Nice
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
