import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Utensils, Wine, Thermometer, RotateCcw, Sparkles } from 'lucide-react';
import { canAccessFeature } from '../utils/subscription';

interface CaveBottle {
  id: string;
  name: string;
  year: number;
  region: string;
  type: string;
  quantity: number;
  purchasePrice: number;
  estimatedCurrentValue: number;
  status?: string;
  [key: string]: unknown;
}

const PLAT_SUGGESTIONS = [
  { emoji: '🥩', label: 'Bœuf bourguignon' },
  { emoji: '🐟', label: 'Saumon grillé' },
  { emoji: '🍗', label: 'Poulet rôti' },
  { emoji: '🦞', label: 'Homard' },
  { emoji: '🧀', label: 'Plateau de fromages' },
  { emoji: '🥗', label: 'Salade de chèvre chaud' },
  { emoji: '🍕', label: 'Pizza' },
  { emoji: '🦆', label: 'Magret de canard' },
  { emoji: '🍝', label: 'Pâtes carbonara' },
  { emoji: '🥘', label: 'Tajine d\'agneau' },
  { emoji: '🍲', label: 'Risotto aux champignons' },
  { emoji: '🍣', label: 'Sushi' },
];

export function CaveMeal() {
  const navigate = useNavigate();
  const [dish, setDish] = useState('');
  const [cave, setCave] = useState<CaveBottle[]>([]);
  const [result, setResult] = useState<{
    topPick: { name: string; year: number; score: number; reason: string };
    alternatives: { name: string; year: number; reason: string }[];
    avoid: { name: string; reason: string }[];
    advice: string;
    servingTemp: string;
    decanting: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!canAccessFeature('cavemeal')) {
      navigate('/premium');
      return;
    }
    const c = localStorage.getItem('sommely_cave_v3');
    if (c) {
      try {
        setCave(JSON.parse(c));
      } catch {
        setCave([]);
      }
    }
  }, [navigate]);

  const askAntoine = async (dishText: string) => {
    if (!dishText.trim() || cave.length === 0) return;

    setResult(null);
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      const caveContext = cave
        .slice(0, 15)
        .map(
          (b: CaveBottle) =>
            `- ${b.name} ${b.year} (${b.quantity}x) · ${b.type} · ${b.region} · Statut: ${b.status || 'ok'}`
        )
        .join('\n');

      const systemPrompt = `Tu es Antoine, sommelier expert. L'utilisateur a une cave virtuelle et cuisine un plat. Choisis LA meilleure bouteille de sa cave pour accompagner ce plat.

CAVE (${cave.length} références) :
${caveContext}

PLAT : ${dishText}

Réponds UNIQUEMENT en JSON valide, sans markdown, sans backticks :
{
  "topPick": { "name": "Nom du vin", "year": 2018, "score": 92, "reason": "Pourquoi ce vin est parfait pour ce plat (2 phrases)" },
  "alternatives": [ { "name": "Nom vin 2", "year": 2020, "reason": "Pourquoi bien aussi" } ],
  "avoid": [ { "name": "Nom vin à éviter", "reason": "Pourquoi" } ],
  "advice": "Conseil sommelier court (1-2 phrases)",
  "servingTemp": "14-16°C",
  "decanting": "Carafage 30 min recommandé" ou "Pas besoin de carafage"
}`;

      const res = await fetch('/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: `Plat : ${dishText}` }],
          max_tokens: 800,
          temperature: 0.3,
          response_format: { type: 'json_object' },
        }),
      });

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);
      setResult(parsed);
    } catch {
      setResult({
        topPick: { name: 'Erreur', year: 0, score: 0, reason: "Impossible de traiter la demande." },
        alternatives: [],
        avoid: [],
        advice: 'Réessayez plus tard.',
        servingTemp: '14-16°C',
        decanting: 'Selon le vin',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream font-body">
      <div className="bg-white border-b border-gray-light/30 px-5 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <button onClick={() => navigate(-1)} className="bg-transparent border-none cursor-pointer p-1">
          <ArrowLeft size={20} color="#722F37" />
        </button>
        <div className="flex items-center gap-2">
          <Utensils size={20} color="#722F37" />
          <span className="font-display text-base font-bold text-burgundy-dark">Ce soir je cuisine...</span>
        </div>
        <div className="w-8" />
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">👨‍🍳</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-black-wine mb-2">Quelle bouteille ouvrir ?</h1>
          <p className="text-gray-dark text-sm">
            Décrivez votre plat et Antoine choisira la meilleure bouteille de votre cave.
          </p>
        </motion.div>

        <div className="bg-white rounded-2xl border border-gray-light/30 shadow-sm p-4">
          <p className="text-xs font-bold text-gray-dark uppercase tracking-wide mb-3">Suggestions rapides</p>
          <div className="grid grid-cols-3 gap-2">
            {PLAT_SUGGESTIONS.map((p, i) => (
              <button
                key={i}
                onClick={() => {
                  setDish(p.label);
                  askAntoine(p.label);
                }}
                disabled={isLoading || cave.length === 0}
                className="flex items-center gap-2 p-3 rounded-xl border border-gray-light/40 bg-cream/50 hover:bg-orange-50 hover:border-orange-200 transition-all cursor-pointer disabled:opacity-50"
              >
                <span className="text-xl">{p.emoji}</span>
                <span className="text-xs font-medium text-black-wine truncate">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-light/30 shadow-sm p-4">
          <p className="text-xs font-bold text-gray-dark uppercase tracking-wide mb-2">Ou décrivez votre plat</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={dish}
              onChange={(e) => setDish(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && askAntoine(dish)}
              placeholder="Ex: blanquette de veau, poulet curry..."
              className="flex-1 px-4 py-3 rounded-xl border border-gray-light/40 bg-cream/30 text-black-wine placeholder-gray-dark outline-none focus:border-burgundy-dark/40"
            />
            <button
              onClick={() => askAntoine(dish)}
              disabled={!dish.trim() || isLoading || cave.length === 0}
              className="px-5 py-3 bg-burgundy-dark text-white rounded-xl font-semibold text-sm border-none cursor-pointer disabled:opacity-40 hover:bg-burgundy-medium transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Sparkles size={18} />
              )}
              Trouver
            </button>
          </div>
        </div>

        {cave.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-gray-light p-8 text-center">
            <span className="text-5xl block mb-3">🍾</span>
            <p className="font-display text-lg font-bold text-black-wine mb-2">Cave vide</p>
            <p className="text-gray-dark text-sm mb-4">Ajoutez des bouteilles dans Ma cave pour utiliser cette fonctionnalité.</p>
            <button onClick={() => navigate('/cave')} className="bg-burgundy-dark text-white px-6 py-3 rounded-full font-semibold text-sm border-none cursor-pointer">
              Aller à Ma cave
            </button>
          </div>
        )}

        {result && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="bg-gradient-to-br from-burgundy-dark/10 to-gold/5 rounded-2xl border border-gold/30 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Wine size={20} color="#722F37" />
                <span className="font-display font-bold text-black-wine">Meilleur choix</span>
                {result.topPick.score > 0 && (
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-gold/30 text-black-wine text-xs font-bold">
                    {result.topPick.score}/100
                  </span>
                )}
              </div>
              <p className="font-display text-xl font-bold text-burgundy-dark mb-1">
                {result.topPick.name} {result.topPick.year && result.topPick.year}
              </p>
              <p className="text-sm text-gray-dark leading-relaxed">{result.topPick.reason}</p>
            </div>

            <div className="flex gap-3">
              <div className="flex-1 bg-white rounded-xl border border-gray-light/30 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Thermometer size={14} color="#6B5D56" />
                  <span className="text-xs font-bold text-gray-dark">Service</span>
                </div>
                <p className="text-sm text-black-wine">{result.servingTemp}</p>
              </div>
              <div className="flex-1 bg-white rounded-xl border border-gray-light/30 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <RotateCcw size={14} color="#6B5D56" />
                  <span className="text-xs font-bold text-gray-dark">Carafage</span>
                </div>
                <p className="text-sm text-black-wine">{result.decanting}</p>
              </div>
            </div>

            {result.alternatives && result.alternatives.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-light/30 p-4">
                <p className="text-xs font-bold text-gray-dark uppercase tracking-wide mb-2">Alternatives</p>
                <ul className="space-y-2">
                  {result.alternatives.map((a, i) => (
                    <li key={i} className="text-sm text-black-wine">
                      <span className="font-semibold">{a.name} {a.year && a.year}</span>
                      <span className="text-gray-dark"> · {a.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.avoid && result.avoid.length > 0 && (
              <div className="bg-red-50 rounded-2xl border border-red-200 p-4">
                <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-2">À éviter ce soir</p>
                <ul className="space-y-1 text-sm text-red-800">
                  {result.avoid.map((a, i) => (
                    <li key={i}>
                      {a.name} · {a.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.advice && (
              <div className="bg-gold/10 rounded-2xl border border-gold/30 p-4">
                <p className="text-xs font-bold text-black-wine uppercase tracking-wide mb-1">Conseil du sommelier</p>
                <p className="text-sm text-black-wine leading-relaxed">{result.advice}</p>
              </div>
            )}
          </motion.div>
        )}

        <div className="h-6" />
      </div>
    </div>
  );
}
