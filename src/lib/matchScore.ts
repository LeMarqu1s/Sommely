import { WineAnalysis } from './openai';

interface UserProfile {
  types?: string[];
  budget?: string;
  body?: number;
  aroma?: number;
  sweetness?: number;
  regions?: string[];
  expertise?: string;
  occasions?: string[];
}

interface ScoreBreakdown {
  total: number;
  typeMatch: number;
  budgetMatch: number;
  intensityMatch: number;
  aromaMatch: number;
  sweetnessMatch: number;
  regionBonus: number;
  explanation: string[];
}

const BUDGET_RANGES: Record<string, [number, number]> = {
  low: [0, 10],
  medium: [10, 20],
  high: [20, 45],
  premium: [45, 999],
};

const TYPE_MAPPING: Record<string, string[]> = {
  red_bold: ['Rouge', 'Rouge corse', 'Rouge puissant'],
  red_light: ['Rouge fruité', 'Rouge léger'],
  white_dry: ['Blanc', 'Blanc sec'],
  white_sweet: ['Blanc liquoreux', 'Blanc doux'],
  rose: ['Rosé'],
  champagne: ['Champagne', 'Pétillant'],
};

const REGION_MAPPING: Record<string, string[]> = {
  bordeaux: ['Bordeaux', 'Medoc', 'Pauillac', 'Margaux', 'Saint-Emilion', 'Pomerol'],
  bourgogne: ['Bourgogne', 'Beaune', 'Meursault', 'Chablis', 'Gevrey-Chambertin'],
  champagne: ['Champagne', 'Reims'],
  rhone: ['Rhone', 'Chateauneuf', 'Gigondas', 'Cotes du Rhone'],
  loire: ['Loire', 'Sancerre', 'Pouilly-Fume', 'Muscadet'],
};

export function calculatePersonalizedScore(
  wine: WineAnalysis,
  enrichedData: Record<string, unknown>,
  userProfile: UserProfile | null
): ScoreBreakdown {
  if (!userProfile) {
    const baseScore = Math.floor(Math.random() * 25) + 65;
    return {
      total: baseScore,
      typeMatch: 0, budgetMatch: 0, intensityMatch: 0,
      aromaMatch: 0, sweetnessMatch: 0, regionBonus: 0,
      explanation: ['Complétez votre profil pour obtenir un score 100% personnalisé.'],
    };
  }

  let score = 40;
  const explanation: string[] = [];
  let typeMatch = 0, budgetMatch = 0, intensityMatch = 0;
  let aromaMatch = 0, sweetnessMatch = 0, regionBonus = 0;

  // 1. MATCH TYPE DE VIN (25 points max)
  if (userProfile.types && wine.type) {
    for (const pref of userProfile.types) {
      const mappedTypes = TYPE_MAPPING[pref] || [];
      if (mappedTypes.some(t => wine.type!.toLowerCase().includes(t.toLowerCase()))) {
        typeMatch = 25;
        explanation.push('Ce type de vin correspond parfaitement à vos préférences.');
        break;
      }
    }
    if (typeMatch === 0) {
      explanation.push('Ce type de vin ne fait pas partie de vos préférences habituelles.');
    }
  }
  score += typeMatch;

  // 2. MATCH BUDGET (15 points max)
  if (userProfile.budget && enrichedData.avgPrice !== undefined) {
    const [min, max] = BUDGET_RANGES[userProfile.budget] || [0, 999];
    const price = enrichedData.avgPrice as number;
    if (price >= min && price <= max) {
      budgetMatch = 15;
      explanation.push('Le prix correspond à votre budget habituel.');
    } else if (price > max) {
      budgetMatch = Math.max(0, 15 - Math.floor((price - max) / 10) * 5);
      if (budgetMatch < 10) explanation.push('Ce vin est un peu au-dessus de votre budget habituel.');
    } else {
      budgetMatch = 10;
      explanation.push('Ce vin est dans votre budget.');
    }
  }
  score += budgetMatch;

  // 3. MATCH INTENSITE/CORPS (10 points max) — body: 0–10, intensity: 0–100
  if (userProfile.body !== undefined && enrichedData.intensity !== undefined) {
    const bodyScaled = userProfile.body * 10; // 0–10 → 0–100
    const diff = Math.abs((enrichedData.intensity as number) - bodyScaled);
    intensityMatch = Math.max(0, Math.round(10 - (diff / 15)));
    if (intensityMatch >= 8) explanation.push('L\'intensité de ce vin correspond à ce que vous aimez.');
  }
  score += intensityMatch;

  // 4. MATCH AROME (10 points max)
  if (userProfile.aroma !== undefined && enrichedData.aroma !== undefined) {
    const diff = Math.abs((enrichedData.aroma as number) - userProfile.aroma);
    aromaMatch = Math.max(0, Math.round(10 - (diff / 10)));
  }
  score += aromaMatch;

  // 5. MATCH SUCROSITE (5 points max)
  if (userProfile.sweetness !== undefined && enrichedData.sweetness !== undefined) {
    const diff = Math.abs((enrichedData.sweetness as number) - userProfile.sweetness);
    sweetnessMatch = Math.max(0, Math.round(5 - (diff / 20)));
  }
  score += sweetnessMatch;

  // 6. BONUS REGION CONNUE (5 points)
  if (userProfile.regions && wine.region) {
    for (const prefRegion of userProfile.regions) {
      const mappedRegions = REGION_MAPPING[prefRegion] || [];
      if (mappedRegions.some(r => wine.region!.toLowerCase().includes(r.toLowerCase()))) {
        regionBonus = 5;
        explanation.push('Vous connaissez déjà cette région, un bon signe !');
        break;
      }
    }
  }
  score += regionBonus;

  // Ajustement selon niveau expertise
  if (userProfile.expertise === 'beginner') {
    if ((enrichedData.avgPrice as number) > 30) score = Math.min(score, 75);
  } else if (userProfile.expertise === 'expert') {
    if ((enrichedData.avgPrice as number) < 10) score = Math.min(score, 70);
  }

  // Ajouter explication si manquante
  if (explanation.length === 0) {
    explanation.push('Ce vin a été évalué selon vos préférences personnelles.');
  }

  const total = Math.min(100, Math.max(0, Math.round(score)));

  return { total, typeMatch, budgetMatch, intensityMatch, aromaMatch, sweetnessMatch, regionBonus, explanation };
}

export function generateDetailedExplanation(
  _wine: WineAnalysis,
  score: ScoreBreakdown,
  profile: UserProfile | null
): string {
  if (!profile) return 'Complétez votre profil pour une explication personnalisée.';

  const parts = [...score.explanation];

  if (score.total >= 85) {
    parts.unshift('Excellent choix pour vous !');
  } else if (score.total >= 70) {
    parts.unshift('Ce vin devrait vous plaire.');
  } else if (score.total >= 50) {
    parts.unshift('Ce vin peut vous convenir, mais n\'est pas votre style habituel.');
  } else {
    parts.unshift('Ce vin ne correspond pas vraiment à vos préférences.');
  }

  return parts.slice(0, 3).join(' ');
}
