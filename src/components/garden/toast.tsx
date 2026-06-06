'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { springSnappy } from '@/lib/motion';

export interface ToastState {
  id: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Single, app-wide toast surface. Controlled by the parent (which owns timing).
 * Used for the XP pop and task-completion + undo affordance.
 */
export function Toast({
  toast,
  onAction,
}: {
  toast: ToastState | null;
  onAction: () => void;
}) {
  const reduce = useReducedMotion();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.9 }}
            transition={reduce ? { duration: 0.15 } : springSnappy}
            className="pointer-events-auto flex items-center gap-3 rounded-full bg-foreground px-5 py-2.5 text-sm font-bold text-background shadow-lg"
          >
            <span>{toast.message}</span>
            {toast.actionLabel && (
              <button
                onClick={onAction}
                className="rounded-full bg-background/15 px-2.5 py-0.5 text-xs font-bold text-background underline-offset-2 transition-colors hover:bg-background/25"
              >
                {toast.actionLabel}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
