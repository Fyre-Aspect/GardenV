import { Droplet, Sprout, Sun, type LucideIcon } from 'lucide-react';
import type { CareType } from '@/lib/data';

/** Line icon for each care action (water / fertilize / light). */
export const CARE_ICON: Record<CareType, LucideIcon> = {
  water: Droplet,
  fertilize: Sprout,
  light: Sun,
};
