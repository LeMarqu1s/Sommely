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
      explanation: [],
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
        break;
      }
    }
  }
  score += typeMatch;

  // 2. MATCH BUDGET (15 points max)
  if (userProfile.budget && enrichedData.avgPrice !== undefined) {
    const [min, max] = BUDGET_RANGES[userProfile.budget] || [0, 999];
    const price = enrichedData.avgPrice as number;
    if (price >= min && price <= max) {
      budgetMatch = 15;
    } else if (price > max) {
      budgetMatch = Math.max(0, 15 - Math.floor((price - max) / 10) * 5);
    } else {
      budgetMatch = 10;
    }
  }
  score += budgetMatch;

  // 3. MATCH INTENSITE/CORPS (10 points max) — body: 0–10, intensity: 0–100
  if (userProfile.body !== undefined && enrichedData.intensity !== undefined) {
    const bodyScaled = userProfile.body * 10; // 0–10 → 0–100
    const diff = Math.abs((enrichedData.intensity as number) - bodyScaled);
    intensityMatch = Math.max(0, Math.round(10 - (diff / 15)));
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

  const total = Math.min(100, Math.max(0, Math.round(score)));

  return { total, typeMatch, budgetMatch, intensityMatch, aromaMatch, sweetnessMatch, regionBonus, explanation };
}

// ─── « POURQUOI CE SCORE » — templates & variantes ─────────────────────────

/** Vérifie si le type de vin correspond aux préférences (TYPE_MAPPING). */
function wineTypeMatchesUser(wine: WineAnalysis, profile: UserProfile): boolean {
  if (!profile.types?.length || !wine.type) return false;
  for (const pref of profile.types) {
    const mapped = TYPE_MAPPING[pref] || [];
    if (mapped.some((t) => wine.type!.toLowerCase().includes(t.toLowerCase()))) return true;
  }
  return false;
}

function userRegionMatchesWine(wine: WineAnalysis, profile: UserProfile): boolean {
  if (!profile.regions?.length || !wine.region) return false;
  for (const pref of profile.regions) {
    const mapped = REGION_MAPPING[pref] || [];
    if (mapped.some((r) => wine.region!.toLowerCase().includes(r.toLowerCase()))) return true;
  }
  return false;
}

function wineTextBlob(wine: WineAnalysis): string {
  return [wine.name, wine.appellation, wine.region, wine.subRegion, wine.village, wine.country]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function isChampagneOrBubbles(wine: WineAnalysis): boolean {
  const t = (wine.type || '').toLowerCase();
  return (
    t.includes('champagne') ||
    t.includes('pétillant') ||
    t.includes('petillant') ||
    t.includes('mousseux')
  );
}

function isWhiteWine(wine: WineAnalysis): boolean {
  const t = (wine.type || '').toLowerCase();
  return t.includes('blanc') && !t.includes('liquoreux');
}

function isRedWine(wine: WineAnalysis): boolean {
  const t = (wine.type || '').toLowerCase();
  return t.includes('rouge') || t === 'rouge';
}

function isBordeauxWine(wine: WineAnalysis): boolean {
  return wineTextBlob(wine).includes('bordeaux');
}

function isLoireWine(wine: WineAnalysis): boolean {
  const b = wineTextBlob(wine);
  return (
    b.includes('loire') ||
    b.includes('sancerre') ||
    b.includes('pouilly') ||
    b.includes('anjou') ||
    b.includes('touraine') ||
    b.includes('muscadet') ||
    b.includes('vouvray')
  );
}

function getNom(wine: WineAnalysis): string {
  return wine.name?.trim() || 'Ce vin';
}

function getRegionLabel(wine: WineAnalysis): string {
  const r = wine.region?.trim() || wine.appellation?.trim();
  return r || 'cette région';
}

function getAppellationLabel(wine: WineAnalysis): string {
  return wine.appellation?.trim() || wine.region?.trim() || 'cette appellation';
}

function getGrapeLabel(wine: WineAnalysis): string {
  const g = wine.grapes;
  if (Array.isArray(g) && g[0]) return String(g[0]).trim();
  if (typeof g === 'string' && g.trim()) return g.split(/[,;]/)[0].trim();
  return 'ce cépage';
}

function getAccordLabel(wine: WineAnalysis): string {
  const p = wine.foodPairings?.perfect;
  if (Array.isArray(p) && p[0]) return String(p[0]).trim();
  return 'un plat équilibré';
}

function getDominantGrapeForGeneric(wine: WineAnalysis): string {
  const g = getGrapeLabel(wine);
  return g === 'ce cépage' ? 'le profil aromatique annoncé' : g;
}

function effectivePrice(
  avgPrice: number | undefined,
  options: ExplanationOptions | undefined
): number | null {
  const rp = options?.restaurantPrice;
  if (rp != null && rp > 0) return Math.round(rp);
  if (avgPrice != null && avgPrice > 0) return Math.round(avgPrice);
  return null;
}

function scoreBand(total: number): 'top' | 'high' | 'mid' | 'low' {
  if (total >= 90) return 'top';
  if (total >= 75) return 'high';
  if (total >= 55) return 'mid';
  return 'low';
}

function restaurantMarkup(options: ExplanationOptions | undefined): boolean {
  const rp = options?.restaurantPrice;
  const mp = options?.marketPrice;
  return rp != null && mp != null && mp > 0 && rp > 2 * mp;
}

/**
 * « Pourquoi ce score » — 2 phrases max, technique + touche d'humour, sans répétition ni phrase générique parasite.
 */
export function generateDetailedExplanation(
  wine: WineAnalysis,
  score: ScoreBreakdown,
  profile: UserProfile | null,
  avgPrice?: number,
  options?: ExplanationOptions
): string {
  const nom = getNom(wine);
  const region = getRegionLabel(wine);
  const appellation = getAppellationLabel(wine);
  const cépage = getGrapeLabel(wine);
  const accord = getAccordLabel(wine);
  const prix = effectivePrice(avgPrice, options);
  const ctx = options?.scanContext ?? 'retail';
  const band = scoreBand(score.total);
  const markup = restaurantMarkup(options);

  if (!profile) {
    return (
      `Complétez votre profil goûts pour affiner le score. ` +
      `En attendant, ${nom} (${region}) est évalué sur des critères généraux.`
    ).replace(/\s+/g, ' ');
  }

  const typeOk = wineTypeMatchesUser(wine, profile);
  const regionOk = userRegionMatchesWine(wine, profile);

  let text = '';

  // ─── 90–100 ───
  if (band === 'top') {
    if (isChampagneOrBubbles(wine)) {
      text =
        `La finesse de bulle et la longueur en bouche de ${nom} correspondent à vos préférences. ` +
        `Ce n'est pas du hasard, c'est Sommely.`;
    } else if (isWhiteWine(wine) && isLoireWine(wine)) {
      text =
        `${nom} a la minéralité et la fraîcheur qui collent à votre profil. ` +
        `Accord parfait avec ${accord} — vous avez l'œil.`;
    } else if (isRedWine(wine) && isBordeauxWine(wine)) {
      const p2 =
        prix != null
          ? `À ${prix}€, le rapport est honnête — surtout ne le dites pas au sommelier.`
          : `Le rapport est honnête — surtout ne le dites pas au sommelier.`;
      text = `${nom} est un ${appellation} avec la structure tannique que vous appréciez. ${p2}`;
    } else {
      const dom = getDominantGrapeForGeneric(wine);
      const p2 =
        prix != null
          ? `Prix cohérent à ${prix}€. La seule question : pour quelle occasion ?`
          : `La seule question : pour quelle occasion ?`;
      text = `${nom} coche vos cases : ${region}, ${dom} dominant. ${p2}`;
    }
  }

  // ─── 75–89 ───
  else if (band === 'high') {
    if (markup || (ctx === 'restaurant' && prix != null && prix > 40)) {
      const px = prix != null ? `${prix}€` : 'ce tarif';
      text =
        `Techniquement bon, mais à ${px} sur cette carte on vous demande de payer le décor. ` +
        `Cherchez le voisin sur la liste.`;
    } else if (prix != null && prix > 40) {
      text =
        `Techniquement bon, mais à ${prix}€ l'addition pèse pour ce que le vin délivre. ` +
        `Un cran en dessous sur l'étiquette ferait plus de sens pour vous.`;
    } else if (score.typeMatch === 0 && score.regionBonus > 0) {
      text =
        `${nom} vous parle surtout par le terroir (${region}), moins par le style en bouche. ` +
        `Bonne pioche, sans être le coup de cœur.`;
    } else {
      const px = prix != null ? `${prix}€` : 'ce prix';
      text =
        `${nom} est solide pour ${px} — ${region} sait faire ça bien. ` +
        `Pas le vin de votre vie, mais une soirée réussie est garantie.`;
    }
  }

  // ─── 55–74 ───
  else if (band === 'mid') {
    if (!typeOk) {
      const px = prix != null ? ` pour ${prix}€` : '';
      text =
        `Le ${cépage} de ${nom} ne colle pas vraiment à ce que vous aimez en bouche. ` +
        `Potable${px}, mais vous méritez mieux.`;
    } else if (profile.regions?.length && !regionOk) {
      text =
        `${region} produit d'excellents vins — juste pas pour votre profil. ` +
        `Celui-ci en est un bon exemple.`;
    } else if (prix != null && prix > 40) {
      text =
        `À ${prix}€, vous attendez plus que ce que ${nom} peut offrir à votre palais. ` +
        `Il y a mieux sur cette carte ou au rayon.`;
    } else {
      text =
        `${nom} fait ce qu'on lui demande. ` +
        `Ce qu'on lui demande ne correspond pas vraiment à ce que vous aimez.`;
    }
  }

  // ─── 0–54 ───
  else {
    if (ctx === 'restaurant' && prix != null) {
      text =
        `${nom} à ${prix}€ sur cette carte — le prix paye surtout la nappe blanche. ` +
        `Pour votre profil, passez votre chemin.`;
    } else if (ctx === 'retail') {
      text =
        `Dans sa gamme de prix, ${nom} est dans la moyenne basse. ` +
        `Votre budget mérite un meilleur voisin de rayon.`;
    } else if (!typeOk && !regionOk) {
      text =
        `${nom} rassemble tout ce que vous évitez d'habitude en verre. ` +
        `Honnêtement, c'est presque du talent.`;
    } else {
      text =
        `Ça se boit. ` +
        `C'est probablement le meilleur compliment qu'on puisse faire à ${nom}.`;
    }
  }

  text = text.replace(/\s+/g, ' ').trim();
  if (text.length > 420) return `${text.slice(0, 417)}…`;
  return text;
}
