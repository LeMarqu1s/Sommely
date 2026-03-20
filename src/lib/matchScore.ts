import { WineAnalysis } from './openai';

export interface UserProfile {
  types?: string[];
  budget?: string;
  body?: number;
  aroma?: number;
  sweetness?: number;
  regions?: string[];
  expertise?: string;
  /** ex. onboarding : debutant, curieux, passionne, expert */
  experience?: string;
  occasions?: string[];
}

/** Contexte de scan pour « Pourquoi ce score » (restaurant / cave / supermarché). */
export type ScanContextKind = 'restaurant' | 'cave' | 'retail';

export interface ExplanationOptions {
  scanContext?: ScanContextKind;
  /** Prix affiché sur la carte resto (comparé à marketPrice si les deux sont définis) */
  restaurantPrice?: number;
  /** Prix marché de référence (ex. estimé menu) */
  marketPrice?: number;
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

// ─── « POURQUOI CE SCORE » — templates & variantes ─────────────────────────

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
}

function isBeginnerProfile(p: UserProfile): boolean {
  return p.expertise === 'beginner' || p.experience === 'debutant';
}

function isExpertProfile(p: UserProfile): boolean {
  return p.expertise === 'expert' || p.experience === 'expert' || p.experience === 'passionne';
}

function isBubbleWine(wine: WineAnalysis): boolean {
  const t = (wine.type || '').toLowerCase();
  return t.includes('champagne') || t.includes('pétillant') || t.includes('mousseux') || t.includes('petillant');
}

function userLikesBubbles(profile: UserProfile): boolean {
  if (!profile.types?.length) return false;
  return profile.types.some((k) => k === 'champagne');
}

/** Vérifie si le type de vin correspond aux préférences (TYPE_MAPPING). */
function wineTypeMatchesUser(wine: WineAnalysis, profile: UserProfile): boolean {
  if (!profile.types?.length || !wine.type) return false;
  for (const pref of profile.types) {
    const mapped = TYPE_MAPPING[pref] || [];
    if (mapped.some((t) => wine.type!.toLowerCase().includes(t.toLowerCase()))) return true;
  }
  return false;
}

/** Région / appellation pour templates « région » (ex. Bordeaux, Bourgogne). */
function regionLabelForTemplate(wine: WineAnalysis): string | null {
  const blob = [
    wine.appellation,
    wine.region,
    wine.subRegion,
    wine.village,
    wine.country,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const keys: [string, string][] = [
    ['bordeaux', 'Bordeaux'],
    ['bourgogne', 'Bourgogne'],
    ['burgundy', 'Bourgogne'],
    ['rhône', 'le Rhône'],
    ['rhone', 'le Rhône'],
    ['champagne', 'Champagne'],
    ['loire', 'la Loire'],
    ['alsace', 'l’Alsace'],
    ['provence', 'la Provence'],
    ['languedoc', 'le Languedoc'],
  ];
  for (const [needle, label] of keys) {
    if (blob.includes(needle)) return label;
  }
  if (wine.region?.trim()) return wine.region.trim();
  return null;
}

function userRegionMatchesWine(wine: WineAnalysis, profile: UserProfile): boolean {
  if (!profile.regions?.length || !wine.region) return false;
  for (const pref of profile.regions) {
    const mapped = REGION_MAPPING[pref] || [];
    if (mapped.some((r) => wine.region!.toLowerCase().includes(r.toLowerCase()))) return true;
  }
  return false;
}

function isGrandCruStyle(wine: WineAnalysis): boolean {
  const c = (wine.classification || '').toLowerCase();
  if (c.includes('cru') || c.includes('grand cru') || c.includes('premier cru')) return true;
  const full = [wine.name, wine.appellation, wine.chateau].filter(Boolean).join(' ').toLowerCase();
  return /grand cru|premier cru|1er cru|classé/.test(full);
}

function priceAboveBudget(profile: UserProfile, avgPrice: number): boolean {
  if (!profile.budget) return false;
  const [, max] = BUDGET_RANGES[profile.budget] || [0, 999];
  return avgPrice > max * 1.35;
}

function scoreBand(total: number): 'top' | 'high' | 'mid' | 'low' {
  if (total >= 90) return 'top';
  if (total >= 75) return 'high';
  if (total >= 55) return 'mid';
  return 'low';
}

function buildFooterLine(wine: WineAnalysis, avgPrice?: number): string {
  const name = wine.name?.trim() || 'Ce vin';
  const region = wine.region?.trim() || wine.appellation?.trim() || 'France';
  const priceStr =
    typeof avgPrice === 'number' && avgPrice > 0 ? Math.round(avgPrice).toString() : '—';
  const perfect = wine.foodPairings?.perfect;
  const accord =
    (Array.isArray(perfect) && perfect[0]) ||
    (typeof perfect === 'string' ? perfect : null) ||
    'un accord mets-vins adapté';
  return `${name}, ${region}, ${priceStr}€ — ${accord}.`;
}

function pickTemplateBody(
  total: number,
  band: 'top' | 'high' | 'mid' | 'low',
  wine: WineAnalysis,
  profile: UserProfile,
  avgPrice: number | undefined,
  options: ExplanationOptions | undefined
): string {
  const ctx = options?.scanContext ?? 'retail';
  const rp = options?.restaurantPrice;
  const mp = options?.marketPrice;
  const markup = rp != null && mp != null && mp > 0 && rp > 2 * mp;

  const regionLabel = regionLabelForTemplate(wine);
  const typeMatch = wineTypeMatchesUser(wine, profile);
  const bubbleWine = isBubbleWine(wine);
  const bubblePref = userLikesBubbles(profile);
  const beginner = isBeginnerProfile(profile);
  const expert = isExpertProfile(profile);
  const seed = `${wine.name}|${wine.region}|${total}|${band}`;
  const idx = hashSeed(seed) % 6;

  // 1 — Markup resto > 2× marché
  if (markup) {
    if (band === 'top') {
      return `Même avec un excellent score pour vous, au resto ce prix fait plus de 2× le marché — comparez les autres lignes avant de trancher.`;
    }
    if (band === 'high') {
      return `Bon vin. Mais au prix restaurant on a vu mieux. Scannez les voisins sur la carte avant de décider.`;
    }
    if (band === 'mid') {
      return `Pour ce prix-là, l'équation ne tient pas vraiment. Vous pouvez faire mieux.`;
    }
    return `À ce prix au resto, avec ce score pour vous, il y a forcément mieux sur cette carte.`;
  }

  // 2 — Score > 85 & débutant
  if (total > 85 && beginner && (band === 'top' || band === 'high')) {
    return `Pour quelqu'un qui débute, tomber sur ça c'est une bonne surprise. Gardez cette référence.`;
  }

  // 3 — Type / profil (bulles / correspondance)
  if (bubbleWine && bubblePref && band === 'top') {
    return `Pour vos préférences en bulles, c'est le bon choix. Même chose dans un resto étoilé, ça passerait sans rougir.`;
  }
  if (typeMatch && band === 'top' && !bubbleWine) {
    return `Exactement votre profil. Niveau arômes, structure, finale — tout y est. Rare qu'on tombe aussi juste.`;
  }
  if (typeMatch && !bubbleWine && band === 'high') {
    return `Correspond à une partie de vos préférences. Vous apprécierez, sans forcément vous souvenir de lui dans 6 mois.`;
  }
  if (!typeMatch && band === 'mid') {
    return `Ce vin est fait pour quelqu'un d'autre. Pas vous. Pas ce soir.`;
  }
  if (!typeMatch && band === 'low') {
    return `Tout ce que vous n'aimez pas est réuni dans ce verre. Respect pour la cohérence.`;
  }

  // 4 — Appellation / région connue
  if (regionLabel && band === 'high') {
    return `Bel exemple de ce que ${regionLabel} sait faire. Pas révolutionnaire, mais propre et honnête.`;
  }

  // Contexte
  if (ctx === 'restaurant' && band === 'top') {
    return `Sur une carte de resto, c'est le genre de bouteille que le sommelier recommande aux clients qui savent ce qu'ils veulent.`;
  }
  if (ctx === 'retail' && band === 'mid') {
    return `Dans sa catégorie supermarché, il est dans la moyenne. La moyenne c'est parfois suffisant.`;
  }
  if (ctx === 'cave' && band === 'top' && avgPrice != null && avgPrice > 0) {
    return `Score ${total}/100 ET prix raisonnable. C'est le genre de trouvaille qu'on garde pour soi normalement.`;
  }

  if (isGrandCruStyle(wine) && band === 'top') {
    return `Techniquement au-dessus du lot. Votre profil correspond. La seule question : pour quelle occasion ?`;
  }

  if (expert && band === 'high') {
    return `Pour votre niveau, vous avez certainement vu mieux. Mais dans son style, il fait ce qu'on lui demande.`;
  }

  if (avgPrice != null && priceAboveBudget(profile, avgPrice) && band === 'high') {
    return `Bon vin. Pour votre budget habituel, à ce prix-là on a souvent vu mieux — regardez une gamme au-dessus ou une autre cuvée.`;
  }

  if (userRegionMatchesWine(wine, profile) && band === 'top' && regionLabel) {
    return `Techniquement au-dessus du lot. Votre profil correspond. La seule question : pour quelle occasion ?`;
  }

  // Fallback : 6 variantes par plage (diversification)
  const TOP: string[] = [
    `Exactement votre profil. Niveau arômes, structure, finale — tout y est. Rare qu'on tombe aussi juste.`,
    `Score ${total}/100 ET prix raisonnable. C'est le genre de trouvaille qu'on garde pour soi normalement.`,
    `Pour vos préférences en bulles, c'est le bon choix. Même chose dans un resto étoilé, ça passerait sans rougir.`,
    `Techniquement au-dessus du lot. Votre profil correspond. La seule question : pour quelle occasion ?`,
    `Sur une carte de resto, c'est le genre de bouteille que le sommelier recommande aux clients qui savent ce qu'ils veulent.`,
    `Pour quelqu'un qui débute, tomber sur ça c'est une bonne surprise. Gardez cette référence.`,
  ];

  const HIGH: string[] = [
    `Solide. Pas le vin de votre vie, mais vous passerez une bonne soirée. C'est déjà beaucoup.`,
    `Bon vin. Mais au prix restaurant on a vu mieux. Scannez les voisins sur la carte avant de décider.`,
    `Correspond à une partie de vos préférences. Vous apprécierez, sans forcément vous souvenir de lui dans 6 mois.`,
    regionLabel
      ? `Bel exemple de ce que ${regionLabel} sait faire. Pas révolutionnaire, mais propre et honnête.`
      : `Bel exemple de cette région. Pas révolutionnaire, mais propre et honnête.`,
    `Pour ce prix, c'est honnête. Ni une claque, ni une déception. Le vin du mardi soir parfait.`,
    `Pour votre niveau, vous avez certainement vu mieux. Mais dans son style, il fait ce qu'on lui demande.`,
  ];

  const MID: string[] = [
    `Ça se boit. C'est peut-être le meilleur compliment qu'on puisse lui faire.`,
    `Ce vin est fait pour quelqu'un d'autre. Pas vous. Pas ce soir.`,
    `Pour ce prix-là, l'équation ne tient pas vraiment. Vous pouvez faire mieux.`,
    `Dans sa catégorie supermarché, il est dans la moyenne. La moyenne c'est parfois suffisant.`,
    `Techniquement potable. Mais 'potable' c'est aussi ce qu'on dit de l'eau du robinet.`,
    `Ce vin a été conçu pour plaire à tout le monde. Résultat : il ne plaît vraiment à personne.`,
  ];

  const LOW: string[] = [
    `Honnêtement ? Remettez-le en rayon. Ce n'est pas une critique, c'est un service.`,
    `À ce prix au resto, avec ce score pour vous, il y a forcément mieux sur cette carte.`,
    `Tout ce que vous n'aimez pas est réuni dans ce verre. Respect pour la cohérence.`,
    `Ce vin mérite quelqu'un qui l'apprécie vraiment. Vous n'êtes pas cette personne. Et c'est OK.`,
    `Pour votre budget habituel, c'est en dessous de ce que vous méritez.`,
    `Si ce vin était une réunion, ce serait celle qu'on aurait pu faire par email.`,
  ];

  const pool = band === 'top' ? TOP : band === 'high' ? HIGH : band === 'mid' ? MID : LOW;
  return pool[idx] ?? pool[0];
}

/**
 * Texte « Pourquoi ce score » — ton Sommely : honnête, humour bienveillant, jamais condescendant.
 * Combine plage de score, type, région, prix, profil et contexte ; termine par une ligne concrète sur le vin.
 */
export function generateDetailedExplanation(
  wine: WineAnalysis,
  score: ScoreBreakdown,
  profile: UserProfile | null,
  avgPrice?: number,
  options?: ExplanationOptions
): string {
  const footer = buildFooterLine(wine, avgPrice);

  if (!profile) {
    return `Sans profil complet, on calibre quand même le score pour vous. ${footer}`.replace(/\s+/g, ' ').trim();
  }

  const total = score.total;
  const band = scoreBand(total);
  const body = pickTemplateBody(total, band, wine, profile, avgPrice, options);

  const extra = score.explanation[0] ? ` ${score.explanation[0]}` : '';

  const out = `${body}${extra} ${footer}`.replace(/\s+/g, ' ').trim();
  if (out.length > 720) return `${out.slice(0, 717)}…`;
  return out;
}
