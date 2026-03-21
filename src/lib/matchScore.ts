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

export interface ScoreBreakdown {
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

const TYPE_PREF_LABELS_FR: Record<string, string> = {
  red_bold: 'rouges corsés',
  red_light: 'rouges légers et fruités',
  white_dry: 'blancs secs',
  white_sweet: 'blancs doux ou liquoreux',
  rose: 'rosés',
  champagne: 'bulles',
};

const REGION_PREF_LABELS_FR: Record<string, string> = {
  bordeaux: 'Bordeaux',
  bourgogne: 'Bourgogne',
  champagne: 'Champagne',
  rhone: 'Vallée du Rhône',
  loire: 'Loire',
};

/** Préférences profil en une phrase lisible (cépages via types, régions, tanins, occasions). */
function profilePreferencesFr(profile: UserProfile): string {
  const parts: string[] = [];
  if (profile.types?.length) {
    parts.push(profile.types.map((t) => TYPE_PREF_LABELS_FR[t] || t).join(', '));
  }
  if (profile.regions?.length) {
    parts.push(profile.regions.map((r) => REGION_PREF_LABELS_FR[r] || r).join(', '));
  }
  if (profile.body != null) {
    parts.push(`sensation en bouche visée ~${profile.body}/10`);
  }
  if (profile.occasions?.length) {
    parts.push(`occasions : ${profile.occasions.join(', ')}`);
  }
  return parts.length ? parts.join(' · ') : 'vos préférences enregistrées';
}

/** Structure / tanins / acidité à partir de l’IA ou repli selon le type. */
function wineSensoryBrief(wine: WineAnalysis): string {
  const st = wine.tastingNotes?.structure?.trim();
  if (st && st.length > 5) return st.slice(0, 220);
  const pal = wine.tastingNotes?.palate?.filter(Boolean).slice(0, 2).join(' ; ');
  if (pal) return pal.slice(0, 220);
  const nose = wine.tastingNotes?.nose?.[0];
  if (nose) return nose.slice(0, 160);
  if (isChampagneOrBubbles(wine)) return 'bulles, finesse et longueur';
  if (isWhiteWine(wine)) return 'acidité et fraîcheur';
  if (isRedWine(wine)) return 'tanins et structure';
  return 'profil aromatique cohérent avec le type';
}

/** Les 1–2 leviers qui expliquent le mieux les points (différencie 68 vs 72). */
function scoreDriversFragment(sb: ScoreBreakdown): string {
  const rows: { label: string; v: number }[] = [
    { label: 'style de vin', v: sb.typeMatch },
    { label: 'budget', v: sb.budgetMatch },
    { label: 'intensité / corps', v: sb.intensityMatch },
    { label: 'arômes', v: sb.aromaMatch },
    { label: 'sucrosité', v: sb.sweetnessMatch },
    { label: 'région', v: sb.regionBonus },
  ]
    .filter((x) => x.v > 0)
    .sort((a, b) => b.v - a.v);
  if (rows.length === 0) return 'les critères ne s’alignent qu’en partie avec votre profil.';
  if (rows.length === 1) return `les points viennent surtout du ${rows[0].label} (+${rows[0].v}).`;
  return `les points viennent surtout du ${rows[0].label} (+${rows[0].v}) et du ${rows[1].label} (+${rows[1].v}).`;
}

/** Une phrase de clôture selon le palier + contexte prix (ton Sommely). */
function bandClosingLine(
  wine: WineAnalysis,
  score: ScoreBreakdown,
  profile: UserProfile,
  avgPrice: number | undefined,
  options: ExplanationOptions | undefined
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
  const typeOk = wineTypeMatchesUser(wine, profile);
  const regionOk = userRegionMatchesWine(wine, profile);

  if (band === 'top') {
    if (isChampagneOrBubbles(wine)) {
      return `La finesse en bouche colle à vos bulles préférées — pas de hasard, juste du goût.`;
    }
    if (isWhiteWine(wine) && isLoireWine(wine)) {
      return `Minéralité qui vous va comme un gant — ${accord} vous attend.`;
    }
    if (isRedWine(wine) && isBordeauxWine(wine)) {
      return prix != null
        ? `À ${prix}€, le rapport tient la route (chut au sommelier).`
        : `Le rapport tient la route pour ce ${appellation}.`;
    }
    return prix != null
      ? `Prix cohérent à ${prix}€ — la seule question, c’est l’occasion.`
      : `${region} et ${getDominantGrapeForGeneric(wine)} : vous êtes sur la bonne ligne.`;
  }
  if (band === 'high') {
    if (markup || (ctx === 'restaurant' && prix != null && prix > 40)) {
      const px = prix != null ? `${prix}€` : 'ce tarif';
      return `Bon vin, mais à ${px} ici on paie aussi la salle — regardez un voisin sur la carte.`;
    }
    if (prix != null && prix > 40) {
      return `À ${prix}€, l’addition pèse un peu pour ce que le verre raconte.`;
    }
    if (score.typeMatch === 0 && score.regionBonus > 0) {
      return `${nom} parle surtout terroir (${region}), moins votre style — bonne bouteille, pas forcément votre crush.`;
    }
    const px = prix != null ? `${prix}€` : 'ce prix';
    return `Solide pour ${px} — ${region} sait faire, même si ce n’est pas votre légende personnelle.`;
  }
  if (band === 'mid') {
    if (!typeOk) {
      const px = prix != null ? ` pour ${prix}€` : '';
      return `Le profil de ${cépage} ici ne mord pas vos habitudes — potable${px}, vous valez mieux.`;
    }
    if (profile.regions?.length && !regionOk) {
      return `${region} brille souvent — pas sur votre case aujourd’hui.`;
    }
    if (prix != null && prix > 40) {
      return `À ${prix}€, vous espériez un cran au-dessus — il est un cran à côté de vous.`;
    }
    return `Correct, mais pas votre signature en bouche.`;
  }
  if (ctx === 'restaurant' && prix != null) {
    return `${nom} à ${prix}€ : la nappe coûte cher pour votre profil — passez votre chemin.`;
  }
  if (ctx === 'retail') {
    return `Dans cette gamme, ${nom} traîne sous ce que votre budget mérite.`;
  }
  if (!typeOk && !regionOk) {
    return `Là vous cumulez tout ce que vous évitez d’habitude — presque un talent.`;
  }
  return `Ça se boit ; pour vous, c’est le plafond du compliment.`;
}

/**
 * « Pourquoi ce score » — 2–3 phrases : identité du vin + score exact + profil + leviers + ton Sommely.
 */
export function generateDetailedExplanation(
  wine: WineAnalysis,
  score: ScoreBreakdown,
  profile: UserProfile | null,
  avgPrice?: number,
  options?: ExplanationOptions
): string {
  const nom = getNom(wine);
  const appellation = getAppellationLabel(wine);
  const yearStr = wine.year != null ? String(wine.year) : '';
  const identity = yearStr ? `${nom} (${appellation}, ${yearStr})` : `${nom} (${appellation})`;
  const prix = effectivePrice(avgPrice, options);

  if (!profile) {
    return (
      `${identity} — score ${score.total}/100. ` +
      `Complétez votre profil goûts (cépages, régions, tanins) pour un vrai match personnalisé.`
    ).replace(/\s+/g, ' ');
  }

  const typeOk = wineTypeMatchesUser(wine, profile);
  const regionOk = userRegionMatchesWine(wine, profile);
  const prefs = profilePreferencesFr(profile);
  const sensory = wineSensoryBrief(wine);
  const drivers = scoreDriversFragment(score);

  const align =
    typeOk && regionOk
      ? 'Ça coche style et terroir pour vous.'
      : typeOk
        ? 'Le style vous va ; le terroir moins que d’habitude.'
        : regionOk
          ? 'Le terroir vous parle ; le style moins.'
          : 'Le style et le terroir tirent chacun leur épingle du jeu par rapport à vos habitudes.';

  const s1 = `${identity} : ${score.total}/100 — ${drivers}`;
  const s2 = `Vous visez plutôt ${prefs}. Ici : ${sensory}. ${align}`;
  let s3 = bandClosingLine(wine, score, profile, avgPrice, options);
  if (prix != null && !s3.includes('€') && scoreBand(score.total) !== 'low') {
    s3 = `${s3} (prix ref. ~${prix}€)`;
  }

  const text = [s1, s2, s3].join(' ').replace(/\s+/g, ' ').trim();
  if (text.length > 520) return `${text.slice(0, 517)}…`;
  return text;
}
