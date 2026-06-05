import type { Timestamp } from 'firebase/firestore';

export interface Plant {
  id: string;
  userId: string;
  name: string;
  species: string;
  photoURL: string;
  createdAt: Timestamp;
  careProfile: CareProfile;
  lastScan: ScanResult | null;
  nextActions: ScheduledAction[];
}

export interface CareProfile {
  wateringIntervalDays: number;
  fertilizingIntervalDays: number;
  lightRequirement: 'low' | 'medium' | 'bright';
}

export interface ScanResult {
  scannedAt: Timestamp;
  healthScore: number;
  issues: Issue[];
  recommendations: string[];
}

export interface Issue {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface ScheduledAction {
  type: 'water' | 'fertilize' | 'treat';
  dueAt: Timestamp;
  notes?: string;
}
