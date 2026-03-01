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
  return fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
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

const WINE_EXPERT_PROMPT = `Expert sommelier. Analyse l'étiquette de vin. Réponds UNIQUEMENT en JSON valide, pas de markdown.
RÈGLE: "name" = nom EXACT sur l'étiquette. Ne jamais inventer. Lis tout le texte visible.
Déduis les infos manquantes si possible (ex: Pauillac 2018 → Cabernet). Type = texte étiquette ou couleur du liquide.

Format JSON attendu :
{
  "name": "Nom complet du vin tel qu'écrit sur l'étiquette",
  "chateau": "Nom du château si applicable",
  "domaine": "Nom du domaine si applicable",
  "producer": "Nom du producteur ou négociant",
  "year": 2019,
  "region": "Grande région viticole (ex: Bordeaux, Bourgogne, Champagne, Rhône, Loire, Alsace, Languedoc, Provence, Toscane, Rioja, Napa Valley...)",
  "subRegion": "Sous-région si applicable (ex: Médoc, Côte de Nuits, Côte des Blancs...)",
  "appellation": "Appellation précise avec son statut (ex: AOC Pauillac, AOC Meursault, DOC Barolo, AVA Napa Valley...)",
  "village": "Commune si mentionnée",
  "country": "Pays d'origine",
  "type": "Rouge|Blanc|Rosé|Champagne|Pétillant|Blanc liquoreux|Orange|Mousseux",
  "grapes": ["Cépage 1", "Cépage 2"],
  "alcohol": "13.5%",
  "classification": "Classement si applicable (ex: 1er Grand Cru Classé, Premier Cru, Grand Cru, Cru Bourgeois, DOCG...)",
  "tastingNotes": {
    "color": "Description de la couleur et de la robe",
    "nose": ["Arôme 1", "Arôme 2", "Arôme 3"],
    "palate": ["Sensation 1", "Sensation 2", "Sensation 3"],
    "finish": "Description de la finale",
    "structure": "Description de la structure"
  },
  "servingTemp": "Température de service idéale",
  "decanting": "Conseils de carafage",
  "agingPotential": "Potentiel de garde",
  "glassType": "Type de verre recommandé",
  "foodPairings": {
    "perfect": ["Accord parfait 1", "Accord parfait 2", "Accord parfait 3"],
    "good": ["Bon accord 1", "Bon accord 2", "Bon accord 3"],
    "avoid": ["À éviter 1", "À éviter 2"]
  },
  "tips": ["Conseil 1", "Conseil 2", "Conseil 3"],
  "story": "Anecdote ou histoire courte sur ce vin ou sa région (2-3 phrases)",
  "confidence": 90,
  "labelReadability": "excellent|good|poor"
}
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
    max_tokens: 1000,
    temperature: 0.1,
    response_format: { type: 'json_object' }
  });

  const data = await response.json();

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
  return {
    avgPrice: calculateEstimatedPrice(wine),
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
  const premiumKeywords = ['Margaux', 'Pauillac', 'Pomerol', 'Romanée', 'Chambolle', 'Gevrey', 'Montrachet', 'Yquem', 'Petrus'];
  const midKeywords = ['Bordeaux', 'Bourgogne', 'Champagne', 'Sancerre', 'Pouilly', 'Saint-Émilion', 'Châteauneuf'];
  const fullText = [wine.name, wine.appellation, wine.region, wine.chateau].filter(Boolean).join(' ');

  if (premiumKeywords.some(k => fullText.includes(k))) return Math.floor(Math.random() * 200) + 80;
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
