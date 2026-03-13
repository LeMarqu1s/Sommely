import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Search, Zap, AlertCircle, X, RotateCcw, ChevronRight } from 'lucide-react';
import { analyzeWineLabel, enrichWineData } from '../lib/openai';
import { calculatePersonalizedScore, generateDetailedExplanation } from '../lib/matchScore';
import { canScan } from '../utils/subscription';
import { PaywallModal } from '../components/PaywallModal';
import { useAuth } from '../context/AuthContext';
import { insertScan } from '../lib/supabase';

type ScanState = 'idle' | 'camera_active' | 'capturing' | 'analyzing' | 'error';

const ANALYSIS_STEPS = [
  { label: "Lecture de l'étiquette...", emoji: '📸' },
  { label: 'Identification du vin...', emoji: '🔍' },
  { label: 'Recherche dans notre base...', emoji: '🗃️' },
  { label: 'Calcul de votre score personnalisé...', emoji: '⭐' },
  { label: 'Préparation des conseils sommelier...', emoji: '🍷' },
];

export function Scanner() {
  const navigate = useNavigate();
  const { user, profile, subscriptionState, refreshSubscription } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [scanState, setScanState] = useState<ScanState>('idle');
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [userProfile, setUserProfile] = useState<Record<string, unknown> | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [showManualSearch, setShowManualSearch] = useState(false);
  const [manualQuery, setManualQuery] = useState('');
  const [currentTip, setCurrentTip] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);

  const tips = [
    "Assurez-vous que l'étiquette est bien éclairée",
    'Tenez votre téléphone stable et droit',
    'Cadrez bien le nom du vin au centre',
    'Évitez les reflets sur la bouteille',
    'Rapprochez-vous si le texte est petit',
  ];

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const scanCheck = canScan(subscriptionState);
  const isPremium = subscriptionState.isPro || subscriptionState.isTrial;
  const scansRemaining = scanCheck.allowed ? (scanCheck.remaining ?? 999) : 0;

  useEffect(() => {
    const pf = profile?.taste_profile as Record<string, unknown> | undefined;
    if (pf && typeof pf === 'object') setUserProfile(pf);
    else {
      try {
        const local = localStorage.getItem('sommely_profile');
        if (local) setUserProfile(JSON.parse(local));
      } catch { /* ignore */ }
    }
    return () => stopCamera();
  }, [profile?.taste_profile]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip(i => (i + 1) % tips.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // ─── CAMÉRA ──────────────────────────────────────────────

  const startCamera = async () => {
    try {
      setCameraError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      streamRef.current = stream;
      setScanState('camera_active');
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setCameraError("Accès à la caméra refusé. Autorisez l'accès dans les paramètres de votre navigateur.");
      } else if (err.name === 'NotFoundError') {
        setCameraError('Aucune caméra trouvée. Utilisez "Importer une photo" à la place.');
      } else {
        setCameraError("Impossible d'accéder à la caméra. Utilisez \"Importer une photo\".");
      }
      setScanState('error');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // ─── CAPTURE DEPUIS CAMÉRA ───────────────────────────────

  const captureFromCamera = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setErrorMessage("Impossible de capturer l'image. Réessayez.");
      setScanState('error');
      return;
    }
    setScanState('capturing');
    await new Promise(resolve => setTimeout(resolve, 150));

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setErrorMessage('Erreur lors de la capture. Réessayez.');
      setScanState('error');
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // ═══════════════════════════════════════════════════════
    // CONVERSION EN BASE64 — image réelle de la caméra
    // ═══════════════════════════════════════════════════════
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const base64 = dataUrl.split(',')[1];

    stopCamera();

    if (!base64 || base64.length < 1000) {
      setErrorMessage('Image capturée trop petite ou vide. Réessayez.');
      setScanState('error');
      return;
    }

    console.log('📐 Image capturée, taille base64:', base64.length, 'chars');
    await analyzeImage(base64);
  };

  // ─── IMPORT DEPUIS GALERIE ───────────────────────────────

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanState('capturing');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = async () => {
        // Redimensionner si nécessaire (max 1920px)
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

        // ═══════════════════════════════════════════════════
        // BASE64 DE LA VRAIE IMAGE IMPORTÉE
        // ═══════════════════════════════════════════════════
        const dataUrl = canvas.toDataURL('image/jpeg', 0.90);
        const base64 = dataUrl.split(',')[1];
        console.log('📁 Image importée, taille base64:', base64.length, 'chars');
        await analyzeImage(base64);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ─── ANALYSE OPENAI VISION — CŒUR DU SYSTÈME ─────────────
  // CETTE FONCTION ENVOIE LA VRAIE IMAGE À GPT-4o
  // PAS DE VIN ALÉATOIRE ICI

  const analyzeImage = async (base64: string) => {
    const scanCheck = canScan(subscriptionState);
    if (!scanCheck.allowed) {
      setShowPaywall(true);
      return;
    }

    setScanState('analyzing');
    setAnalysisStep(0);
    setAnalysisProgress(0);

    // Animation des étapes pendant que l'IA travaille
    let step = 0;
    const stepInterval = setInterval(() => {
      step = Math.min(step + 1, ANALYSIS_STEPS.length - 1);
      setAnalysisStep(step);
      setAnalysisProgress(Math.round((step / (ANALYSIS_STEPS.length - 1)) * 100));
    }, 1200);

    try {
      console.log('🔍 Envoi de l\'image à OpenAI GPT-4o Vision...');

      // ═══════════════════════════════════════════════════════
      // APPEL OPENAI VISION AVEC LA VRAIE IMAGE BASE64
      // analyzeWineLabel() dans src/lib/openai.ts
      // ═══════════════════════════════════════════════════════
      const wineAnalysis = await analyzeWineLabel(base64);

      clearInterval(stepInterval);
      setAnalysisStep(ANALYSIS_STEPS.length - 1);
      setAnalysisProgress(100);

      console.log('✅ Réponse OpenAI reçue:', JSON.stringify(wineAnalysis, null, 2));

      // Pas une étiquette de vin
      if ((wineAnalysis as any).error === 'not_wine') {
        setScanState('error');
        setErrorMessage("Aucune étiquette de vin détectée. Réessayez en vous rapprochant ou en améliorant l'éclairage.");
        return;
      }

      // IA n'a pas pu lire le nom
      if (!wineAnalysis.name || wineAnalysis.name.trim() === '') {
        setScanState('error');
        setErrorMessage("L'IA n'a pas pu lire l'étiquette clairement. Réessayez avec une meilleure photo (plus proche, mieux éclairée).");
        return;
      }

      // Enrichir avec données calculées
      const enrichedData = await enrichWineData(wineAnalysis);

      // Score personnalisé selon profil utilisateur
      const scoreBreakdown = calculatePersonalizedScore(wineAnalysis, enrichedData, userProfile);
      const explanation = generateDetailedExplanation(wineAnalysis, scoreBreakdown, userProfile);

      // Accords mets-vins : structure { perfect, good, avoid } pour WineResult
      const foodPairingsObj = wineAnalysis.foodPairings
        ?? (enrichedData.foodPairings && Array.isArray(enrichedData.foodPairings)
          ? { perfect: enrichedData.foodPairings, good: [], avoid: [] }
          : undefined);

      // ═══════════════════════════════════════════════════════
      // OBJET VIN = 100% DONNÉES DE L'IA, ZÉRO ALÉATOIRE
      // ═══════════════════════════════════════════════════════
      const wineObject = {
        id: Date.now().toString(),
        name: wineAnalysis.name,
        chateau: wineAnalysis.chateau,
        domaine: wineAnalysis.domaine,
        producer: wineAnalysis.producer,
        year: wineAnalysis.year,
        region: wineAnalysis.region || 'Région inconnue',
        subRegion: wineAnalysis.subRegion,
        appellation: wineAnalysis.appellation || '',
        country: wineAnalysis.country || 'France',
        type: wineAnalysis.type || 'Rouge',
        grapes: Array.isArray(wineAnalysis.grapes) ? wineAnalysis.grapes.join(', ') : (wineAnalysis.grapes || ''),
        alcohol: wineAnalysis.alcohol,
        classification: wineAnalysis.classification,
        tastingNotes: wineAnalysis.tastingNotes || enrichedData.tastingNotes,
        servingTemp: wineAnalysis.servingTemp || enrichedData.servingTemp,
        decanting: wineAnalysis.decanting || enrichedData.decanting,
        agingPotential: wineAnalysis.agingPotential || enrichedData.agingPotential,
        glassType: wineAnalysis.glassType || enrichedData.glassType,
        foodPairings: foodPairingsObj,
        story: wineAnalysis.story,
        tips: wineAnalysis.tips || enrichedData.tips,
        description: enrichedData.description,
        avgPrice: enrichedData.avgPrice,
        confidence: wineAnalysis.confidence,
        labelReadability: wineAnalysis.labelReadability,
      };

      console.log('🍷 Vin identifié avec succès:', wineObject.name, '|', wineObject.year, '|', wineObject.appellation);

      if (user?.id) {
        await insertScan(user.id, 'bottle', {
          wine: wineObject,
          score: scoreBreakdown.total,
          name: wineObject.name,
          year: wineObject.year,
          region: wineObject.region,
          type: wineObject.type,
        });
        refreshSubscription();
      }

      // Navigation vers le résultat avec les VRAIES données
      navigate('/result', {
        state: {
          wine: wineObject,
          score: scoreBreakdown.total,
          explanation,
          scoreBreakdown,
        },
      });

    } catch (error: any) {
      clearInterval(stepInterval);
      console.error('❌ Erreur analyse IA:', error);

      if (error?.message?.includes('API key') || error?.status === 401) {
        setErrorMessage('Clé OpenAI invalide. Vérifiez VITE_OPENAI_API_KEY dans votre fichier .env');
      } else if (error?.status === 429) {
        setErrorMessage('Quota OpenAI dépassé. Attendez quelques secondes et réessayez.');
      } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        setErrorMessage('Erreur réseau. Vérifiez votre connexion internet.');
      } else if (error?.status === 400) {
        setErrorMessage("Image non reconnue par l'IA. Réessayez avec une photo plus nette.");
      } else {
        const msg = error?.message || String(error);
        setErrorMessage(msg.length > 120 ? `${msg.slice(0, 120)}...` : msg || "Erreur lors de l'analyse.");
      }
      setScanState('error');
    }
  };

  // ─── RECHERCHE MANUELLE ───────────────────────────────────

  const handleManualSearch = async () => {
    if (!manualQuery.trim()) return;
    if (!scanCheck.allowed) { setShowPaywall(true); return; }

    setScanState('analyzing');
    setAnalysisStep(0);
    setShowManualSearch(false);

    // Créer une image blanche avec le texte du vin pour l'envoyer à GPT-4o
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 600, 300);
      ctx.fillStyle = 'black';
      ctx.font = 'bold 28px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(manualQuery, 300, 120);
      ctx.font = '18px Georgia, serif';
      ctx.fillText('Vin français', 300, 160);
    }
    const base64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
    setManualQuery('');
    await analyzeImage(base64 || '');
  };

  // ─── RESET ────────────────────────────────────────────────

  const handleReset = () => {
    setScanState('idle');
    setErrorMessage('');
    setCameraError('');
    setAnalysisStep(0);
    setAnalysisProgress(0);
    stopCamera();
  };

  // ─── RENDU ────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-black-wine flex flex-col font-body overflow-hidden">

      <div className="flex items-center justify-between px-6 py-4 z-20 relative flex-shrink-0">
        <div className="w-20" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-burgundy-dark flex items-center justify-center overflow-hidden p-0.5">
            <img src="/IMG_1639-transparent.png" alt="Sommely" width={20} height={20} className="object-contain" style={{ filter: 'brightness(0) invert(1)' }} onError={(e) => { (e.target as HTMLImageElement).src = '/Logo%20Sommely.jpeg'; (e.target as HTMLImageElement).style.filter = 'brightness(0) invert(1)'; }} />
          </div>
          <span className="font-display text-lg font-bold text-white">Sommely</span>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
          isPremium ? 'bg-gold/20 text-gold' : scansRemaining > 1 ? 'bg-white/10 text-white' : scansRemaining === 1 ? 'bg-warning/20 text-warning' : 'bg-danger/20 text-red-300'
        }`}>
          {isPremium ? '♾ Illimité' : scansRemaining > 0 ? `${scansRemaining} restant${scansRemaining > 1 ? 's' : ''}` : 'Limite atteinte'}
        </div>
      </div>

      {!isPremium && scansRemaining === 1 && scanState === 'idle' && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-warning/10 border-b border-warning/30 px-6 py-2.5 text-center">
          <p className="text-warning text-xs font-semibold">⚠️ Il vous reste 1 scan gratuit ce mois-ci</p>
        </motion.div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-burgundy-dark/20 blur-[80px]" />
        </div>

        <AnimatePresence mode="wait">

          {scanState === 'idle' && !showManualSearch && (
            <motion.div key="idle" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center text-center z-10 w-full max-w-sm">
              <div className="relative mb-8">
                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2.5, repeat: Infinity }} className="w-64 h-64 rounded-3xl border-2 border-dashed border-white/20 flex items-center justify-center relative overflow-hidden bg-white/5">
                  <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-gold rounded-tl-lg" />
                  <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-gold rounded-tr-lg" />
                  <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-gold rounded-bl-lg" />
                  <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-gold rounded-br-lg" />
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                      <Camera size={32} color="rgba(255,255,255,0.7)" />
                    </div>
                    <p className="text-white/40 text-xs px-4">Pointez vers l'étiquette</p>
                  </div>
                  <motion.div animate={{ y: [-80, 80, -80] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent opacity-70" />
                </motion.div>
              </div>

              <h1 className="font-display text-2xl font-bold text-white mb-2">Scanner une bouteille</h1>
              <p className="text-white/50 text-sm mb-8 leading-relaxed max-w-xs">
                {isMobile ? "Prenez une photo ou importez depuis la galerie, notre IA identifie l'étiquette." : "Prenez en photo l'étiquette, notre IA GPT-4o l'identifie et vous donne un score personnalisé."}
              </p>

              {isMobile ? (
                <>
                  <button
                    onClick={!isPremium && scansRemaining === 0 ? () => navigate('/premium') : () => fileInputRef.current?.click()}
                    className={`w-full py-5 rounded-2xl font-bold text-lg mb-4 flex items-center justify-center gap-3 border-none transition-all duration-200 ${isPremium || scansRemaining > 0 ? 'bg-burgundy-dark text-white shadow-[0_8px_32px_rgba(114,47,55,0.5)] hover:bg-burgundy-medium hover:-translate-y-0.5 active:scale-95 cursor-pointer' : 'bg-white/10 text-white/40 cursor-not-allowed'}`}
                  >
                    <Camera size={22} className="flex-shrink-0" />
                    <span>{!isPremium && scansRemaining === 0 ? 'Passer Premium →' : 'Prendre une photo'}</span>
                  </button>
                  <p className="text-white/40 text-xs mb-3">Ouvre l’appareil photo ou la galerie</p>
                  <div className="flex gap-3 w-full">
                    <button onClick={() => setShowManualSearch(true)} className="flex-1 py-3.5 rounded-xl border border-white/20 text-white/70 text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/5 transition-colors bg-transparent cursor-pointer">
                      <Search size={16} className="flex-shrink-0" />
                      <span>Rechercher</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={!isPremium && scansRemaining === 0 ? () => navigate('/premium') : startCamera}
                    className={`w-full py-5 rounded-2xl font-bold text-lg mb-4 flex items-center justify-center gap-3 border-none transition-all duration-200 ${isPremium || scansRemaining > 0 ? 'bg-burgundy-dark text-white shadow-[0_8px_32px_rgba(114,47,55,0.5)] hover:bg-burgundy-medium hover:-translate-y-0.5 active:scale-95 cursor-pointer' : 'bg-white/10 text-white/40 cursor-not-allowed'}`}
                  >
                    <Camera size={22} className="flex-shrink-0" />
                    <span>{!isPremium && scansRemaining === 0 ? 'Passer Premium →' : 'Activer la caméra'}</span>
                  </button>
                  <div className="flex gap-3 w-full">
                    <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-3.5 rounded-xl border border-white/20 text-white/70 text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/5 transition-colors bg-transparent cursor-pointer">
                      <Upload size={16} /> Importer une photo
                    </button>
                    <button onClick={() => setShowManualSearch(true)} className="flex-1 py-3.5 rounded-xl border border-white/20 text-white/70 text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/5 transition-colors bg-transparent cursor-pointer">
                      <Search size={16} /> Rechercher
                    </button>
                  </div>
                </>
              )}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/heic,image/webp" capture="environment" onChange={handleFileChange} className="hidden" />

              <button
                onClick={() => navigate('/menu')}
                className="w-full mt-3 py-4 bg-white/5 border border-white/20 text-white rounded-2xl font-semibold text-sm flex items-center justify-between gap-3 cursor-pointer hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-center gap-3 flex-1 min-w-0">
                  <span className="text-lg flex-shrink-0">📋</span>
                  <div className="text-center min-w-0">
                    <p className="font-semibold text-sm">Scanner la carte du restaurant</p>
                    <p className="text-white/40 text-xs">Trouvez le meilleur rapport qualité-prix</p>
                  </div>
                </div>
                <ChevronRight size={16} color="rgba(255,255,255,0.4)" className="flex-shrink-0" />
              </button>

              <button
                onClick={() => navigate('/food-pairing')}
                className="w-full mt-3 py-4 bg-white/5 border border-white/20 text-white rounded-2xl font-semibold text-sm flex items-center justify-between gap-3 cursor-pointer hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-center gap-3 flex-1 min-w-0">
                  <span className="text-lg flex-shrink-0">🍽️</span>
                  <div className="text-center min-w-0">
                    <p className="font-semibold text-sm">Quel vin avec ce plat ?</p>
                    <p className="text-white/40 text-xs">Scannez votre assiette → accord parfait</p>
                  </div>
                </div>
                <ChevronRight size={16} color="rgba(255,255,255,0.4)" className="flex-shrink-0" />
              </button>
            </motion.div>
          )}

          {scanState === 'camera_active' && (
            <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-sm z-10">
              {cameraError ? (
                <div className="bg-danger/20 border border-danger/30 rounded-2xl p-6 text-center">
                  <AlertCircle size={36} color="#ef4444" className="mx-auto mb-3" />
                  <p className="text-white text-sm leading-relaxed mb-5">{cameraError}</p>
                  <button onClick={() => fileInputRef.current?.click()} className="w-full bg-white text-black-wine py-3.5 rounded-xl font-semibold text-sm border-none cursor-pointer">Importer une photo à la place</button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </div>
              ) : (
                <div className="rounded-3xl overflow-hidden relative">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-3xl" style={{ maxHeight: '55vh', objectFit: 'cover' }} />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="relative w-52 h-52">
                      <div className="absolute top-0 left-0 w-8 h-8" style={{ borderTop: '3px solid #D4AF37', borderLeft: '3px solid #D4AF37' }} />
                      <div className="absolute top-0 right-0 w-8 h-8" style={{ borderTop: '3px solid #D4AF37', borderRight: '3px solid #D4AF37' }} />
                      <div className="absolute bottom-0 left-0 w-8 h-8" style={{ borderBottom: '3px solid #D4AF37', borderLeft: '3px solid #D4AF37' }} />
                      <div className="absolute bottom-0 right-0 w-8 h-8" style={{ borderBottom: '3px solid #D4AF37', borderRight: '3px solid #D4AF37' }} />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-5">
                    <AnimatePresence mode="wait">
                      <motion.p key={currentTip} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-white/60 text-xs text-center mb-4">
                        💡 {tips[currentTip]}
                      </motion.p>
                    </AnimatePresence>
                    <button onClick={captureFromCamera} className="w-full py-4 bg-gold text-black-wine rounded-2xl font-bold text-base border-none cursor-pointer hover:bg-gold-light active:scale-95 transition-all flex items-center justify-center gap-2">
                      <Camera size={20} /> Prendre la photo
                    </button>
                  </div>
                </div>
              )}
              <button onClick={handleReset} className="w-full mt-3 py-3 text-white/40 text-sm bg-transparent border-none cursor-pointer hover:text-white/70 transition-colors">Annuler</button>
            </motion.div>
          )}

          {(scanState === 'capturing') && (
            <motion.div key="capturing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center text-center z-10">
              <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 0.5, repeat: Infinity }} className="w-28 h-28 rounded-full bg-burgundy-dark/30 border-2 border-burgundy-dark flex items-center justify-center mb-6">
                <Camera size={48} color="#D4AF37" />
              </motion.div>
              <h2 className="font-display text-2xl font-bold text-white mb-2">Capture en cours...</h2>
              <p className="text-white/50 text-sm">Envoi à l'IA GPT-4o</p>
            </motion.div>
          )}

          {scanState === 'analyzing' && (
            <motion.div key="analyzing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center text-center z-10 w-full max-w-sm">
              <div className="relative mb-8">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="w-24 h-24 rounded-full border-4 border-white/10 border-t-gold" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl">{ANALYSIS_STEPS[analysisStep]?.emoji || '🍷'}</span>
                </div>
              </div>
              <h2 className="font-display text-2xl font-bold text-white mb-2">Analyse IA en cours</h2>
              <p className="text-white/40 text-xs mb-6">GPT-4o Vision lit votre étiquette...</p>
              <div className="w-full bg-white/10 rounded-full h-1.5 mb-6 overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-burgundy-dark to-gold rounded-full" animate={{ width: `${analysisProgress}%` }} transition={{ duration: 0.5 }} />
              </div>
              <div className="w-full space-y-2">
                {ANALYSIS_STEPS.map((step, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: i <= analysisStep ? 1 : 0.25, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${i < analysisStep ? 'bg-success' : i === analysisStep ? 'bg-gold' : 'bg-white/10'}`}>
                      {i < analysisStep ? <span className="text-white text-xs font-bold">✓</span> : i === analysisStep ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-3 h-3 rounded-full border-2 border-black-wine border-t-transparent" /> : <div className="w-2 h-2 rounded-full bg-white/30" />}
                    </div>
                    <span className={`text-sm font-medium ${i <= analysisStep ? 'text-white' : 'text-white/25'}`}>{step.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {scanState === 'error' && (
            <motion.div key="error" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center text-center z-10 w-full max-w-sm">
              <div className="w-20 h-20 rounded-full bg-danger/20 flex items-center justify-center mb-5">
                <AlertCircle size={40} color="#ef4444" />
              </div>
              <h2 className="font-display text-xl font-bold text-white mb-2">Oups&#x202F;!</h2>
              <p className="text-white/60 text-sm mb-8 leading-relaxed max-w-xs">{errorMessage || cameraError || 'Une erreur est survenue. Réessayez.'}</p>
              <button onClick={handleReset} className="w-full py-4 bg-white text-black-wine rounded-2xl font-bold text-base border-none cursor-pointer hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2">
                <RotateCcw size={18} /> Réessayer
              </button>
              <button onClick={() => { handleReset(); fileInputRef.current?.click(); }} className="w-full mt-3 py-3.5 border border-white/20 text-white/60 text-sm rounded-xl bg-transparent cursor-pointer hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                <Upload size={16} /> Importer une photo à la place
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </motion.div>
          )}

          {showManualSearch && scanState === 'idle' && (
            <motion.div key="manual" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="z-10 w-full max-w-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-xl font-bold text-white">Recherche manuelle</h2>
                <button onClick={() => setShowManualSearch(false)} className="bg-white/10 rounded-full p-2 border-none cursor-pointer hover:bg-white/20 transition-colors">
                  <X size={18} color="white" />
                </button>
              </div>
              <p className="text-white/50 text-sm mb-4">Tapez le nom exact du vin pour obtenir sa fiche complète.</p>
              <input
                type="text"
                value={manualQuery}
                onChange={e => setManualQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleManualSearch()}
                placeholder="Ex : Château Margaux 2018, Sancerre..."
                className="w-full px-5 py-4 bg-white/10 border-2 border-white/20 rounded-2xl text-white placeholder-white/30 focus:border-gold focus:outline-none text-sm mb-4"
                autoFocus
              />
              <button onClick={handleManualSearch} disabled={!manualQuery.trim()} className="w-full py-4 bg-gold text-black-wine rounded-2xl font-bold text-base border-none cursor-pointer disabled:opacity-40 hover:bg-gold-light active:scale-95 transition-all flex items-center justify-center gap-2">
                <Search size={20} /> Analyser ce vin
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {scanState === 'idle' && !showManualSearch && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="px-6 py-4 flex-shrink-0">
          <AnimatePresence mode="wait">
            <motion.div key={currentTip} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="flex items-center justify-center gap-2 bg-white/5 rounded-2xl px-4 py-3 max-w-sm mx-auto">
              <Zap size={14} color="#D4AF37" className="flex-shrink-0" />
              <p className="text-white/40 text-xs text-center">{tips[currentTip]}</p>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        feature="Scans illimités"
        description="Vous avez atteint la limite de 3 scans gratuits. Passez à Sommely Pro pour scanner autant de vins que vous voulez."
      />
    </div>
  );
}
