export interface Wine {
  id: string;
  name: string;
  year: number;
  region: string;
  appellation: string;
  type: string;
  grapes: string;
  avgPrice: number;
  description: string;
  intensity: number;
  aroma: number;
  sweetness: number;
}

export interface UserProfile {
  frequency?: string;
  expertise?: string;
  budget?: string;
  types?: string[];
  sweetness?: number;
  aroma?: number;
  body?: number;
  regions?: string[];
  occasions?: string[];
  food?: string[];
  buyWhere?: string;
  firstName?: string;
  email?: string;
}

export interface ScanResult {
  wine: Wine;
  score: number;
  explanation: string;
  savedAt?: string;
}

