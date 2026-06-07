import {
  Bone,
  Droplet,
  Leaf,
  PawPrint,
  Sprout,
  Sun,
  type LucideIcon,
} from 'lucide-react';
import type { CareType, Kind } from '@/lib/data';

/** Line icon for each care action. */
export const CARE_ICON: Record<CareType, LucideIcon> = {
  water: Droplet,
  fertilize: Sprout,
  light: Sun,
  feed: Bone,
};

/** Icon representing a companion's kind (plant vs pet). */
export const KIND_ICON: Record<Kind, LucideIcon> = {
  plant: Leaf,
  pet: PawPrint,
};
