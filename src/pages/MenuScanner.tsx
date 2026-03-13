import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { canAccessFeature } from '../utils/subscription';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, ArrowLeft, Star, AlertCircle, RotateCcw, Wine } from 'lucide-react';
import { optimizeImageForAI } from '../lib/imageOptimize';
import { fetchOpenAI } from '../lib/openai';

// ─── TYPES ────────────────────────────────────────────────

interface MenuWine {
  name: string;
  year?: number;
  region?: string;
  type?: string;
  priceMenu: number;
  estimatedRetailPrice: number;
  markupPercent: number;
  score: number;
  valueScore: number;
  recommendation: 'excellent' | 'good' | 'avoid';
  reason: string;
  grapes?: string;
  appellation?: string;
}

interface MenuAnalysis {
  restaurantStyle?: string;
  totalWinesFound: number;
  bestValue: MenuWine;
  topPicks: MenuWine[];
  overpriced: MenuWine[];
  sommelierAdvice: string;
  budgetRecommendation: string;
}

type ScanState = 'idle' | 'capturing' | 'analyzing' | 'result' | 'error';

const ANALYSIS_STEPS = [
  { label: 'Lecture de la carte des vins...', emoji: '📋' },
  { label: 'Identification des vins...', emoji: '🔍' },
  { label: 'Analyse des prix du marché...', emoji: '💰' },
  { label: 'Calcul des rapports qualité-prix...', emoji: '⭐' },
  { label: 'Sélection du meilleur choix...', emoji: '🏆' },
];

// ─── PROMPT ANALYSE MENU ──────────────────────────────────

const MENU_ANALYSIS_PROMPT = `Tu es un sommelier expert et un analyste du marché du vin.
Tu analyses la carte des vins d'un restaurant pour identifier le meilleur rapport qualité-prix.

CONTEXTE : Les restaurants majorent généralement les vins de 200 à 400% par rapport au prix de détail.
Un bon rapport qualité-prix = un vin majoré moins que la moyenne ET de bonne qualité.

INSTRUCTIONS :
1. Identifie TOUS les vins visibles sur cette carte
2. Pour chaque vin, estime son prix de détail habituel selon tes connaissances
3. Calcule le taux de majoration du restaurant
4. Attribue un score qualité-prix de 0 à 100
5. Identifie le meilleur choix absolu pour le client

Réponds UNIQUEMENT en JSON valide, sans markdown ni backticks.

Format JSON attendu :
{
  "restaurantStyle": "Brasserie parisienne / Restaurant gastronomique / Bistrot...",
  "totalWinesFound": 12,
  "bestValue": {
    "name": "Nom exact du vin sur la carte",
    "year": 2020,
    "region": "Bordeaux",
    "type": "Rouge",
    "priceMenu": 45,
    "estimatedRetailPrice": 18,
    "markupPercent": 150,
    "score": 88,
    "valueScore": 95,
    "recommendation": "excellent",
    "reason": "Ce Bordeaux est vendu 45€ sur la carte alors qu'il vaut 18€ en cave. Majoré seulement 150% vs 250% en moyenne. Excellent rapport qualité-prix.",
    "grapes": "Cabernet Sauvignon, Merlot",
    "appellation": "AOC Bordeaux Supérieur"
  },
  "topPicks": [
    {
      "name": "Deuxième meilleur choix",
      "year": 2021,
      "region": "Rhône",
      "type": "Rouge",
      "priceMenu": 38,
      "estimatedRetailPrice": 14,
      "markupPercent": 171,
      "score": 85,
      "valueScore": 90,
      "recommendation": "excellent",
      "reason": "Très bon rapport qualité-prix pour ce Côtes du Rhône.",
      "grapes": "Grenache, Syrah",
      "appellation": "AOC Côtes du Rhône"
    }
  ],
  "overpriced": [
    {
      "name": "Vin surévalué",
      "year": 2018,
      "region": "Bourgogne",
      "type": "Rouge",
      "priceMenu": 180,
      "estimatedRetailPrice": 35,
      "markupPercent": 414,
      "score": 87,
      "valueScore": 20,
      "recommendation": "avoid",
      "reason": "Majoré à 414% alors que la moyenne est 250%. Vous pouvez trouver mieux sur cette carte.",
      "grapes": "Pinot Noir",
      "appellation": "AOC Gevrey-Chambertin"
    }
  ],
  "sommelierAdvice": "Cette carte propose quelques pépites cachées. Le meilleur choix est clairement le Bordeaux Supérieur, excellent rapport qualité-prix pour un dîner.",
  "budgetRecommendation": "Pour un dîner à 2, je recommande le premier choix à 45€. Vous économisez environ 30€ par rapport aux vins surévalués de cette carte."
}

Si l'image n'est pas une carte des vins ou menu, retourne :
{"error": "not_menu", "message": "Aucune carte des vins détectée"}`;

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────

export function MenuScanner() {
  const navigate = useNavigate();
  const { subscriptionState } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [scanState, setScanState] = useState<ScanState>('idle');
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [menuAnalysis, setMenuAnalysis] = useState<MenuAnalysis | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [activeTab, setActiveTab] = useState<'best' | 'top' | 'avoid'>('best');

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  useEffect(() => {
    if (!canAccessFeature(subscriptionState, 'menu')) {
      navigate('/premium');
      return;
    }
  }, [navigate, subscriptionState]);

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
    await analyzeMenu(base64);
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
        await analyzeMenu(base64);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const analyzeMenu = async (base64: string) => {
    setScanState('analyzing');
    setAnalysisStep(0);
    setAnalysisProgress(0);

    let step = 0;
    const stepInterval = setInterval(() => {
      step = Math.min(step + 1, ANALYSIS_STEPS.length - 1);
      setAnalysisStep(step);
      setAnalysisProgress(Math.round((step / (ANALYSIS_STEPS.length - 1)) * 100));
    }, 1400);

    try {
      const optimized = await optimizeImageForAI(base64, 1536, 0.82);

      const response = await fetchOpenAI({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Tu es un sommelier expert et analyste prix du marché du vin. Tu réponds UNIQUEMENT en JSON valide.',
          },
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${optimized}`, detail: 'high' } },
              { type: 'text', text: MENU_ANALYSIS_PROMPT },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      clearInterval(stepInterval);
      setAnalysisStep(ANALYSIS_STEPS.length - 1);
      setAnalysisProgress(100);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `Erreur ${response.status}`);
      }

      const content = data.choices?.[0]?.message?.content || '{}';
      const parsed = JSON.parse(content) as MenuAnalysis & { error?: string };

      if (parsed.error === 'not_menu') {
        setScanState('error');
        setErrorMessage("Aucune carte des vins détectée. Photographiez la page vins du menu.");
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 300));
      setMenuAnalysis(parsed);
      setScanState('result');

    } catch (error: any) {
      clearInterval(stepInterval);
      setErrorMessage(error?.message || "Erreur lors de l'analyse. Réessayez.");
      setScanState('error');
    }
  };

  const handleReset = () => {
    setScanState('idle');
    setErrorMessage('');
    setMenuAnalysis(null);
    setShowCamera(false);
    setAnalysisStep(0);
    setAnalysisProgress(0);
    stopCamera();
  };

  // ─── RENDU ────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-cream font-body">

      {/* HEADER */}
      <div className="bg-white border-b border-gray-light/30 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <button onClick={() => navigate('/scan')} className="flex items-center gap-2 bg-transparent border-none cursor-pointer">
          <ArrowLeft size={20} color="#722F37" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-burgundy-dark flex items-center justify-center overflow-hidden p-0.5">
            <img src="/IMG_1639-transparent.png" alt="Sommely" width={20} height={20} className="object-contain" style={{ filter: 'brightness(0) invert(1)' }} onError={(e) => { (e.target as HTMLImageElement).src = '/Logo%20Sommely.jpeg'; (e.target as HTMLImageElement).style.filter = 'brightness(0) invert(1)'; }} />
          </div>
          <span className="font-display text-base font-bold text-burgundy-dark">Carte des vins</span>
        </div>
        <div className="w-8" />
      </div>

      <div className="max-w-lg mx-auto px-6 py-6">
        <AnimatePresence mode="wait">

          {/* ── IDLE ── */}
          {scanState === 'idle' && !showCamera && (
            <motion.div key="idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center text-center">

              {/* Badge exclusif */}
              <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 rounded-full px-4 py-2 mb-6">
                <Star size={14} color="#D4AF37" fill="#D4AF37" />
                <span className="text-xs font-bold text-yellow-800">Exclusif Sommely, introuvable sur Vivino</span>
              </div>

              {/* Illustration */}
              <div className="w-64 h-48 bg-white rounded-3xl border-2 border-dashed border-burgundy-dark/20 flex flex-col items-center justify-center mb-6 shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #722F37, #722F37 1px, transparent 1px, transparent 20px)' }} />
                <span className="text-5xl mb-3">📋</span>
                <p className="text-sm font-semibold text-burgundy-dark">Carte des vins</p>
                <p className="text-xs text-gray-dark mt-1">Photographiez la page vins</p>
                <motion.div animate={{ y: [-30, 30, -30] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent" />
              </div>

              <h1 className="font-display text-2xl font-bold text-black-wine mb-3">
                Meilleur rapport<br />qualité-prix du menu
              </h1>
              <p className="text-gray-dark text-sm leading-relaxed mb-8 max-w-xs">
                Photographiez la carte des vins. Notre IA analyse les prix du marché et vous dit exactement quelle bouteille choisir pour en avoir le plus pour votre argent.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 w-full mb-8">
                {[
                  { value: '200-400%', label: 'Majoration moyenne resto' },
                  { value: '3 sec', label: "Temps d'analyse" },
                  { value: '100%', label: 'Basé sur les prix réels' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-2xl p-3 text-center border border-gray-light/30 shadow-sm">
                    <p className="font-display text-sm font-bold text-burgundy-dark">{stat.value}</p>
                    <p className="text-xs text-gray-dark leading-tight mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Boutons */}
              {isMobile ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-5 bg-burgundy-dark text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 border-none cursor-pointer shadow-lg hover:bg-burgundy-medium active:scale-95 transition-all"
                >
                  <Camera size={22} />
                  Photographier la carte
                </button>
              ) : (
                <div className="flex gap-3 w-full">
                  <button
                    onClick={startCamera}
                    className="flex-1 py-5 bg-burgundy-dark text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 border-none cursor-pointer shadow-lg hover:bg-burgundy-medium active:scale-95 transition-all"
                  >
                    <Camera size={20} />
                    Caméra
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-5 bg-white border-2 border-burgundy-dark/20 text-burgundy-dark rounded-2xl font-bold text-base flex items-center justify-center gap-2 cursor-pointer hover:bg-cream active:scale-95 transition-all"
                  >
                    <Upload size={20} />
                    Importer
                  </button>
                </div>
              )}

              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />

              <p className="text-xs text-gray-dark mt-4 text-center leading-relaxed">
                💡 Astuce : cadrez toute la page vins pour une analyse complète
              </p>
            </motion.div>
          )}

          {/* ── CAMÉRA ACTIVE ── */}
          {showCamera && (
            <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
              <div className="rounded-3xl overflow-hidden relative">
                <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-3xl" style={{ maxHeight: '60vh', objectFit: 'cover' }} />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="border-2 border-gold/60 rounded-xl" style={{ width: '80%', height: '70%' }} />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-5">
                  <p className="text-white/60 text-xs text-center mb-3">Cadrez toute la page des vins</p>
                  <button onClick={captureFromCamera} className="w-full py-4 bg-gold text-black-wine rounded-2xl font-bold border-none cursor-pointer">
                    📸 Analyser cette carte
                  </button>
                </div>
              </div>
              <button onClick={handleReset} className="w-full mt-3 py-2 text-gray-dark text-sm bg-transparent border-none cursor-pointer">Annuler</button>
            </motion.div>
          )}

          {/* ── ANALYSE EN COURS ── */}
          {scanState === 'analyzing' && (
            <motion.div key="analyzing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center text-center py-12">
              <div className="relative mb-8">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="w-24 h-24 rounded-full border-4 border-gray-light border-t-burgundy-dark" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl">{ANALYSIS_STEPS[analysisStep]?.emoji}</span>
                </div>
              </div>
              <h2 className="font-display text-xl font-bold text-black-wine mb-2">Analyse en cours</h2>
              <p className="text-gray-dark text-sm mb-6">L'IA compare les prix du marché...</p>
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
          {scanState === 'result' && menuAnalysis && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

              {/* En-tête résultat */}
              <div className="bg-gradient-to-br from-burgundy-dark to-burgundy-medium rounded-3xl p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🏆</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-white/70">Analyse Sommely</span>
                </div>
                <h2 className="font-display text-xl font-bold mb-1">
                  {menuAnalysis.totalWinesFound} vins analysés
                </h2>
                {menuAnalysis.restaurantStyle && (
                  <p className="text-white/60 text-sm">{menuAnalysis.restaurantStyle}</p>
                )}
              </div>

              {/* Conseil sommelier */}
              <div className="bg-gold/10 border border-gold/30 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">💬</span>
                  <div>
                    <p className="text-xs font-bold text-yellow-800 uppercase tracking-wide mb-1">Conseil du sommelier</p>
                    <p className="text-sm text-gray-dark leading-relaxed">{menuAnalysis.sommelierAdvice}</p>
                  </div>
                </div>
              </div>

              {/* Onglets */}
              <div className="flex gap-2 bg-white rounded-2xl p-1.5 border border-gray-light/30">
                {[
                  { id: 'best', label: '🏆 Meilleur choix', count: 1 },
                  { id: 'top', label: '👍 Top sélection', count: menuAnalysis.topPicks?.length || 0 },
                  { id: 'avoid', label: '⚠️ À éviter', count: menuAnalysis.overpriced?.length || 0 },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'best' | 'top' | 'avoid')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border-none cursor-pointer ${activeTab === tab.id ? 'bg-burgundy-dark text-white shadow-sm' : 'text-gray-dark bg-transparent hover:bg-cream'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Meilleur choix */}
              {activeTab === 'best' && menuAnalysis.bestValue && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <WineCard wine={menuAnalysis.bestValue} highlight />
                  <div className="bg-white rounded-2xl border border-gray-light/30 p-5">
                    <p className="text-xs font-bold text-gray-dark uppercase tracking-wide mb-2">💰 Budget recommandé</p>
                    <p className="text-sm text-black-wine leading-relaxed">{menuAnalysis.budgetRecommendation}</p>
                  </div>
                </motion.div>
              )}

              {/* Top sélection */}
              {activeTab === 'top' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  {menuAnalysis.topPicks?.length > 0 ? (
                    menuAnalysis.topPicks.map((wine, i) => (
                      <WineCard key={i} wine={wine} />
                    ))
                  ) : (
                    <div className="bg-white rounded-2xl border border-gray-light/30 p-6 text-center">
                      <p className="text-gray-dark text-sm">Pas d'autres bons choix détectés sur cette carte.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* À éviter */}
              {activeTab === 'avoid' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  {menuAnalysis.overpriced?.length > 0 ? (
                    menuAnalysis.overpriced.map((wine, i) => (
                      <WineCard key={i} wine={wine} />
                    ))
                  ) : (
                    <div className="bg-white rounded-2xl border border-gray-light/30 p-6 text-center">
                      <p className="text-gray-dark text-sm">Aucun vin abusivement surévalué détecté.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleReset}
                  className="flex-1 py-4 border-2 border-burgundy-dark/20 text-burgundy-dark rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 bg-transparent cursor-pointer hover:bg-burgundy-dark/5 transition-colors"
                >
                  <RotateCcw size={16} />
                  Nouvelle carte
                </button>
                <button
                  onClick={() => navigate('/scan')}
                  className="flex-1 py-4 bg-burgundy-dark text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 border-none cursor-pointer hover:bg-burgundy-medium transition-colors"
                >
                  <Wine size={16} />
                  Scanner un vin
                </button>
              </div>

              <div className="h-4" />
            </motion.div>
          )}

          {/* ── ERREUR ── */}
          {scanState === 'error' && (
            <motion.div key="error" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center text-center py-12">
              <div className="w-20 h-20 rounded-full bg-danger/10 flex items-center justify-center mb-5">
                <AlertCircle size={40} color="#C62828" />
              </div>
              <h2 className="font-display text-xl font-bold text-black-wine mb-2">Oups&nbsp;!</h2>
              <p className="text-gray-dark text-sm mb-8 leading-relaxed max-w-xs">{errorMessage}</p>
              <button onClick={handleReset} className="w-full py-4 bg-burgundy-dark text-white rounded-2xl font-bold border-none cursor-pointer flex items-center justify-center gap-2">
                <RotateCcw size={18} />
                Réessayer
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── COMPOSANT CARTE VIN ──────────────────────────────────

function WineCard({ wine, highlight = false }: { wine: MenuWine; highlight?: boolean }) {
  const valueColor = wine.valueScore >= 80 ? '#2E7D32' : wine.valueScore >= 60 ? '#F57C00' : '#C62828';
  const valueBg = wine.valueScore >= 80 ? 'bg-success/10 border-success/20' : wine.valueScore >= 60 ? 'bg-warning/10 border-warning/20' : 'bg-danger/10 border-danger/20';

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden shadow-sm ${highlight ? 'border-gold/40' : 'border-gray-light/30'}`}>
      {highlight && (
        <div className="bg-gold px-4 py-2 flex items-center gap-2">
          <Star size={14} color="#2C1810" fill="#2C1810" />
          <span className="text-xs font-bold text-black-wine">Meilleur rapport qualité-prix</span>
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-base font-bold text-black-wine leading-tight">{wine.name}</h3>
            {wine.year && <p className="text-xs text-gray-dark mt-0.5">{wine.year} · {wine.region} {wine.appellation ? `· ${wine.appellation}` : ''}</p>}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-display text-xl font-bold text-burgundy-dark">{wine.priceMenu}€</p>
            <p className="text-xs text-gray-dark">sur la carte</p>
          </div>
        </div>

        <div className={`rounded-xl border p-3 mb-3 ${valueBg}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold" style={{ color: valueColor }}>
              Score rapport Q/P
            </span>
            <span className="font-display text-lg font-bold" style={{ color: valueColor }}>
              {wine.valueScore}/100
            </span>
          </div>
          <div className="w-full bg-white/50 rounded-full h-1.5 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${wine.valueScore}%`, backgroundColor: valueColor }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-cream rounded-xl p-2.5 text-center">
            <p className="text-xs text-gray-dark">Prix marché estimé</p>
            <p className="font-semibold text-black-wine text-sm">~{wine.estimatedRetailPrice}€</p>
          </div>
          <div className="bg-cream rounded-xl p-2.5 text-center">
            <p className="text-xs text-gray-dark">Majoration resto</p>
            <p className="font-semibold text-sm" style={{ color: wine.markupPercent > 300 ? '#C62828' : wine.markupPercent > 200 ? '#F57C00' : '#2E7D32' }}>
              +{wine.markupPercent}%
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-dark leading-relaxed">{wine.reason}</p>
      </div>
    </div>
  );
}
