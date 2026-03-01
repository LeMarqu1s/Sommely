export interface Wine {
  id: string
  name: string
  year: number
  region: string
  imageUrl: string
  score: number
  profilGout: number
  cepage?: string
  prixMoyen?: string
}

export const MOCK_WINES: Wine[] = [
  {
    id: '1',
    name: 'Château Margaux',
    year: 2019,
    region: 'Bordeaux, Margaux',
    imageUrl: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=200',
    score: 95,
    profilGout: 98,
    cepage: 'Cabernet Sauvignon, Merlot',
    prixMoyen: '~ 650 €',
  },
  {
    id: '2',
    name: 'Domaine Leflaive Puligny-Montrachet',
    year: 2020,
    region: 'Bourgogne',
    imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=200',
    score: 92,
    profilGout: 88,
    cepage: 'Chardonnay',
    prixMoyen: '~ 120 €',
  },
  {
    id: '3',
    name: 'Château de Beaucastel',
    year: 2018,
    region: 'Rhône, Châteauneuf-du-Pape',
    imageUrl: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=200',
    score: 91,
    profilGout: 85,
    cepage: 'Grenache, Syrah, Mourvèdre',
    prixMoyen: '~ 55 €',
  },
  {
    id: '4',
    name: 'Champagne Dom Pérignon',
    year: 2012,
    region: 'Champagne',
    imageUrl: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=200',
    score: 96,
    profilGout: 92,
    cepage: 'Chardonnay, Pinot Noir',
    prixMoyen: '~ 180 €',
  },
  {
    id: '5',
    name: 'E. Guigal Côte-Rôtie',
    year: 2019,
    region: 'Rhône, Côte-Rôtie',
    imageUrl: 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=200',
    score: 94,
    profilGout: 90,
    cepage: 'Syrah, Viognier',
    prixMoyen: '~ 45 €',
  },
]
