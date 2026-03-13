import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Star, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../lib/supabase';

// ─── TYPES ────────────────────────────────────────────────

interface OnboardingData {
  name: string;
  experience: string;
  favoriteTypes: string[];
  budget: string;
  regions: string[];
  occasions: string[];
  flavors: string[];
  body: number;
}

// ─── ÉTAPES ───────────────────────────────────────────────

const STEPS = [
  { id: 'welcome', title: 'Bienvenue', subtitle: '' },
  { id: 'name', title: 'Comment vous appelez-vous ?', subtitle: 'Pour personnaliser votre expérience' },
  { id: 'experience', title: 'Votre niveau en vin ?', subtitle: 'Pas de jugement, on s\'adapte à vous' },
  { id: 'budget', title: 'Votre budget par bouteille ?', subtitle: 'En moyenne, combien dépensez-vous ?' },
  { id: 'regions', title: 'Régions que vous aimez ?', subtitle: 'Sélectionnez vos préférences' },
  { id: 'occasions', title: 'Quand buvez-vous du vin ?', subtitle: 'Plusieurs réponses possibles' },
  { id: 'intensity', title: 'Quelle intensité préférez-vous ?', subtitle: 'Des vins légers aux plus charpentés' },
  { id: 'preferences', title: 'Vos vins préférés ?', subtitle: 'Sélectionnez tout ce qui vous attire' },
  { id: 'ready', title: 'Votre sommelier IA est prêt !', subtitle: '' },
];

const WINE_TYPES = [
  { id: 'rouge_puissant', label: 'Rouge puissant', emoji: '🍷', desc: 'Bordeaux, Syrah...' },
  { id: 'rouge_elegants', label: 'Rouge élégant', emoji: '🌹', desc: 'Bourgogne, Pinot Noir...' },
  { id: 'blanc_sec', label: 'Blanc sec', emoji: '🥂', desc: 'Chablis, Sancerre...' },
  { id: 'blanc_riche', label: 'Blanc riche', emoji: '✨', desc: 'Meursault, Chardonnay...' },
  { id: 'champagne', label: 'Champagne & bulles', emoji: '🍾', desc: 'Champagne, Prosecco...' },
  { id: 'rose', label: 'Rosé', emoji: '🌸', desc: 'Provence, Côtes du Rhône...' },
  { id: 'naturel', label: 'Vin naturel', emoji: '🌿', desc: 'Biodynamique, orange...' },
  { id: 'liquoreux', label: 'Vins doux', emoji: '🍯', desc: 'Sauternes, Gewurz...' },
];

const EXPERIENCE_LEVELS = [
  { id: 'debutant', label: 'Curieux', emoji: '🌱', desc: 'Je commence à découvrir le vin' },
  { id: 'amateur', label: 'Amateur', emoji: '🍷', desc: 'J\'aime le vin, je veux en apprendre plus' },
  { id: 'passionne', label: 'Passionné', emoji: '⭐', desc: 'Je connais bien mes appellations' },
  { id: 'expert', label: 'Expert', emoji: '🏆', desc: 'Caves, millésimes, Liv-ex...' },
];

const BUDGET_OPTIONS = [
  { id: 'low', label: 'Moins de 10 €', emoji: '💰', desc: 'Bon rapport qualité-prix' },
  { id: 'medium', label: '10–20 €', emoji: '🍷', desc: 'Quotidien, bons crus' },
  { id: 'high', label: '20–45 €', emoji: '✨', desc: 'Belles bouteilles' },
  { id: 'premium', label: '45 € et plus', emoji: '🏆', desc: 'Grands crus, occasions spéciales' },
];

const REGION_OPTIONS = [
  { id: 'bordeaux', label: 'Bordeaux', emoji: '🍇' },
  { id: 'bourgogne', label: 'Bourgogne', emoji: '🌹' },
  { id: 'champagne', label: 'Champagne', emoji: '🍾' },
  { id: 'rhone', label: 'Rhône', emoji: '☀️' },
  { id: 'loire', label: 'Loire', emoji: '🌿' },
  { id: 'autre', label: 'Autres régions', emoji: '🗺️' },
];

const OCCASION_OPTIONS = [
  { id: 'apero', label: 'Apéro', emoji: '🥂' },
  { id: 'repas', label: 'Repas quotidien', emoji: '🍽️' },
  { id: 'romantique', label: 'Dîner romantique', emoji: '💕' },
  { id: 'fete', label: 'Fêtes & occasions', emoji: '🎉' },
  { id: 'degustation', label: 'Dégustation', emoji: '👃' },
  { id: 'cadeau', label: 'Cadeau', emoji: '🎁' },
];

const INTENSITY_OPTIONS = [
  { id: 'light', label: 'Léger & frais', emoji: '🌿', body: 2, desc: 'Faciles à boire' },
  { id: 'medium', label: 'Équilibré', emoji: '⚖️', body: 5, desc: 'Ni trop, ni trop peu' },
  { id: 'full', label: 'Charpenté & puissant', emoji: '🔥', body: 8, desc: 'Structure, tanins' },
];

// Mapping des types onboarding → clés attendues par matchScore (TYPE_MAPPING)
const TYPE_TO_MATCHSCORE: Record<string, string> = {
  rouge_puissant: 'red_bold',
  rouge_elegants: 'red_light',
  blanc_sec: 'white_dry',
  blanc_riche: 'white_dry',
  champagne: 'champagne',
  rose: 'rose',
  naturel: 'red_light',
  liquoreux: 'white_sweet',
};

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────

export function Onboarding() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    experience: '',
    favoriteTypes: [],
    budget: '',
    regions: [],
    occasions: [],
    flavors: [],
    body: 5,
  });

  const goNext = () => {
    setDirection(1);
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setDirection(-1);
    setStep(s => Math.max(s - 1, 0));
  };

  const toggleType = (id: string) => {
    setData(d => ({
      ...d,
      favoriteTypes: d.favoriteTypes.includes(id)
        ? d.favoriteTypes.filter(t => t !== id)
        : [...d.favoriteTypes, id],
    }));
  };

  const toggleMulti = (field: 'regions' | 'occasions', id: string) => {
    setData(d => ({
      ...d,
      [field]: (d[field].includes(id) ? d[field].filter(x => x !== id) : [...d[field], id]),
    }));
  };

  const finish = async () => {
    const firstName = data.name.trim().split(' ')[0] || data.name;
    const typesForScore = [...new Set(data.favoriteTypes.map(t => TYPE_TO_MATCHSCORE[t]).filter(Boolean))];
    const expertiseForScore = data.experience === 'debutant' ? 'beginner' : data.experience === 'expert' ? 'expert' : data.experience;
    const tasteProfile = {
      name: data.name,
      firstName,
      experience: data.experience,
      expertise: expertiseForScore,
      favoriteTypes: data.favoriteTypes,
      budget: data.budget,
      regions: data.regions.filter(r => r !== 'autre'),
      occasions: data.occasions,
      flavors: data.flavors,
      body: data.body,
      types: typesForScore,
      createdAt: new Date().toISOString(),
    };
    if (user?.id) {
      await updateProfile(user.id, { name: firstName, taste_profile: tasteProfile, onboarding_completed: true });
      refreshProfile();
    } else {
      localStorage.setItem('sommely_profile', JSON.stringify(tasteProfile));
      localStorage.setItem('sommely_onboarding_done', 'true');
    }
    navigate('/');
  };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  const currentStep = STEPS[step];
  const questionCount = STEPS.length - 2;
  const progress = step > 0 && step < STEPS.length - 1 ? (step / questionCount) * 100 : 0;

  return (
    <div className="min-h-screen bg-black-wine flex flex-col font-body overflow-hidden">

      {/* BARRE PROGRESSION */}
      {step > 0 && step < STEPS.length - 1 && (
        <div className="px-6 pt-12 pb-4">
          <div className="flex items-center gap-3 mb-2">
            {step > 1 && (
              <button type="button" onClick={goBack} className="bg-transparent border-none cursor-pointer p-1">
                <ChevronLeft size={20} color="rgba(255,255,255,0.5)" />
              </button>
            )}
            <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
              <motion.div
                className="h-full bg-gold rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <span className="text-white/40 text-xs">{Math.min(step, STEPS.length - 2)}/{STEPS.length - 2}</span>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col px-6 py-6 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex-1 flex flex-col"
          >

            {/* ══ ÉTAPE 0 : WELCOME ══ */}
            {step === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="w-28 h-28 rounded-3xl bg-burgundy-dark flex items-center justify-center mb-8 shadow-2xl overflow-hidden p-2"
                >
                  <img
                    src="/IMG_1639-transparent.png"
                    alt="Sommely"
                    width={80}
                    height={80}
                    className="object-contain w-20 h-20"
                    style={{ filter: 'brightness(0) invert(1)' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/Logo%20Sommely.jpeg';
                      (e.target as HTMLImageElement).style.filter = 'brightness(0) invert(1)';
                    }}
                  />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="font-display text-4xl font-bold text-white mb-3"
                >
                  Sommely
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/60 text-base leading-relaxed mb-4 max-w-xs"
                >
                  Votre sommelier expert personnel, disponible à tout moment.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col gap-2 mb-10 w-full max-w-xs"
                >
                  {[
                    '📸 Scannez n\'importe quel vin',
                    '🍽️ Accords mets & vins parfaits',
                    '🍾 Gérez votre cave',
                    '📈 Analysez la valeur de vos vins',
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="flex items-center gap-3 bg-white/5 rounded-2xl px-4 py-3"
                    >
                      <span className="text-sm text-white/80">{item}</span>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  onClick={goNext}
                  type="button"
                  className="w-full max-w-xs py-5 bg-gold text-black-wine rounded-2xl font-bold text-lg border-none cursor-pointer shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  Commencer <ChevronRight size={20} />
                </motion.button>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-white/30 text-xs mt-4"
                >
                  Gratuit · Sans carte bancaire
                </motion.p>
              </div>
            )}

            {/* ══ ÉTAPE 1 : NOM ══ */}
            {step === 1 && (
              <div className="flex-1 flex flex-col justify-center">
                <h2 className="font-display text-3xl font-bold text-white mb-2">{currentStep.title}</h2>
                <p className="text-white/50 text-sm mb-8">{currentStep.subtitle}</p>

                <div className="mb-8">
                  <input
                    type="text"
                    value={data.name}
                    onChange={e => setData(d => ({ ...d, name: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && data.name.trim() && goNext()}
                    placeholder="Votre prénom..."
                    autoFocus
                    className="w-full px-5 py-5 bg-white/10 border-2 border-white/20 rounded-2xl text-white text-xl placeholder-white/30 focus:border-gold focus:outline-none font-display"
                  />
                </div>

                <button
                  type="button"
                  onClick={goNext}
                  disabled={!data.name.trim()}
                  className="w-full py-5 bg-gold text-black-wine rounded-2xl font-bold text-lg border-none cursor-pointer disabled:opacity-30 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  Continuer <ChevronRight size={20} />
                </button>
              </div>
            )}

            {/* ══ ÉTAPE 2 : NIVEAU ══ */}
            {step === 2 && (
              <div className="flex-1 flex flex-col justify-center">
                <h2 className="font-display text-3xl font-bold text-white mb-2">{currentStep.title}</h2>
                <p className="text-white/50 text-sm mb-8">{currentStep.subtitle}</p>

                <div className="space-y-3 mb-8">
                  {EXPERIENCE_LEVELS.map(level => (
                    <button
                      key={level.id}
                      type="button"
                      onClick={() => { setData(d => ({ ...d, experience: level.id })); }}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer text-left ${data.experience === level.id ? 'border-gold bg-gold/15' : 'border-white/15 bg-white/5 hover:border-white/30'}`}
                    >
                      <span className="text-3xl flex-shrink-0">{level.emoji}</span>
                      <div className="flex-1">
                        <p className={`font-semibold text-base ${data.experience === level.id ? 'text-gold' : 'text-white'}`}>{level.label}</p>
                        <p className="text-white/40 text-sm">{level.desc}</p>
                      </div>
                      {data.experience === level.id && (
                        <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center flex-shrink-0">
                          <Check size={14} color="#2C1810" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={goNext}
                  disabled={!data.experience}
                  className="w-full py-5 bg-gold text-black-wine rounded-2xl font-bold text-lg border-none cursor-pointer disabled:opacity-30 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  Continuer <ChevronRight size={20} />
                </button>
              </div>
            )}

            {/* ══ ÉTAPE 3 : BUDGET ══ */}
            {step === 3 && (
              <div className="flex-1 flex flex-col justify-center">
                <h2 className="font-display text-3xl font-bold text-white mb-2">{currentStep.title}</h2>
                <p className="text-white/50 text-sm mb-8">{currentStep.subtitle}</p>

                <div className="space-y-3 mb-8">
                  {BUDGET_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setData(d => ({ ...d, budget: opt.id }))}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer text-left ${data.budget === opt.id ? 'border-gold bg-gold/15' : 'border-white/15 bg-white/5 hover:border-white/30'}`}
                    >
                      <span className="text-3xl flex-shrink-0">{opt.emoji}</span>
                      <div className="flex-1">
                        <p className={`font-semibold text-base ${data.budget === opt.id ? 'text-gold' : 'text-white'}`}>{opt.label}</p>
                        <p className="text-white/40 text-sm">{opt.desc}</p>
                      </div>
                      {data.budget === opt.id && (
                        <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center flex-shrink-0">
                          <Check size={14} color="#2C1810" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={goNext}
                  disabled={!data.budget}
                  className="w-full py-5 bg-gold text-black-wine rounded-2xl font-bold text-lg border-none cursor-pointer disabled:opacity-30 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  Continuer <ChevronRight size={20} />
                </button>
              </div>
            )}

            {/* ══ ÉTAPE 4 : RÉGIONS ══ */}
            {step === 4 && (
              <div className="flex-1 flex flex-col">
                <h2 className="font-display text-3xl font-bold text-white mb-2">{currentStep.title}</h2>
                <p className="text-white/50 text-sm mb-6">{currentStep.subtitle}</p>

                <div className="grid grid-cols-2 gap-3 mb-6 flex-1 overflow-y-auto">
                  {REGION_OPTIONS.map(opt => {
                    const selected = data.regions.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleMulti('regions', opt.id)}
                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer text-left ${selected ? 'border-gold bg-gold/15' : 'border-white/15 bg-white/5 hover:border-white/30'}`}
                      >
                        <span className="text-2xl flex-shrink-0">{opt.emoji}</span>
                        <p className={`font-semibold text-sm flex-1 ${selected ? 'text-gold' : 'text-white'}`}>{opt.label}</p>
                        {selected && (
                          <div className="w-5 h-5 rounded-full bg-gold flex items-center justify-center">
                            <Check size={12} color="#2C1810" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={goNext}
                  className="w-full py-5 bg-gold text-black-wine rounded-2xl font-bold text-lg border-none cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  Continuer {data.regions.length > 0 && `(${data.regions.length})`} <ChevronRight size={20} />
                </button>
              </div>
            )}

            {/* ══ ÉTAPE 5 : OCCASIONS ══ */}
            {step === 5 && (
              <div className="flex-1 flex flex-col">
                <h2 className="font-display text-3xl font-bold text-white mb-2">{currentStep.title}</h2>
                <p className="text-white/50 text-sm mb-6">{currentStep.subtitle}</p>

                <div className="grid grid-cols-2 gap-3 mb-6 flex-1 overflow-y-auto">
                  {OCCASION_OPTIONS.map(opt => {
                    const selected = data.occasions.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleMulti('occasions', opt.id)}
                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer text-left ${selected ? 'border-gold bg-gold/15' : 'border-white/15 bg-white/5 hover:border-white/30'}`}
                      >
                        <span className="text-2xl flex-shrink-0">{opt.emoji}</span>
                        <p className={`font-semibold text-sm flex-1 ${selected ? 'text-gold' : 'text-white'}`}>{opt.label}</p>
                        {selected && (
                          <div className="w-5 h-5 rounded-full bg-gold flex items-center justify-center">
                            <Check size={12} color="#2C1810" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={goNext}
                  className="w-full py-5 bg-gold text-black-wine rounded-2xl font-bold text-lg border-none cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  Continuer {data.occasions.length > 0 && `(${data.occasions.length})`} <ChevronRight size={20} />
                </button>
              </div>
            )}

            {/* ══ ÉTAPE 6 : INTENSITÉ ══ */}
            {step === 6 && (
              <div className="flex-1 flex flex-col justify-center">
                <h2 className="font-display text-3xl font-bold text-white mb-2">{currentStep.title}</h2>
                <p className="text-white/50 text-sm mb-8">{currentStep.subtitle}</p>

                <div className="space-y-3 mb-8">
                  {INTENSITY_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setData(d => ({ ...d, body: opt.body }))}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer text-left ${data.body === opt.body ? 'border-gold bg-gold/15' : 'border-white/15 bg-white/5 hover:border-white/30'}`}
                    >
                      <span className="text-3xl flex-shrink-0">{opt.emoji}</span>
                      <div className="flex-1">
                        <p className={`font-semibold text-base ${data.body === opt.body ? 'text-gold' : 'text-white'}`}>{opt.label}</p>
                        <p className="text-white/40 text-sm">{opt.desc}</p>
                      </div>
                      {data.body === opt.body && (
                        <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center flex-shrink-0">
                          <Check size={14} color="#2C1810" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={goNext}
                  className="w-full py-5 bg-gold text-black-wine rounded-2xl font-bold text-lg border-none cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  Continuer <ChevronRight size={20} />
                </button>
              </div>
            )}

            {/* ══ ÉTAPE 7 : PRÉFÉRENCES ══ */}
            {step === 7 && (
              <div className="flex-1 flex flex-col">
                <h2 className="font-display text-3xl font-bold text-white mb-2">{currentStep.title}</h2>
                <p className="text-white/50 text-sm mb-6">{currentStep.subtitle}</p>

                <div className="grid grid-cols-2 gap-3 mb-6 flex-1 overflow-y-auto">
                  {WINE_TYPES.map(type => {
                    const selected = data.favoriteTypes.includes(type.id);
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => toggleType(type.id)}
                        className={`flex flex-col items-start p-4 rounded-2xl border-2 transition-all cursor-pointer text-left ${selected ? 'border-gold bg-gold/15' : 'border-white/15 bg-white/5 hover:border-white/30'}`}
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                          <span className="text-2xl">{type.emoji}</span>
                          {selected && (
                            <div className="w-5 h-5 rounded-full bg-gold flex items-center justify-center">
                              <Check size={12} color="#2C1810" strokeWidth={3} />
                            </div>
                          )}
                        </div>
                        <p className={`font-semibold text-sm leading-tight ${selected ? 'text-gold' : 'text-white'}`}>{type.label}</p>
                        <p className="text-white/40 text-xs mt-0.5">{type.desc}</p>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={goNext}
                  disabled={data.favoriteTypes.length === 0}
                  className="w-full py-5 bg-gold text-black-wine rounded-2xl font-bold text-lg border-none cursor-pointer disabled:opacity-30 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  Continuer ({data.favoriteTypes.length} sélectionné{data.favoriteTypes.length > 1 ? 's' : ''}) <ChevronRight size={20} />
                </button>
              </div>
            )}

            {/* ══ ÉTAPE 8 : READY ══ */}
            {step === 8 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                  className="w-28 h-28 rounded-full bg-gold flex items-center justify-center mb-6 shadow-2xl"
                >
                  <Star size={52} color="#2C1810" fill="#2C1810" />
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="font-display text-3xl font-bold text-white mb-3"
                >
                  {data.name ? `Parfait, ${data.name.trim().split(' ')[0]} !` : 'Tout est prêt !'}
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/60 text-base leading-relaxed mb-8 max-w-xs"
                >
                  Votre profil est créé. Scannez votre première bouteille pour obtenir votre score personnalisé.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="w-full max-w-xs space-y-3 mb-8"
                >
                  {[
                    { emoji: '🎯', text: 'Score personnalisé selon vos goûts' },
                    { emoji: '🍷', text: `${data.favoriteTypes.length} type${data.favoriteTypes.length > 1 ? 's' : ''} de vin favori${data.favoriteTypes.length > 1 ? 's' : ''}` },
                    { emoji: '📊', text: `Niveau : ${EXPERIENCE_LEVELS.find(e => e.id === data.experience)?.label || 'Amateur'}` },
                    { emoji: '💰', text: `Budget : ${BUDGET_OPTIONS.find(b => b.id === data.budget)?.label || '...'}` },
                    ...(data.regions.length > 0 ? [{ emoji: '🗺️', text: `${data.regions.length} région${data.regions.length > 1 ? 's' : ''} préférée${data.regions.length > 1 ? 's' : ''}` }] : []),
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="flex items-center gap-3 bg-white/5 rounded-2xl px-4 py-3"
                    >
                      <span className="text-xl">{item.emoji}</span>
                      <span className="text-sm text-white/80">{item.text}</span>
                      <Check size={16} color="#D4AF37" className="ml-auto flex-shrink-0" />
                    </motion.div>
                  ))}
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  onClick={finish}
                  type="button"
                  className="w-full max-w-xs py-5 bg-gold text-black-wine rounded-2xl font-bold text-lg border-none cursor-pointer shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  Découvrir Sommely 🍷
                </motion.button>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
