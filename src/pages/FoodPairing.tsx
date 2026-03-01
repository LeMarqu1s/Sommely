import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { canAccessFeature } from '../utils/subscription';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, ArrowLeft, Wine, Star, Search, ChevronRight, RotateCcw, AlertCircle, Utensils } from 'lucide-react';
import { optimizeImageForAI } from '../lib/imageOptimize';
import { fetchOpenAI } from '../lib/openai';

// ─── TYPES ────────────────────────────────────────────────

interface WineRecommendation {
  name: string;
  type: string;
  region: string;
  grapes: string;
  priceRange: string;
  score: number;
  matchReason: string;
  servingTemp: string;
  whereToFind: string;
  alternativeIf: string;
  glassType: string;
}

interface PairingResult {
  dishName: string;
  dishDescription: string;
  flavorProfile: string[];
  pairingPrinciple: string;
  perfectMatches: WineRecommendation[];
  goodMatches: WineRecommendation[];
  toAvoid: string[];
  sommelierNote: string;
  occasionTip: string;
}

type PageState = 'idle' | 'capturing' | 'analyzing' | 'result' | 'error';

const ANALYSIS_STEPS = [
  { label: 'Identification du plat...', emoji: '🍽️' },
  { label: 'Analyse des saveurs...', emoji: '👅' },
  { label: 'Recherche des accords...', emoji: '🔍' },
  { label: 'Sélection des meilleurs vins...', emoji: '🍷' },
  { label: 'Finalisation des conseils...', emoji: '✨' },
];

const FOOD_PROMPT = `Tu es un sommelier expert spécialisé dans les accords mets-vins.
Analyse ce plat (via photo ou description) et recommande les meilleurs vins pour l'accompagner.

RÈGLES D'OR des accords mets-vins :
- Vins légers avec plats légers, vins puissants avec plats puissants
- Acidité du vin équilibre les plats gras
- Tannins s'accordent avec les protéines (viandes rouges)
- Sucrosité équilibre le piquant et le sucré
- Vins régionaux s'accordent souvent avec plats régionaux

Réponds UNIQUEMENT en JSON valide, sans markdown ni backticks.

Format JSON exact :
{
  "dishName": "Nom du plat identifié",
  "dishDescription": "Description courte du plat (1 phrase)",
  "flavorProfile": ["Saveur 1", "Saveur 2", "Saveur 3"],
  "pairingPrinciple": "Principe d'accord pour ce plat en 1-2 phrases",
  "perfectMatches": [
    {
      "name": "Nom du vin recommandé (ex: Sancerre, Chablis Premier Cru...)",
      "type": "Blanc|Rouge|Rosé|Champagne",
      "region": "Région viticole",
      "grapes": "Cépages principaux",
      "priceRange": "8-15€|15-30€|30-60€|60€+",
      "score": 97,
      "matchReason": "Explication précise de pourquoi ce vin s'accorde parfaitement avec ce plat",
      "servingTemp": "Température de service",
      "whereToFind": "Où trouver ce vin (ex: Caves Nicolas, grande surface, caviste...)",
      "alternativeIf": "Alternative si introuvable (ex: Si vous ne trouvez pas de Sancerre, optez pour un Pouilly-Fumé)",
      "glassType": "Type de verre"
    },
    {
      "name": "Deuxième accord parfait",
      "type": "Rouge",
      "region": "Bourgogne",
      "grapes": "Pinot Noir",
      "priceRange": "20-40€",
      "score": 93,
      "matchReason": "Raison de l'accord",
      "servingTemp": "16-17°C",
      "whereToFind": "Caviste spécialisé ou en ligne",
      "alternativeIf": "Alternative accessible",
      "glassType": "Verre Bourgogne"
    }
  ],
  "goodMatches": [
    {
      "name": "Bon accord (plus accessible)",
      "type": "Rouge",
      "region": "Rhône",
      "grapes": "Grenache, Syrah",
      "priceRange": "8-15€",
      "score": 82,
      "matchReason": "Bon accord pour un budget serré",
      "servingTemp": "16-17°C",
      "whereToFind": "Grande surface, cave",
      "alternativeIf": "Tout Côtes du Rhône Villages",
      "glassType": "Verre Bordeaux"
    }
  ],
  "toAvoid": [
    "Type de vin à éviter et pourquoi (ex: Vins très tanniques, écrasent la délicatesse du poisson)",
    "Autre vin à éviter"
  ],
  "sommelierNote": "Conseil personnel du sommelier sur cet accord (2-3 phrases, ton chaleureux)",
  "occasionTip": "Pour quelle occasion ce plat + vin est idéal (ex: Parfait pour un dîner romantique ou un repas de fête)"
}

Si l'image n'est pas un plat/aliment ou si la description est trop vague, retourne :
{"error": "not_food", "message": "Plat non identifié. Soyez plus précis ou prenez une photo."}`;

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────

export function FoodPairing() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [pageState, setPageState] = useState<PageState>('idle');
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [result, setResult] = useState<PairingResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [inputMode, setInputMode] = useState<'photo' | 'text'>('photo');
  const [textInput, setTextInput] = useState('');
  const [activeTab, setActiveTab] = useState<'perfect' | 'good' | 'avoid'>('perfect');

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  useEffect(() => {
    if (!canAccessFeature('food')) {
      navigate('/premium');
      return;
    }
  }, [navigate]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      streamRef.current = stream;
      setShowCamera(true);
    } catch {
      fileInputRef.current?.click();
    }
  };

  const captureFromCamera = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg', 0.92).split(',')[1];
    stopCamera();
    setShowCamera(false);
    await analyzeFood(base64, null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = async () => {
        const maxSize = 1920;
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) { height = (height * maxSize) / width; width = maxSize; }
          else { width = (width * maxSize) / height; height = maxSize; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.90).split(',')[1];
        await analyzeFood(base64, null);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleTextSearch = async () => {
    if (!textInput.trim()) return;
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 600, 200);
      ctx.fillStyle = 'black';
      ctx.font = 'bold 24px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(textInput, 300, 80);
      ctx.font = '16px Georgia, serif';
      ctx.fillText('Plat à accorder avec un vin', 300, 120);
    }
    const base64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
    const hint = textInput;
    setTextInput('');
    await analyzeFood(base64, hint);
  };

  const analyzeFood = async (base64: string, textHint: string | null) => {
    setPageState('analyzing');
    setAnalysisStep(0);
    setAnalysisProgress(0);

    let step = 0;
    const stepInterval = setInterval(() => {
      step = Math.min(step + 1, ANALYSIS_STEPS.length - 1);
      setAnalysisStep(step);
      setAnalysisProgress(Math.round((step / (ANALYSIS_STEPS.length - 1)) * 100));
    }, 1200);

    try {
      const optimized = await optimizeImageForAI(base64, 1280, 0.82);

      const userContent: (object | { type: string; text: string })[] = [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${optimized}`, detail: 'high' } } as object,
      ];

      if (textHint) {
        userContent.push({ type: 'text', text: `Plat décrit par l'utilisateur : "${textHint}". ${FOOD_PROMPT}` });
      } else {
        userContent.push({ type: 'text', text: FOOD_PROMPT });
      }

      const response = await fetchOpenAI({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Tu es un sommelier expert en accords mets-vins. Tu réponds UNIQUEMENT en JSON valide.',
          },
          { role: 'user', content: userContent },
        ],
        max_tokens: 2000,
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      clearInterval(stepInterval);
      setAnalysisStep(ANALYSIS_STEPS.length - 1);
      setAnalysisProgress(100);

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || `Erreur ${response.status}`);

      const content = data.choices?.[0]?.message?.content || '{}';
      const parsed = JSON.parse(content) as PairingResult & { error?: string };

      if (parsed.error === 'not_food') {
        setPageState('error');
        setErrorMessage('Plat non identifié. Prenez une photo de votre assiette ou décrivez votre plat plus précisément.');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 300));
      setResult(parsed);
      setPageState('result');

    } catch (error: unknown) {
      clearInterval(stepInterval);
      setErrorMessage((error as Error)?.message || "Erreur lors de l'analyse. Réessayez.");
      setPageState('error');
    }
  };

  const handleReset = () => {
    setPageState('idle');
    setErrorMessage('');
    setResult(null);
    setShowCamera(false);
    setAnalysisStep(0);
    setAnalysisProgress(0);
    setTextInput('');
    stopCamera();
  };

  // ─── RENDU ────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-cream font-body">

      {/* HEADER */}
      <div className="bg-white border-b border-gray-light/30 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <button onClick={() => navigate('/scan')} className="bg-transparent border-none cursor-pointer">
          <ArrowLeft size={20} color="#722F37" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">🍽️</span>
          <span className="font-display text-base font-bold text-burgundy-dark">Accord mets & vins</span>
        </div>
        <div className="w-8" />
      </div>

      <div className="max-w-lg mx-auto px-6 py-6">
        <AnimatePresence mode="wait">

          {/* ── IDLE ── */}
          {pageState === 'idle' && !showCamera && (
            <motion.div key="idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center text-center">

              <div className="inline-flex items-center gap-2 bg-burgundy-dark/5 border border-burgundy-dark/15 rounded-full px-4 py-2 mb-6">
                <Utensils size={14} color="#722F37" />
                <span className="text-xs font-bold text-burgundy-dark">Le Shazam des accords mets-vins</span>
              </div>

              <div className="w-64 h-48 bg-white rounded-3xl border-2 border-dashed border-burgundy-dark/20 flex flex-col items-center justify-center mb-6 shadow-sm relative overflow-hidden">
                <span className="text-6xl mb-2">🥩</span>
                <motion.div animate={{ x: [0, 20, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
                  <span className="text-3xl">→</span>
                </motion.div>
                <span className="text-4xl">🍷</span>
              </div>

              <h1 className="font-display text-2xl font-bold text-black-wine mb-3">
                Quel vin avec<br />ce plat&nbsp;?
              </h1>
              <p className="text-gray-dark text-sm leading-relaxed mb-8 max-w-xs">
                Photographiez votre assiette ou décrivez votre plat. L'IA vous recommande les vins parfaits avec où les acheter et à quel prix.
              </p>

              {/* Toggle photo / texte */}
              <div className="flex gap-2 bg-white rounded-2xl p-1.5 border border-gray-light/30 w-full mb-6">
                <button
                  onClick={() => setInputMode('photo')}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border-none cursor-pointer flex items-center justify-center gap-2 ${inputMode === 'photo' ? 'bg-burgundy-dark text-white shadow-sm' : 'text-gray-dark bg-transparent'}`}
                >
                  <Camera size={16} />
                  Photo du plat
                </button>
                <button
                  onClick={() => setInputMode('text')}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border-none cursor-pointer flex items-center justify-center gap-2 ${inputMode === 'text' ? 'bg-burgundy-dark text-white shadow-sm' : 'text-gray-dark bg-transparent'}`}
                >
                  <Search size={16} />
                  Décrire le plat
                </button>
              </div>

              {/* Mode photo */}
              {inputMode === 'photo' && (
                <motion.div key="photo-mode" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full space-y-3">
                  {isMobile ? (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-5 bg-burgundy-dark text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 border-none cursor-pointer shadow-lg hover:bg-burgundy-medium active:scale-95 transition-all"
                    >
                      <Camera size={22} />
                      Photographier mon plat
                    </button>
                  ) : (
                    <div className="flex gap-3">
                      <button onClick={startCamera} className="flex-1 py-5 bg-burgundy-dark text-white rounded-2xl font-bold flex items-center justify-center gap-2 border-none cursor-pointer shadow-lg hover:bg-burgundy-medium active:scale-95 transition-all">
                        <Camera size={20} /> Caméra
                      </button>
                      <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-5 bg-white border-2 border-burgundy-dark/20 text-burgundy-dark rounded-2xl font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-cream active:scale-95 transition-all">
                        <Upload size={20} /> Importer
                      </button>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
                </motion.div>
              )}

              {/* Mode texte */}
              {inputMode === 'text' && (
                <motion.div key="text-mode" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full space-y-3">
                  <input
                    type="text"
                    value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleTextSearch()}
                    placeholder="Ex : Côte de bœuf grillée, Risotto aux truffes, Sole meunière..."
                    className="w-full px-5 py-4 bg-white border-2 border-gray-light rounded-2xl text-black-wine placeholder-gray-light focus:border-burgundy-dark focus:outline-none text-sm"
                    autoFocus
                  />

                  {/* Suggestions rapides */}
                  <div className="flex flex-wrap gap-2">
                    {['🥩 Côte de bœuf', '🐟 Saumon fumé', '🦞 Homard', '🍕 Pizza', '🧀 Plateau fromages', '🍝 Pasta truffe'].map(item => (
                      <button
                        key={item}
                        onClick={() => { setTextInput(item.split(' ').slice(1).join(' ')); }}
                        className="px-3 py-1.5 bg-white border border-gray-light/60 rounded-full text-xs text-gray-dark hover:border-burgundy-dark hover:text-burgundy-dark transition-colors cursor-pointer"
                      >
                        {item}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleTextSearch}
                    disabled={!textInput.trim()}
                    className="w-full py-4 bg-burgundy-dark text-white rounded-2xl font-bold text-base border-none cursor-pointer disabled:opacity-40 hover:bg-burgundy-medium active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Wine size={20} />
                    Trouver les vins parfaits
                  </button>
                </motion.div>
              )}

              <p className="text-xs text-gray-dark mt-6 text-center">
                💡 Fonctionne avec n'importe quel plat, même les recettes complexes
              </p>
            </motion.div>
          )}

          {/* ── CAMÉRA ── */}
          {showCamera && (
            <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
              <div className="rounded-3xl overflow-hidden relative">
                <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-3xl" style={{ maxHeight: '60vh', objectFit: 'cover' }} />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="border-2 border-gold/60 rounded-xl" style={{ width: '80%', height: '70%' }} />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-5">
                  <p className="text-white/60 text-xs text-center mb-3">Cadrez bien votre assiette</p>
                  <button onClick={captureFromCamera} className="w-full py-4 bg-gold text-black-wine rounded-2xl font-bold border-none cursor-pointer">
                    📸 Analyser ce plat
                  </button>
                </div>
              </div>
              <button onClick={handleReset} className="w-full mt-3 py-2 text-gray-dark text-sm bg-transparent border-none cursor-pointer">Annuler</button>
            </motion.div>
          )}

          {/* ── ANALYSE ── */}
          {pageState === 'analyzing' && (
            <motion.div key="analyzing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center text-center py-12">
              <div className="relative mb-8">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="w-24 h-24 rounded-full border-4 border-gray-light border-t-burgundy-dark" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl">{ANALYSIS_STEPS[analysisStep]?.emoji}</span>
                </div>
              </div>
              <h2 className="font-display text-xl font-bold text-black-wine mb-2">Recherche des accords</h2>
              <p className="text-gray-dark text-sm mb-6">Le sommelier IA analyse votre plat...</p>
              <div className="w-full bg-gray-light/30 rounded-full h-2 mb-6 overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-burgundy-dark to-gold rounded-full" animate={{ width: `${analysisProgress}%` }} transition={{ duration: 0.5 }} />
              </div>
              <div className="w-full space-y-2">
                {ANALYSIS_STEPS.map((step, i) => (
                  <div key={i} className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${i <= analysisStep ? 'bg-white border border-gray-light/30 shadow-sm' : 'opacity-30'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${i < analysisStep ? 'bg-success' : i === analysisStep ? 'bg-burgundy-dark' : 'bg-gray-light/50'}`}>
                      {i < analysisStep ? <span className="text-white text-xs">✓</span> : i === analysisStep ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-3 h-3 rounded-full border-2 border-white border-t-transparent" /> : <div className="w-2 h-2 rounded-full bg-gray-dark/30" />}
                    </div>
                    <span className="text-sm font-medium text-black-wine">{step.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── RÉSULTAT ── */}
          {pageState === 'result' && result && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

              {/* En-tête plat */}
              <div className="bg-white rounded-3xl border border-gray-light/30 shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-burgundy-dark/5 to-gold/5 px-6 py-5 border-b border-gray-light/20">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">🍽️</span>
                    <h2 className="font-display text-xl font-bold text-black-wine">{result.dishName}</h2>
                  </div>
                  <p className="text-gray-dark text-sm">{result.dishDescription}</p>
                </div>
                <div className="px-6 py-4">
                  <p className="text-xs font-bold text-gray-dark uppercase tracking-wide mb-2">Profil de saveurs</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {result.flavorProfile?.map((flavor, i) => (
                      <span key={i} className="text-xs bg-cream border border-gray-light/40 rounded-full px-3 py-1 text-black-wine">{flavor}</span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-dark leading-relaxed italic">{result.pairingPrinciple}</p>
                </div>
              </div>

              {/* Note du sommelier */}
              <div className="bg-gold/10 border border-gold/30 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">💬</span>
                  <div>
                    <p className="text-xs font-bold text-yellow-800 uppercase tracking-wide mb-1">Note du sommelier</p>
                    <p className="text-sm text-gray-dark leading-relaxed">{result.sommelierNote}</p>
                    {result.occasionTip && (
                      <p className="text-xs text-yellow-800 mt-2 font-medium">✨ {result.occasionTip}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Onglets */}
              <div className="flex gap-2 bg-white rounded-2xl p-1.5 border border-gray-light/30">
                {[
                  { id: 'perfect', label: '🏆 Parfaits', count: result.perfectMatches?.length || 0 },
                  { id: 'good', label: '👍 Bons accords', count: result.goodMatches?.length || 0 },
                  { id: 'avoid', label: '⚠️ À éviter', count: result.toAvoid?.length || 0 },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'perfect' | 'good' | 'avoid')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border-none cursor-pointer ${activeTab === tab.id ? 'bg-burgundy-dark text-white shadow-sm' : 'text-gray-dark bg-transparent hover:bg-cream'}`}
                  >
                    {tab.label} {tab.count > 0 && <span className="opacity-60">({tab.count})</span>}
                  </button>
                ))}
              </div>

              {/* Accords parfaits */}
              {activeTab === 'perfect' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {result.perfectMatches?.map((wine, i) => (
                    <WineRecoCard key={i} wine={wine} rank={i + 1} perfect />
                  ))}
                </motion.div>
              )}

              {/* Bons accords */}
              {activeTab === 'good' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {result.goodMatches?.length > 0 ? (
                    result.goodMatches.map((wine, i) => (
                      <WineRecoCard key={i} wine={wine} rank={i + 1} />
                    ))
                  ) : (
                    <div className="bg-white rounded-2xl border border-gray-light/30 p-6 text-center">
                      <p className="text-gray-dark text-sm">Concentrez-vous sur les accords parfaits pour ce plat.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* À éviter */}
              {activeTab === 'avoid' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  {result.toAvoid?.length > 0 ? result.toAvoid.map((item, i) => (
                    <div key={i} className="bg-danger/5 border border-danger/20 rounded-xl px-4 py-3 flex items-start gap-3">
                      <span className="text-danger text-sm flex-shrink-0 mt-0.5">✕</span>
                      <p className="text-sm text-black-wine leading-relaxed">{item}</p>
                    </div>
                  )) : (
                    <div className="bg-white rounded-2xl border border-gray-light/30 p-6 text-center">
                      <p className="text-gray-dark text-sm">Aucun vin à éviter pour ce plat.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button onClick={handleReset} className="flex-1 py-4 border-2 border-burgundy-dark/20 text-burgundy-dark rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 bg-transparent cursor-pointer hover:bg-burgundy-dark/5 transition-colors">
                  <RotateCcw size={16} /> Autre plat
                </button>
                <button onClick={() => navigate('/scan')} className="flex-1 py-4 bg-burgundy-dark text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 border-none cursor-pointer hover:bg-burgundy-medium transition-colors">
                  <Wine size={16} /> Scanner un vin
                </button>
              </div>

              <div className="h-4" />
            </motion.div>
          )}

          {/* ── ERREUR ── */}
          {pageState === 'error' && (
            <motion.div key="error" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center text-center py-12">
              <div className="w-20 h-20 rounded-full bg-danger/10 flex items-center justify-center mb-5">
                <AlertCircle size={40} color="#C62828" />
              </div>
              <h2 className="font-display text-xl font-bold text-black-wine mb-2">Oups&nbsp;!</h2>
              <p className="text-gray-dark text-sm mb-8 leading-relaxed max-w-xs">{errorMessage}</p>
              <button onClick={handleReset} className="w-full py-4 bg-burgundy-dark text-white rounded-2xl font-bold border-none cursor-pointer flex items-center justify-center gap-2">
                <RotateCcw size={18} /> Réessayer
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── CARTE VIN RECOMMANDÉ ─────────────────────────────────

function WineRecoCard({ wine, rank, perfect = false }: { wine: WineRecommendation; rank: number; perfect?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const priceColor = wine.priceRange?.includes('8-15') ? '#2E7D32' : wine.priceRange?.includes('15-30') ? '#1976D2' : wine.priceRange?.includes('30-60') ? '#F57C00' : '#C62828';

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden shadow-sm transition-all ${perfect ? 'border-gold/40' : 'border-gray-light/30'}`}>
      {perfect && rank === 1 && (
        <div className="bg-gold px-4 py-2 flex items-center gap-2">
          <Star size={14} color="#2C1810" fill="#2C1810" />
          <span className="text-xs font-bold text-black-wine">Accord N°{rank} : Recommandé par le sommelier</span>
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{wine.type === 'Rouge' ? '🍷' : wine.type === 'Blanc' ? '🥂' : wine.type === 'Rosé' ? '🌸' : '🍾'}</span>
              <h3 className="font-display text-base font-bold text-black-wine leading-tight">{wine.name}</h3>
            </div>
            <p className="text-xs text-gray-dark">{wine.type} · {wine.region} · {wine.grapes}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-sm" style={{ color: priceColor }}>{wine.priceRange}</p>
            <div className="flex items-center gap-1 justify-end mt-1">
              <Star size={10} color="#D4AF37" fill="#D4AF37" />
              <span className="text-xs font-bold text-black-wine">{wine.score}/100</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-dark leading-relaxed mb-3">{wine.matchReason}</p>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-cream rounded-xl p-2.5">
            <p className="text-xs text-gray-dark mb-0.5">🌡️ Température</p>
            <p className="text-xs font-semibold text-black-wine">{wine.servingTemp}</p>
          </div>
          <div className="bg-cream rounded-xl p-2.5">
            <p className="text-xs text-gray-dark mb-0.5">🥂 Verre</p>
            <p className="text-xs font-semibold text-black-wine">{wine.glassType}</p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between py-2 bg-transparent border-none cursor-pointer text-burgundy-dark hover:text-burgundy-medium transition-colors"
        >
          <span className="text-xs font-semibold">{expanded ? 'Masquer' : 'Où trouver ce vin →'}</span>
          <ChevronRight size={14} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>

        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2 pt-2 border-t border-gray-light/20">
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-xs font-bold text-blue-800 mb-1">🛒 Où acheter</p>
              <p className="text-xs text-blue-700">{wine.whereToFind}</p>
            </div>
            {wine.alternativeIf && (
              <div className="bg-cream rounded-xl p-3">
                <p className="text-xs font-bold text-gray-dark mb-1">💡 Alternative</p>
                <p className="text-xs text-gray-dark">{wine.alternativeIf}</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
