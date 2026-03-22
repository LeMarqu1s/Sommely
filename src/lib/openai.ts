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
  alcohol?: string | number;
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

  // Timeout 15s — aligné sur Scanner ; proxy Vercel en prod (/api/openai-proxy)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

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
      throw new Error("L'analyse a pris trop de temps. Réessayez en vous rapprochant de l'étiquette.");
    }
    throw err;
  }
}

// ─── CACHE ────────────────────────────────────────────────

const ANALYSIS_CACHE_MAX = 50;
const analysisCache = new Map<string, WineAnalysis>();

function trimCache() {
  if (analysisCache.size > ANALYSIS_CACHE_MAX) {
    const keys = Array.from(analysisCache.keys()).slice(0, analysisCache.size - ANALYSIS_CACHE_MAX);
    keys.forEach(k => analysisCache.delete(k));
  }
}

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
ÉTAPE 2 — RECHERCHE LE PRIX RÉEL : donne des prix réels du marché actuel (2024-2025) pour CE vin précis.
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
  "alcohol": "ex: 13.5% ou 13,5° — toujours inclure si visible sur l'étiquette ou connu",
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

PRIX - Règles strictes et non négociables :
- cl750 : TOUJOURS un seul chiffre entier, jamais une fourchette (ex: 38, jamais '30-50')
- Base de référence obligatoire :
  * Vins de pays / IGP génériques : 5-12€
  * AOC régionales (Bordeaux, Bourgogne village, Côtes du Rhône) : 12-25€
  * AOC communales (Pauillac, Gevrey, Gigondas) : 25-80€
  * Champagne non-millésimé (Moët, Pommery, Taittinger) : 35-55€
  * Champagne prestige (Dom Pérignon, Cristal, Krug) : 150-400€
  * Grands crus classés Bordeaux (Margaux, Latour, Mouton) : 400-800€
  * Bourgogne grands crus (DRC, Rousseau, Leroy) : 300-3000€
  * Pétrus, Le Pin : 2000-5000€
- Si l'étiquette montre le prix : utiliser ce prix comme base
- cl375 : uniquement si ce format est connu pour ce vin, prix = cl750 × 0.6
- cl1500 : uniquement si ce format est connu, prix = cl750 × 2.0

ALCOOL - Règles strictes :
- Toujours retourner un nombre décimal (ex: 13.5, pas '13,5%')
- Références par appellation :
  * Champagne/Crémant : 12.0-12.5
  * Alsace blanc : 12.5-14.0
  * Bourgogne blanc : 12.5-13.5
  * Bourgogne rouge : 13.0-14.0
  * Bordeaux rouge : 13.0-14.5
  * Côtes du Rhône : 13.5-15.0
  * Loire blanc sec : 12.0-13.0
  * Sauternes/liquoreux : 13.0-14.0
  * Vin de pays léger : 11.5-12.5
- Si visible sur étiquette, utiliser la valeur exacte de l'étiquette

Si pas une étiquette de vin : {"error": "not_wine", "confidence": 0}

NOTE — Score & « pourquoi ce score » (hors de ce JSON) :
L'application calcule le score personnalisé après analyse, puis génère une explication courte (2–3 phrases max).
Style attendu pour ce texte côté app : honnête, un peu sarcastique, jamais condescendant.
Exemples de ton :
- Score élevé : « Ce vin correspond exactement à ce que vous aimez. Acheté en cave à 18€, servi à 85€ au resto. Vous méritez de savoir. »
- Score moyen-bas : « Techniquement potable. Mais pour votre profil, c'est comme mettre du ketchup sur du foie gras. »
- Score intermédiaire : « Un bon vin. Juste pas votre vin. La différence est importante. »
Toujours mentionner un élément concret : prix, profil, ou caractéristique. Jamais de jargon oenologique sans explication.`;


// ─── PROMPT CARTE DES VINS ─────────────────────────────────

const MENU_SYSTEM = `Tu es un expert en vins et cartes de restaurant.
Tu analyses des photos de cartes des vins.
Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte avant ou après.
Format exact requis : tableau JSON d'objets vin.`;

const MENU_USER = `Analyse cette carte des vins. Pour chaque vin visible :
{
  name: string,
  appellation: string,
  vintage: number | null,
  restaurant_price: number,
  estimated_market_price: number,
  margin_percent: number,
  score: number (1-100),
  recommendation: 'excellent' | 'good' | 'skip',
  reason: string (1 phrase max)
}
Si tu ne peux pas lire clairement un élément, mets null.
Si la photo n'est pas une carte des vins, retourne [].
Analyse TOUS les vins visibles.`;

export interface MenuWineItem {
  name: string;
  appellation: string;
  vintage: number | null;
  restaurant_price: number;
  estimated_market_price: number;
  margin_percent: number;
  score: number;
  recommendation: 'excellent' | 'good' | 'skip';
  reason: string;
}

/** Analyse une photo de carte des vins. Retourne le tableau de vins ou [] si invalide. */
export async function analyzeWineMenu(imageBase64: string): Promise<MenuWineItem[]> {
  const optimized = await optimizeImageForAI(imageBase64, 1536, 0.82);
  const response = await fetchOpenAI({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: MENU_SYSTEM },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${optimized}`, detail: 'high' } },
          { type: 'text', text: MENU_USER },
        ],
      },
    ],
    max_tokens: 2500,
    temperature: 0.1,
    response_format: { type: 'json_object' },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `Erreur ${response.status}`);
  }

  const content = data.choices?.[0]?.message?.content || '{}';
  let parsed: { wines?: MenuWineItem[] } | MenuWineItem[];
  try {
    parsed = JSON.parse(content);
  } catch {
    return [];
  }

  // Accepte tableau direct ou { wines: [...] }
  const arr = Array.isArray(parsed) ? parsed : parsed?.wines;
  if (!Array.isArray(arr)) return [];
  return arr.filter((w): w is MenuWineItem => w && typeof w.name === 'string');
}

// ─── ESTIMATION CAVE (UNE FOIS À L'AJOUT, PRIX FIGÉ EN BASE) ───

export interface CaveBottleEstimateResult {
  estimatedCurrentValue: number;
  drinkFrom: number;
  drinkUntil: number;
  peakYear: number;
  grapes: string;
  appellation: string;
  agingNote: string;
}

/** Estimation unique à l’ajout : stockée en DB, ne pas rappeler pour des « variations » quotidiennes. */
export async function estimateCaveBottleAtAdd(params: {
  name: string;
  year: number;
  region: string;
  type: string;
  purchasePrice: number;
}): Promise<CaveBottleEstimateResult> {
  const res = await fetchOpenAI({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Expert vins fins. JSON uniquement. Une estimation de prix marché cohérente, pas de variation quotidienne fictive.' },
      {
        role: 'user',
        content: `Vin: "${params.name}" ${params.year} ${params.region} ${params.type} | Achat: ${params.purchasePrice}€\nJSON:\n{"estimatedCurrentValue":0,"drinkFrom":0,"drinkUntil":0,"peakYear":0,"grapes":"","appellation":"","agingNote":""}`,
      },
    ],
    max_tokens: 200,
    temperature: 0,
    response_format: { type: 'json_object' },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as { error?: { message?: string } }).error?.message || `Erreur ${res.status}`);
  }
  const raw = JSON.parse((data as { choices?: { message?: { content?: string } }[] }).choices?.[0]?.message?.content || '{}');
  const y = new Date().getFullYear();
  return {
    estimatedCurrentValue: Math.max(0, Number(raw.estimatedCurrentValue) || Math.round(params.purchasePrice * 1.05)),
    drinkFrom: Number(raw.drinkFrom) || y + 2,
    drinkUntil: Number(raw.drinkUntil) || y + 8,
    peakYear: Number(raw.peakYear) || y + 4,
    grapes: String(raw.grapes || ''),
    appellation: String(raw.appellation || ''),
    agingNote: String(raw.agingNote || ''),
  };
}

// ─── ANALYSE PRINCIPALE ───────────────────────────────────

export async function analyzeWineLabel(imageBase64: string): Promise<WineAnalysis> {
  const cacheKey = hashImage(imageBase64);
  if (analysisCache.has(cacheKey)) {
    return analysisCache.get(cacheKey)!;
  }

  const optimized = await optimizeImageForAI(imageBase64, 400, 0.6);
  const response = await fetchOpenAI({
    model: 'gpt-4o-mini',
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
    max_tokens: 800,
    temperature: 0,
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
  trimCache();
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

  // Bottle prices : formats confirmés par l'IA + lookup pour vins iconiques connus
  const aiBP = wine.bottlePrices;
  const cl750 = (aiBP?.cl750 && aiBP.cl750 > 0) ? aiBP.cl750 : estimatedPrice;

  // Table des formats RÉELS pour vins iconiques (ratio prix établis par le marché)
  // cl375 ≈ 58%, cl1500 ≈ 210%, cl3000 ≈ 430%, cl6000 ≈ 870% du prix 75cl
  const KNOWN_MULTI_FORMAT: { keys: string[]; formats: ('cl375'|'cl1500'|'cl3000'|'cl6000')[] }[] = [
    { keys: ['petrus','pétrus'],              formats: ['cl375','cl1500','cl3000','cl6000'] },
    { keys: ['romanée-conti','romanee conti','drc'], formats: ['cl375','cl1500','cl3000'] },
    { keys: ['le pin'],                       formats: ['cl375','cl1500','cl3000'] },
    { keys: ['lafleur','la fleur'],           formats: ['cl375','cl1500'] },
    { keys: ['cheval blanc'],                 formats: ['cl375','cl1500','cl3000'] },
    { keys: ['ausone'],                       formats: ['cl375','cl1500','cl3000'] },
    { keys: ['mouton rothschild'],            formats: ['cl375','cl1500','cl3000','cl6000'] },
    { keys: ['lafite','lafite-rothschild'],   formats: ['cl375','cl1500','cl3000','cl6000'] },
    { keys: ['latour'],                       formats: ['cl375','cl1500','cl3000','cl6000'] },
    { keys: ['margaux','château margaux'],    formats: ['cl375','cl1500','cl3000'] },
    { keys: ['haut-brion','haut brion'],      formats: ['cl375','cl1500','cl3000'] },
    { keys: ['yquem',"d'yquem"],              formats: ['cl375','cl1500','cl3000'] },
    { keys: ['opus one'],                     formats: ['cl375','cl1500','cl3000'] },
    { keys: ['masseto'],                      formats: ['cl375','cl1500'] },
  ];
  const fullText = [wine.name, wine.chateau, wine.producer].filter(Boolean).join(' ').toLowerCase();
  const knownEntry = KNOWN_MULTI_FORMAT.find(e => e.keys.some(k => fullText.includes(k)));

  const RATIO: Record<string, number> = { cl375: 0.58, cl1500: 2.10, cl3000: 4.30, cl6000: 8.70 };

  const bottlePrices: { cl1875?: number; cl375?: number; cl750?: number; cl1500?: number; cl3000?: number; cl6000?: number } = {
    ...(aiBP?.cl1875 && aiBP.cl1875 > 0 ? { cl1875: aiBP.cl1875 } : {}),
    cl750,
    // Pour chaque format : AI en priorité → sinon lookup iconique → sinon rien
    ...(['cl375','cl1500','cl3000','cl6000'] as const).reduce((acc, fmt) => {
      const aiVal = aiBP?.[fmt];
      if (aiVal && aiVal > 0) { acc[fmt] = aiVal; }
      else if (knownEntry?.formats.includes(fmt)) { acc[fmt] = Math.round(cl750 * RATIO[fmt]); }
      return acc;
    }, {} as Record<string, number>),
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
