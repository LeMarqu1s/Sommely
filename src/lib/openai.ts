import { optimizeImageForAI } from './imageOptimize';

// ─── TYPES ────────────────────────────────────────────────

export interface WineAnalysis {
  // Identification
  name: string;
  chateau?: string;
  domaine?: string;
  producer?: string;
  year?: number;

  // Géographie
  region?: string;
  subRegion?: string;
  appellation?: string;
  village?: string;
  country?: string;

  // Caractéristiques
  type?: 'Rouge' | 'Blanc' | 'Rosé' | 'Champagne' | 'Pétillant' | 'Blanc liquoreux' | 'Orange' | 'Mousseux' | string;
  grapes?: string[] | string;
  alcohol?: string;
  classification?: string;

  // Dégustation
  tastingNotes?: {
    color?: string;
    nose?: string[];
    palate?: string[];
    finish?: string;
    structure?: string;
  };

  // Service
  servingTemp?: string;
  decanting?: string;
  agingPotential?: string;
  glassType?: string;

  // Accords mets-vins détaillés
  foodPairings?: {
    perfect?: string[];
    good?: string[];
    avoid?: string[];
  };

  // Conseils
  tips?: string[];
  story?: string;

  // Champagne / Pétillant spécifique
  dosage?: string; // ex: "Brut Nature", "Extra Brut", "Brut", "Demi-sec"

  // Prix par format de bouteille (null = format inexistant pour ce vin)
  bottlePrices?: {
    cl1875?: number; // Piccolo / Quart (champagne principalement)
    cl375?: number;  // Demi-bouteille / Fillette
    cl750?: number;  // Bouteille standard
    cl1500?: number; // Magnum (1,5L)
    cl3000?: number; // Jéroboam champagne / Double Magnum vin tranquille (3L)
    cl6000?: number; // Mathusalem champagne / Impériale Bordeaux (6L)
  };

  // Fourchette de prix marché pour la 75cl (min = prix le plus bas, max = prix boutique normal)
  priceRange?: { min: number; max: number };

  // Meta
  confidence: number;
  labelReadability?: 'excellent' | 'good' | 'poor';
  rawText?: string;
  error?: string;
}

// ─── HELPERS API ───────────────────────────────────────────

/** Appel OpenAI : utilise /api/openai-proxy en prod, /v1 en dev (proxy Vite) */
export async function fetchOpenAI(body: Record<string, unknown>): Promise<Response> {
  const isProd = import.meta.env.PROD;
  const url = isProd ? '/api/openai-proxy' : '/v1/chat/completions';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (!isProd) headers['Authorization'] = `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`;

  // Timeout de 50s : si le réseau ou Vercel ne répond pas, on avorte proprement
  // plutôt que de laisser le fetch pendre indéfiniment → catch déclenché → état erreur affiché
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 50000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    if ((err as Error).name === 'AbortError') {
      throw new Error("L'analyse a pris trop de temps. Vérifiez votre connexion et réessayez.");
    }
    throw err;
  }
}

// ─── CACHE ────────────────────────────────────────────────

const analysisCache = new Map<string, WineAnalysis>();

function hashImage(base64: string): string {
  let hash = 0;
  const sample = base64.slice(0, 300) + base64.slice(-300);
  for (let i = 0; i < sample.length; i++) {
    const char = sample.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
}

// ─── PROMPT EXPERT VIN ────────────────────────────────────

const WINE_EXPERT_PROMPT = `Tu es un expert sommelier et analyste de prix de vins. Analyse l'étiquette visible et réponds UNIQUEMENT en JSON valide, sans markdown.

ÉTAPE 1 — LIS L'ÉTIQUETTE : identifie le nom exact, millésime, appellation, producteur.
ÉTAPE 2 — RECHERCHE LE PRIX RÉEL : en te basant sur ta connaissance du marché français pour CE vin précis (pas une estimation générique), détermine le prix au détail en 75cl et la fourchette min/max (grande surface vs caviste).
ÉTAPE 3 — DÉTERMINE LES FORMATS DISPONIBLES : quels formats de bouteille ce producteur commercialise-t-il réellement ?

⚠️ CRITIQUE : Les chiffres dans le schéma JSON ci-dessous sont des VALEURS DE REMPLACEMENT (placeholders = 0). Tu DOIS les remplacer par les vraies données du vin analysé. Ne jamais retourner 0 dans ta réponse finale.

Schéma JSON (remplace toutes les valeurs 0 et les chaînes descriptives) :
{
  "name": "Nom EXACT sur l'étiquette",
  "chateau": null,
  "domaine": null,
  "producer": "Producteur",
  "year": 0,
  "region": "Région viticole",
  "subRegion": null,
  "appellation": "AOC/AOP/DOC précise",
  "village": null,
  "country": "Pays",
  "type": "Rouge|Blanc|Rosé|Champagne|Pétillant|Blanc liquoreux|Orange|Mousseux",
  "grapes": ["Cépage"],
  "alcohol": "0%",
  "classification": null,
  "tastingNotes": {
    "color": "Robe",
    "nose": ["Arôme 1", "Arôme 2"],
    "palate": ["Sensation 1", "Sensation 2"],
    "finish": "Finale",
    "structure": "Structure"
  },
  "servingTemp": "Température",
  "decanting": "Carafage",
  "agingPotential": "Garde",
  "glassType": "Verre",
  "foodPairings": {
    "perfect": ["Accord 1", "Accord 2"],
    "good": ["Accord 3"],
    "avoid": ["À éviter"]
  },
  "dosage": null,
  "bottlePrices": {
    "cl1875": null,
    "cl375": null,
    "cl750": 0,
    "cl1500": null,
    "cl3000": null,
    "cl6000": null
  },
  "priceRange": {
    "min": 0,
    "max": 0
  },
  "tips": ["Conseil 1", "Conseil 2"],
  "story": "Histoire du vin",
  "confidence": 0,
  "labelReadability": "excellent|good|poor"
}

RÈGLES PRIX (obligatoires) :
- bottlePrices.cl750 : prix de VENTE RÉEL de CE vin spécifique en France (ex: Coteaux Bourguignons IGP basique → 8-15€, Bourgogne village → 15-30€, 1er Cru Bourgogne → 30-80€, Grand Cru Bourgogne → 80-300€+). Base-toi sur le nom, l'appellation et le producteur visible sur l'étiquette.
- priceRange : min = prix le plus bas en grande surface / achat direct. max = prix en caviste / boutique spécialisée. Écart typique 25-45%. Exemples RÉELS : Côtes du Rhône basique → min:6 max:12, Côtes de Bourg → min:8 max:16, Saint-Émilion GC → min:20 max:45, Pauillac 2e cru → min:80 max:180.
- NE JAMAIS retourner priceRange.min=0 ou priceRange.max=0 dans la réponse finale.

RÈGLES FORMATS DE BOUTEILLES :
- Vins tranquilles : cl375 si la gamme existe en demi (cherche si ce domaine le fait), cl1500 si magnum disponible, cl3000/cl6000 uniquement grands crus de prestige.
- Champagne/Pétillant : cl1875 pour grandes maisons (Moët, Veuve Clicquot, Bollinger, Ruinart, Perrier-Jouët...), cl375 (très courant), cl1500 (très courant), cl3000 jéroboam (grandes maisons), cl6000 mathusalem (maisons de luxe uniquement).
- Mettre null si le format n'est pas commercialisé par ce producteur.

Si pas une étiquette de vin : {"error": "not_wine", "confidence": 0}`;

// ─── ANALYSE PRINCIPALE ───────────────────────────────────

export async function analyzeWineLabel(imageBase64: string): Promise<WineAnalysis> {
  const cacheKey = hashImage(imageBase64);
  if (analysisCache.has(cacheKey)) {
    return analysisCache.get(cacheKey)!;
  }

  const optimized = await optimizeImageForAI(imageBase64);
  const response = await fetchOpenAI({
    model: import.meta.env.VITE_OPENAI_VISION_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Expert sommelier. Réponds UNIQUEMENT en JSON valide.' },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${optimized}`, detail: 'auto' } },
          { type: 'text', text: WINE_EXPERT_PROMPT }
        ]
      }
    ],
    max_tokens: 1600,
    temperature: 0.2,
    response_format: { type: 'json_object' }
  });

  let data: Record<string, any>;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Réponse invalide du serveur (HTTP ${response.status}). Réessayez.`);
  }

  if (!response.ok) {
    throw new Error(data.error?.message || `Erreur ${response.status}`);
  }

  const content = data.choices?.[0]?.message?.content || '{}';
  let parsed = JSON.parse(content) as WineAnalysis & { error?: string };
  if (parsed.error === 'not_wine') {
    return parsed;
  }
  if (parsed.grapes != null && typeof parsed.grapes === 'string') {
    parsed.grapes = (parsed.grapes as string).split(/[,;]/).map((s: string) => s.trim()).filter(Boolean);
  }
  const enriched = enrichMissingData(parsed);
  analysisCache.set(cacheKey, enriched);
  return enriched;
}

// ─── ENRICHISSEMENT DONNÉES MANQUANTES ────────────────────

function enrichMissingData(wine: WineAnalysis): WineAnalysis {
  const enriched = { ...wine };

  if (!enriched.foodPairings || !enriched.foodPairings.perfect?.length) {
    enriched.foodPairings = getDefaultFoodPairings(wine.type, wine.region);
  }

  if (!enriched.servingTemp) {
    enriched.servingTemp = getServingTemp(wine.type);
  }

  if (!enriched.glassType) {
    enriched.glassType = getGlassType(wine.type, wine.region);
  }

  if (!enriched.agingPotential && wine.year) {
    enriched.agingPotential = getAgingPotential(wine.type, wine.year, wine.region);
  }

  if (!enriched.tastingNotes || !enriched.tastingNotes.nose?.length) {
    enriched.tastingNotes = generateTastingNotes(wine.type, wine.region, wine.grapes);
  }

  return enriched;
}

// ─── DONNÉES PAR DÉFAUT SELON TYPE ────────────────────────

function getDefaultFoodPairings(type?: string, _region?: string): WineAnalysis['foodPairings'] {
  const pairings: Record<string, NonNullable<WineAnalysis['foodPairings']>> = {
    Rouge: {
      perfect: ['Côte de bœuf grillée aux herbes', 'Gigot d\'agneau rôti à l\'ail', 'Magret de canard aux cèpes'],
      good: ['Plateau de fromages à pâte dure', 'Pizza aux champignons', 'Charcuterie fine'],
      avoid: ['Poisson délicat', 'Desserts très sucrés', 'Huîtres'],
    },
    Blanc: {
      perfect: ['Sole meunière au beurre noisette', 'Saint-Jacques poêlées', 'Risotto aux truffes blanches'],
      good: ['Poulet rôti aux herbes', 'Salade de chèvre chaud', 'Terrine de saumon'],
      avoid: ['Viande rouge puissante', 'Fromages très forts', 'Plats épicés'],
    },
    Rosé: {
      perfect: ['Bouillabaisse', 'Grillades d\'été', 'Salade niçoise'],
      good: ['Pizza Margherita', 'Charcuterie corse', 'Tapenade'],
      avoid: ['Viande rouge en sauce', 'Fromages forts'],
    },
    Champagne: {
      perfect: ['Huîtres de Bretagne', 'Homard thermidor', 'Caviar Osciètre'],
      good: ['Sushi et sashimi', 'Canapés au saumon fumé', 'Risotto au parmesan'],
      avoid: ['Plats très épicés', 'Desserts au chocolat noir'],
    },
    'Blanc liquoreux': {
      perfect: ['Foie gras poêlé aux pommes', 'Roquefort', 'Tarte Tatin aux pommes caramélisées'],
      good: ['Desserts aux fruits exotiques', 'Curry léger', 'Fromage bleu'],
      avoid: ['Viandes grillées', 'Salades vertes', 'Poisson fumé fort'],
    },
  };

  return pairings[type || 'Rouge'] || pairings.Rouge;
}

function getServingTemp(type?: string): string {
  const temps: Record<string, string> = {
    Rouge: '16-18°C (sortir du réfrigérateur 30 min avant)',
    Blanc: '8-12°C (réfrigérateur 2-3h avant)',
    Rosé: '8-10°C (réfrigérateur 3h avant)',
    Champagne: '6-8°C (réfrigérateur toute la nuit)',
    Pétillant: '6-8°C (réfrigérateur 3h minimum)',
    'Blanc liquoreux': '6-8°C (réfrigérateur toute la nuit)',
    Orange: '12-14°C (légèrement frais)',
  };
  return temps[type || 'Rouge'] || '14-16°C';
}

function getGlassType(type?: string, region?: string): string {
  if (type === 'Champagne' || type === 'Pétillant') return 'Flûte à champagne ou verre tulipe pour mieux apprécier les arômes';
  if (type === 'Blanc') return 'Verre à vin blanc à ouverture moyenne pour conserver la fraîcheur';
  if (type === 'Blanc liquoreux') return 'Verre à dessert ou verre à vin blanc plus petit';
  if (type === 'Rosé') return 'Verre à vin blanc ou rosé légèrement évasé';
  if (region?.includes('Bourgogne') || region?.includes('Burgundy')) return 'Grand verre Bourgogne en ballon pour concentrer les arômes complexes';
  return 'Grand verre Bordeaux à large ouverture pour aérer les tannins';
}

function getAgingPotential(type?: string, year?: number, region?: string): string {
  if (!year) return 'Consulter le producteur pour les conseils de garde';
  const currentYear = new Date().getFullYear();

  if (type === 'Blanc liquoreux') return `À boire entre ${currentYear} et ${year + 30}. Les grands liquoreux gagnent à vieillir.`;
  if (type === 'Champagne') return `À consommer idéalement avant ${year + 5}. Déjà à son apogée.`;
  if (type === 'Blanc') return `À boire avant ${year + 5}. Les blancs secs se dégustent jeunes.`;
  if (type === 'Rouge') {
    if (region?.includes('Bordeaux') || region?.includes('Bourgogne')) {
      return `Potentiel de garde jusqu'en ${year + 20}. Pic de maturité estimé entre ${year + 8} et ${year + 15}.`;
    }
    return `À boire entre maintenant et ${year + 8}.`;
  }
  return `À déguster entre ${currentYear} et ${year + 5}.`;
}

function generateTastingNotes(
  type?: string,
  _region?: string,
  _grapes?: string[] | string
): WineAnalysis['tastingNotes'] {
  const notes: Record<string, NonNullable<WineAnalysis['tastingNotes']>> = {
    Rouge: {
      color: 'Rouge grenat profond aux reflets pourpres',
      nose: ['Fruits noirs mûrs (mûre, cassis)', 'Notes boisées élégantes', 'Épices douces (vanille, cannelle)'],
      palate: ['Tannins soyeux et bien intégrés', 'Belle fraîcheur en bouche', 'Complexité aromatique agréable'],
      finish: 'Finale persistante et équilibrée, notes de fruits et de torréfaction',
      structure: 'Vin équilibré avec une belle matière et une acidité bien présente',
    },
    Blanc: {
      color: 'Jaune doré aux reflets verts et brillants',
      nose: ['Agrumes frais (citron, pamplemousse)', 'Fleurs blanches (acacia, fleur d\'oranger)', 'Minéralité crayeuse'],
      palate: ['Attaque vive et fraîche', 'Bonne tension acidulée', 'Texture ample et ronde'],
      finish: 'Finale longue et minérale, très agréable',
      structure: 'Vin frais et tendu, sur la vivacité et la minéralité',
    },
    Rosé: {
      color: 'Robe rose pâle aux reflets saumonés et lumineux',
      nose: ['Fruits rouges frais (fraise, framboise)', 'Fleurs printanières', 'Légère touche d\'agrumes'],
      palate: ['Attaque fraîche et fruitée', 'Bouche souple et légère', 'Bonne longueur aromatique'],
      finish: 'Finale fraîche et légèrement persistante',
      structure: 'Vin léger et désaltérant, idéal en apéritif',
    },
    Champagne: {
      color: 'Robe or pâle aux bulles fines et persistantes formant un beau cordon',
      nose: ['Brioche fraîche et levurée', 'Fruits à chair blanche (poire, pomme)', 'Légères notes florales'],
      palate: ['Bulles fines et agréables', 'Belle fraîcheur et vivacité', 'Dosage équilibré et élégant'],
      finish: 'Finale fraîche et légèrement crémeuse, belle longueur',
      structure: 'Champagne équilibré entre fraîcheur et richesse',
    },
    'Blanc liquoreux': {
      color: 'Or ambré profond aux reflets cuivrés et lumineux',
      nose: ['Miel d\'acacia et cire d\'abeille', 'Abricot confit et pêche de vigne', 'Notes botrytisées complexes'],
      palate: ['Douceur enveloppante et harmonieuse', 'Acidité remarquable qui équilibre la sucrosité', 'Texture onctueuse et veloutée'],
      finish: 'Finale infiniment longue aux notes de safran et de gingembre confit',
      structure: 'Grand vin liquoreux d\'une complexité et d\'une longueur exceptionnelles',
    },
  };

  return notes[type || 'Rouge'] || notes.Rouge;
}

// ─── HELPER ENRICHISSEMENT DONNÉES ────────────────────────

export async function enrichWineData(wine: WineAnalysis): Promise<Record<string, unknown>> {
  const pairings = wine.foodPairings?.perfect || getDefaultFoodPairings(wine.type)?.perfect || [];
  const estimatedPrice = calculateEstimatedPrice(wine);

  // Bottle prices : base on AI data if valid, otherwise fallback to estimated
  const aiBP = wine.bottlePrices;
  const cl750 = (aiBP?.cl750 && aiBP.cl750 > 0) ? aiBP.cl750 : estimatedPrice;

  // Toujours calculer les 3 formats courants. Si l'IA a fourni un prix → l'utiliser.
  // Sinon → estimer à partir du cl750 (ratios de marché réels)
  const isChampagneWine = ['Champagne', 'Pétillant', 'Mousseux'].includes(wine.type || '');
  const bottlePrices: { cl1875?: number; cl375?: number; cl750?: number; cl1500?: number; cl3000?: number; cl6000?: number } = {
    // Piccolo (18,75cl) : champagne uniquement si IA le précise
    ...(aiBP?.cl1875 && aiBP.cl1875 > 0 ? { cl1875: aiBP.cl1875 } : isChampagneWine ? { cl1875: Math.round(cl750 * 0.55) } : {}),
    // Demi-bouteille (37,5cl) : toujours calculé
    cl375: (aiBP?.cl375 && aiBP.cl375 > 0) ? aiBP.cl375 : Math.round(cl750 * 0.60),
    // Bouteille standard (75cl) : toujours présent
    cl750,
    // Magnum (1,5L) : toujours calculé
    cl1500: (aiBP?.cl1500 && aiBP.cl1500 > 0) ? aiBP.cl1500 : Math.round(cl750 * 1.85),
    // Jéroboam/Double Magnum (3L) : uniquement si IA le précise
    ...(aiBP?.cl3000 && aiBP.cl3000 > 0 ? { cl3000: aiBP.cl3000 } : {}),
    // Mathusalem/Impériale (6L) : uniquement si IA le précise
    ...(aiBP?.cl6000 && aiBP.cl6000 > 0 ? { cl6000: aiBP.cl6000 } : {}),
  };

  const mid = cl750;

  // Price range : use AI-provided range if valid (non-zero placeholders), otherwise compute ±30% around mid
  const aiRange = wine.priceRange;
  const priceRange: { min: number; max: number } =
    aiRange && aiRange.min > 0 && aiRange.max > 0 && aiRange.max > aiRange.min
      ? { min: aiRange.min, max: aiRange.max }
      : { min: Math.max(1, Math.round(mid * 0.70)), max: Math.round(mid * 1.38) };

  return {
    avgPrice: bottlePrices.cl750 ?? estimatedPrice,
    bottlePrices,
    priceRange,
    rating: calculateEstimatedRating(wine),
    description: wine.story || wine.tastingNotes?.structure || 'Un vin d\'excellente facture.',
    foodPairings: Array.isArray(pairings) ? pairings : [pairings],
    intensity: calculateIntensity(wine.type),
    aroma: calculateAroma(wine.type),
    sweetness: calculateSweetness(wine.type),
    servingTemp: wine.servingTemp || getServingTemp(wine.type),
    glassType: wine.glassType || getGlassType(wine.type, wine.region),
    agingPotential: wine.agingPotential || '',
    decanting: wine.decanting || '',
    tastingNotes: wine.tastingNotes || generateTastingNotes(wine.type, wine.region, wine.grapes),
    tips: wine.tips || [],
    story: wine.story,
  };
}

function calculateEstimatedPrice(wine: WineAnalysis): number {
  const fullText = [wine.name, wine.appellation, wine.region, wine.chateau, wine.producer].filter(Boolean).join(' ').toLowerCase();

  // Tier 0 : vins iconiques à prix connus (fallback stable si IA échoue)
  const iconicPrices: [string, number][] = [
    ['petrus', 3500], ['romanée-conti', 12000], ['romanee conti', 12000],
    ['screaming eagle', 2500], ['masseto', 350], ['opus one', 220],
    ['le pin', 3000], ['lafleur', 800], ['cheval blanc', 600],
    ['mouton rothschild', 500], ['haut-brion', 450], ['ausone', 800],
    ['montrachet', 300], ["yquem", 400], ["d'yquem", 400],
  ];
  for (const [key, price] of iconicPrices) {
    if (fullText.includes(key)) return price;
  }

  // Tier 1 : grands crus, appellations prestige
  const ultraKeywords = ['romanée', 'chambertin', 'musigny', 'richebourg', 'corton', 'montrachet'];
  if (ultraKeywords.some(k => fullText.includes(k))) return Math.floor(Math.random() * 300) + 150;

  // Tier 2 : appellations premium
  const premiumKeywords = ['margaux', 'pauillac', 'pomerol', 'chambolle', 'gevrey', 'meursault', 'puligny'];
  if (premiumKeywords.some(k => fullText.includes(k))) return Math.floor(Math.random() * 150) + 60;

  // Tier 3 : appellations intermédiaires
  const midKeywords = ['bordeaux', 'bourgogne', 'champagne', 'sancerre', 'pouilly', 'saint-émilion', 'saint-emilion', 'châteauneuf', 'chateauneuf'];
  if (midKeywords.some(k => fullText.includes(k))) return Math.floor(Math.random() * 30) + 18;

  if (wine.classification?.includes('Cru')) return Math.floor(Math.random() * 40) + 25;
  return Math.floor(Math.random() * 15) + 7;
}

function calculateEstimatedRating(_wine: WineAnalysis): number {
  return Math.floor(Math.random() * 8) + 88;
}

function calculateIntensity(type?: string): number {
  const intensities: Record<string, number> = {
    Rouge: 70, Blanc: 35, Rosé: 30,
    Champagne: 25, 'Blanc liquoreux': 40, Orange: 55,
  };
  return (intensities[type || 'Rouge'] || 60) + Math.floor(Math.random() * 20) - 10;
}

function calculateAroma(type?: string): number {
  const aromas: Record<string, number> = {
    Rouge: 65, Blanc: 40, Rosé: 35,
    Champagne: 45, 'Blanc liquoreux': 70,
  };
  return (aromas[type || 'Rouge'] || 55) + Math.floor(Math.random() * 15) - 7;
}

function calculateSweetness(type?: string): number {
  const sweetness: Record<string, number> = {
    Rouge: 15, Blanc: 10, Rosé: 20,
    Champagne: 25, 'Blanc liquoreux': 85, Orange: 10,
  };
  return sweetness[type || 'Rouge'] || 15;
}
