/**
 * 30 vins pour les pages SEO /vin/:slug
 */

export interface WineSeo {
  slug: string;
  name: string;
}

export const WINES_SEO: WineSeo[] = [
  { slug: 'chateau-margaux', name: 'Château Margaux' },
  { slug: 'petrus', name: 'Pétrus' },
  { slug: 'romanee-conti', name: 'Romanée-Conti' },
  { slug: 'sancerre', name: 'Sancerre' },
  { slug: 'chablis', name: 'Chablis' },
  { slug: 'muscadet', name: 'Muscadet' },
  { slug: 'cotes-du-rhone', name: 'Côtes du Rhône' },
  { slug: 'bordeaux-rouge', name: 'Bordeaux Rouge' },
  { slug: 'bourgogne-blanc', name: 'Bourgogne Blanc' },
  { slug: 'champagne-brut', name: 'Champagne Brut' },
  { slug: 'rose-provence', name: 'Rosé de Provence' },
  { slug: 'gewurztraminer', name: 'Gewurztraminer' },
  { slug: 'riesling-alsace', name: 'Riesling Alsace' },
  { slug: 'beaujolais-nouveau', name: 'Beaujolais Nouveau' },
  { slug: 'saint-emilion', name: 'Saint-Émilion' },
  { slug: 'pomerol', name: 'Pomerol' },
  { slug: 'medoc', name: 'Médoc' },
  { slug: 'graves', name: 'Graves' },
  { slug: 'entre-deux-mers', name: 'Entre-deux-Mers' },
  { slug: 'macon-villages', name: 'Mâcon-Villages' },
  { slug: 'pouilly-fume', name: 'Pouilly-Fumé' },
  { slug: 'vouvray', name: 'Vouvray' },
  { slug: 'chinon', name: 'Chinon' },
  { slug: 'languedoc', name: 'Languedoc' },
  { slug: 'bandol', name: 'Bandol' },
  { slug: 'crozes-hermitage', name: 'Crozes-Hermitage' },
  { slug: 'chateauneuf-du-pape', name: 'Châteauneuf-du-Pape' },
  { slug: 'gigondas', name: 'Gigondas' },
  { slug: 'hermitage', name: 'Hermitage' },
  { slug: 'condrieu', name: 'Condrieu' },
];

export const WINES_SEO_BY_SLUG: Record<string, WineSeo> = Object.fromEntries(
  WINES_SEO.map((w) => [w.slug, w])
);

export function getWineSeoBySlug(slug: string): WineSeo | undefined {
  return WINES_SEO_BY_SLUG[slug];
}
