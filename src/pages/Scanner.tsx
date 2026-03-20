import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Search, Zap, AlertCircle, X, RotateCcw, ChevronRight } from 'lucide-react';
import { analyzeWineLabel, enrichWineData } from '../lib/openai';
import { calculatePersonalizedScore, generateDetailedExplanation } from '../lib/matchScore';
import { canScan } from '../utils/subscription';
import { PaywallModal } from '../components/PaywallModal';
import { useAuth } from '../context/AuthContext';
import { insertScan, updateProfile, getProfile } from '../lib/supabase';

type ScanState = 'idle' | 'camera_active' | 'capturing' | 'analyzing' | 'error';

const ANALYSIS_STEPS = [
  { label: "📸 Image reçue...", emoji: '📸' },
  { label: "🔍 Identification du vin...", emoji: '🔍' },
  { label: "🍷 Calcul de votre score...", emoji: '🍷' },
  { label: "✨ Finalisation...", emoji: '✨' },
];

export function Scanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, subscriptionState, refreshSubscription, refreshProfile } = useAuth();
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

  // Ouvre la caméra automatiquement au montage si getUserMedia est disponible
  useEffect(() => {
    if (navigator.mediaDevices) startCamera();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // iOS Safari: le <video> n'est monté qu'APRÈS setScanState('camera_active').
  // Ce useEffect attache le stream au videoRef dès que l'élément est disponible.
  useEffect(() => {
    if (scanState === 'camera_active' && videoRef.current && streamRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [scanState]);

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
      // Stocker le stream AVANT setScanState pour que le useEffect puisse l'attacher
      // quand le <video> sera monté (iOS Safari: videoRef.current est null ici)
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
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

    // Feedback progressif : 0-2s, 2-5s, 5-8s, 8-12s — rend l'attente perçue plus courte
    const stepTimes = [0, 2, 5, 8, 12];
    const stepStart = Date.now();
    const updateStepFromTime = () => {
      const elapsedSec = (Date.now() - stepStart) / 1000;
      let idx = 0;
      for (let i = 0; i < stepTimes.length; i++) {
        if (elapsedSec >= stepTimes[i]) idx = i;
      }
      setAnalysisStep(Math.min(idx, ANALYSIS_STEPS.length - 1));
      setAnalysisProgress(Math.min(100, Math.round((idx / (ANALYSIS_STEPS.length - 1)) * 100)));
    };
    const progressInterval = setInterval(updateStepFromTime, 500);

    // Timeout de sécurité : 20s max pour éviter le chargement infini
    const analysisTimeout = setTimeout(() => {
      setErrorMessage("L'analyse a pris trop de temps. Vérifiez votre connexion et réessayez.");
      setScanState('error');
    }, 20000);

    try {
      const wineAnalysis = await analyzeWineLabel(base64);

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
        dosage: wineAnalysis.dosage,
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
        bottlePrices: (enrichedData.bottlePrices as { cl1875?: number; cl375?: number; cl750?: number; cl1500?: number; cl3000?: number; cl6000?: number } | undefined),
        priceRange: (enrichedData.priceRange as { min: number; max: number } | undefined),
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
        const { data: prof } = await getProfile(user.id);
        await updateProfile(user.id, {
          last_scan_at: new Date().toISOString(),
          total_scans: (prof?.total_scans ?? 0) + 1,
        });
        refreshSubscription();
        refreshProfile();
      }

      // Si on vient de la cave : aller sur /cave avec prefill pour ajouter la bouteille
      const fromCave = (location.state as { fromCave?: boolean })?.fromCave;
      if (fromCave) {
        navigate('/cave', {
          state: {
            prefill: {
              name: wineObject.name,
              year: wineObject.year,
              region: wineObject.region,
              type: wineObject.type,
              grapes: wineObject.grapes,
            },
          },
        });
      } else {
        navigate('/result', {
          state: {
            wine: wineObject,
            score: scoreBreakdown.total,
            explanation,
            scoreBreakdown,
          },
        });
      }

    } catch (error: any) {
      console.error('❌ Erreur analyse IA:', error);
      console.error('❌ Détails erreur:', {
        message: error?.message,
        status: error?.status,
        name: error?.name,
        stack: error?.stack?.slice?.(0, 400),
      });

      if (error?.message?.includes('API key') || error?.status === 401) {
        setErrorMessage('Erreur d\'authentification OpenAI. Le proxy Vercel (/api/openai-proxy) est peut-être mal configuré.');
      } else if (error?.status === 429) {
        setErrorMessage('Quota OpenAI dépassé. Attendez quelques secondes et réessayez.');
      } else if (error?.message?.includes('Failed to fetch') || error?.message?.includes('network') || error?.message?.includes('fetch')) {
        setErrorMessage('Erreur réseau. Vérifiez votre connexion internet.');
      } else if (error?.status === 400) {
        setErrorMessage("Image non reconnue par l'IA. Réessayez avec une photo plus nette.");
      } else {
        const msg = error?.message || String(error);
        setErrorMessage(msg.length > 120 ? `${msg.slice(0, 120)}...` : msg || "Erreur lors de l'analyse.");
      }
      setScanState('error');
    } finally {
      clearInterval(progressInterval);
      clearTimeout(analysisTimeout);
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

  // ─── RENDU CAMÉRA PLEIN ÉCRAN ─────────────────────────────
  // Couvre camera_active ET capturing pour garder videoRef/canvasRef montés
  // pendant toute la durée de captureFromCamera (qui accède aux refs après setScanState + 150ms)

  if (scanState === 'camera_active' || scanState === 'capturing') {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 50, overflow: 'hidden', fontFamily: 'DM Sans, sans-serif' }}>

        {/* Vidéo plein écran — toujours montée pour que captureFromCamera puisse lire les frames */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Flash blanc + indicateur au moment de la capture */}
        {scanState === 'capturing' && (
          <>
            <motion.div
              initial={{ opacity: 0.95 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              style={{ position: 'absolute', inset: 0, background: 'white', zIndex: 40, pointerEvents: 'none' }}
            />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                style={{ width: 112, height: 112, borderRadius: '50%', background: 'rgba(114,47,55,0.3)', border: '2px solid #722F37', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}
              >
                <Camera size={48} color="#D4AF37" />
              </motion.div>
              <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: 8 }}>Capture en cours...</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Envoi à l&apos;IA GPT-4o</p>
            </div>
          </>
        )}

        {/* UI caméra active */}
        {scanState === 'camera_active' && (
          <>
            {/* Bouton fermer — fixed top-right pour ne pas confliter avec le logo Sommely (top-left) */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleReset}
              style={{
                position: 'fixed',
                top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
                right: 16,
                zIndex: 200,
                width: 40, height: 40, borderRadius: '50%',
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={20} color="white" />
            </motion.button>

            {/* Barre supérieure — compteur + galerie */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
              paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
              paddingLeft: 20, paddingRight: 20, paddingBottom: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.65), transparent)',
            }}>
              {/* Spacer gauche pour équilibrer la mise en page */}
              <div style={{ width: 40 }} />

              {/* Compteur scans */}
              <div style={{ background: isPremium ? 'rgba(212,175,55,0.2)' : 'rgba(0,0,0,0.45)', borderRadius: 999, padding: '4px 12px', border: '1px solid rgba(255,255,255,0.12)' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: isPremium ? '#D4AF37' : scansRemaining > 1 ? 'rgba(255,255,255,0.7)' : scansRemaining === 1 ? '#fb923c' : '#f87171' }}>
                  {isPremium ? '∞ Illimité' : `${scansRemaining} scan${scansRemaining !== 1 ? 's' : ''}`}
                </span>
              </div>

              {/* Spacer droit pour équilibrer la mise en page */}
              <div style={{ width: 40 }} />
            </div>

            {/* Viseur doré — centré légèrement au-dessus du milieu pour laisser place au bouton */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -60%)', width: '75%', aspectRatio: '3 / 4' }}>
                {([
                  { top: 0, left: 0, borderTop: '3px solid rgba(212,175,55,0.9)', borderLeft: '3px solid rgba(212,175,55,0.9)', borderRadius: '4px 0 0 0' },
                  { top: 0, right: 0, borderTop: '3px solid rgba(212,175,55,0.9)', borderRight: '3px solid rgba(212,175,55,0.9)', borderRadius: '0 4px 0 0' },
                  { bottom: 0, left: 0, borderBottom: '3px solid rgba(212,175,55,0.9)', borderLeft: '3px solid rgba(212,175,55,0.9)', borderRadius: '0 0 0 4px' },
                  { bottom: 0, right: 0, borderBottom: '3px solid rgba(212,175,55,0.9)', borderRight: '3px solid rgba(212,175,55,0.9)', borderRadius: '0 0 4px 0' },
                ] as const).map((s, i) => (
                  <motion.div key={i} style={{ position: 'absolute', width: 32, height: 32, ...s }}
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }} />
                ))}
              </div>
            </div>

            {/* Conseil — au-dessus du bouton capture */}
            <div style={{ position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 182px)', left: 32, right: 32, display: 'flex', justifyContent: 'center', zIndex: 15, pointerEvents: 'none' }}>
              <AnimatePresence mode="wait">
                <motion.p key={currentTip} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, textAlign: 'center' }}>
                  💡 {tips[currentTip]}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Bouton capture rond 72px — fixed pour passer au-dessus de la BottomNav */}
            <div style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20,
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 110px)',
              paddingTop: 60,
              display: 'flex', justifyContent: 'center',
              background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)',
              pointerEvents: 'none',
            }}>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={captureFromCamera}
                style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'white',
                  border: '4px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  pointerEvents: 'auto',
                }}
              />
            </div>
          </>
        )}

        <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/heic,image/webp" onChange={handleFileChange} className="hidden" />
        <PaywallModal
          isOpen={showPaywall}
          onClose={() => setShowPaywall(false)}
          feature="Scans illimités"
          description="Vous avez atteint la limite de 3 scans gratuits. Passez à Sommely Pro pour scanner autant de vins que vous voulez."
        />
      </div>
    );
  }

  // ─── RENDU PRINCIPAL (idle / error / analyzing / manual) ──

  return (
    <div className="min-h-screen flex flex-col font-body overflow-y-auto" style={{ background: '#0a0a0a' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 z-20 relative flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="w-16" />
        <span className="font-display font-bold text-white text-sm" style={{ letterSpacing: '-0.02em' }}>Scanner</span>
        <div className={`px-3 py-1 rounded-full text-xs font-bold`}
          style={{ background: isPremium ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.07)', color: isPremium ? '#D4AF37' : scansRemaining > 1 ? 'rgba(255,255,255,0.5)' : scansRemaining === 1 ? '#fb923c' : '#f87171' }}>
          {isPremium ? '∞ Illimité' : `${scansRemaining} scan${scansRemaining !== 1 ? 's' : ''}`}
        </div>
      </div>

      {!isPremium && scansRemaining === 1 && scanState === 'idle' && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-warning/10 border-b border-warning/30 px-6 py-2.5 text-center">
          <p className="text-warning text-xs font-semibold">⚠️ Il vous reste 1 scan gratuit ce mois-ci</p>
        </motion.div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-6 relative" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 100px)' }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-burgundy-dark/20 blur-[80px]" />
        </div>

        <AnimatePresence mode="wait">

          {scanState === 'idle' && !showManualSearch && (
            <motion.div key="idle" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center text-center z-10 w-full max-w-sm">
              {/* Viewfinder — full width Apple Camera style */}
              <div className="relative w-full mb-6" style={{ maxWidth: 320 }}>
                <motion.div
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -inset-4 rounded-full blur-3xl pointer-events-none"
                  style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)' }}
                />
                
                <div className="relative rounded-[2rem] overflow-hidden"
                  style={{ aspectRatio: '1/1', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  
                  {/* Corner L-brackets */}
                  {[
                    { pos: 'top-4 left-4', style: { borderTop: '2px solid rgba(212,175,55,0.9)', borderLeft: '2px solid rgba(212,175,55,0.9)', borderRadius: '4px 0 0 0', width: 28, height: 28 } },
                    { pos: 'top-4 right-4', style: { borderTop: '2px solid rgba(212,175,55,0.9)', borderRight: '2px solid rgba(212,175,55,0.9)', borderRadius: '0 4px 0 0', width: 28, height: 28 } },
                    { pos: 'bottom-4 left-4', style: { borderBottom: '2px solid rgba(212,175,55,0.9)', borderLeft: '2px solid rgba(212,175,55,0.9)', borderRadius: '0 0 0 4px', width: 28, height: 28 } },
                    { pos: 'bottom-4 right-4', style: { borderBottom: '2px solid rgba(212,175,55,0.9)', borderRight: '2px solid rgba(212,175,55,0.9)', borderRadius: '0 0 4px 0', width: 28, height: 28 } },
                  ].map((c, i) => (
                    <motion.div key={i} className={`absolute ${c.pos}`} style={c.style}
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }} />
                  ))}

                  {/* Center reticle */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div animate={{ scale: [0.95, 1.02, 0.95], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                      className="w-8 h-8 rounded-full"
                      style={{ border: '1px solid rgba(212,175,55,0.5)' }} />
                  </div>

                  {/* Scan line */}
                  <motion.div
                    animate={{ y: ['-40%', '140%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 0.5 }}
                    className="absolute left-8 right-8 h-px"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.7) 30%, rgba(212,175,55,0.9) 50%, rgba(212,175,55,0.7) 70%, transparent)', boxShadow: '0 0 8px rgba(212,175,55,0.4)' }} />
                  
                  {/* Vignette */}
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)',
                  }}/>
                </div>
              </div>

              <h1 className="font-display font-bold text-white mb-2 text-center" style={{ fontSize: '1.5rem', letterSpacing: '-0.03em' }}>Scanner une bouteille</h1>
              <p className="text-center text-sm mb-6 leading-relaxed max-w-xs" style={{ color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
                GPT-4o identifie l&apos;étiquette et calcule<br/>votre score personnalisé en 3 secondes.
              </p>

              <button
                onClick={!isPremium && scansRemaining === 0 ? () => navigate('/premium') : startCamera}
                className={`w-full py-5 rounded-2xl font-bold text-lg mb-4 flex items-center justify-center gap-3 border-none transition-all duration-200 ${isPremium || scansRemaining > 0 ? 'bg-burgundy-dark text-white shadow-[0_8px_32px_rgba(114,47,55,0.5)] hover:bg-burgundy-medium hover:-translate-y-0.5 active:scale-95 cursor-pointer' : 'bg-white/10 text-white/40 cursor-not-allowed'}`}
              >
                <Camera size={22} className="flex-shrink-0" />
                <span>{!isPremium && scansRemaining === 0 ? 'Passer Premium →' : 'Activer la caméra'}</span>
              </button>
              <div className="flex gap-3 w-full">
                <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-3.5 rounded-xl border border-white/20 text-white/70 text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/5 transition-colors bg-transparent cursor-pointer">
                  <Upload size={16} className="flex-shrink-0" /><span>Galerie</span>
                </button>
                <button onClick={() => setShowManualSearch(true)} className="flex-1 py-3.5 rounded-xl border border-white/20 text-white/70 text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/5 transition-colors bg-transparent cursor-pointer">
                  <Search size={16} className="flex-shrink-0" /><span>Rechercher</span>
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/heic,image/webp" onChange={handleFileChange} className="hidden" />

              <button
                onClick={() => navigate('/menu')}
                className="w-full mt-3 py-4 rounded-2xl font-semibold text-sm flex items-center justify-between gap-3 cursor-pointer border-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'white' }}
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

          {scanState === 'idle' && !showManualSearch && (
            <motion.div key="tip" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="w-full max-w-sm px-2 py-4">
              <div className="flex items-center justify-center gap-2 bg-white/5 rounded-2xl px-4 py-3">
                <Zap size={14} color="#D4AF37" className="flex-shrink-0" />
                <p className="text-white/40 text-xs text-center">{tips[currentTip]}</p>
              </div>
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
              <p className="text-white/40 text-xs mb-6">{ANALYSIS_STEPS[analysisStep]?.label || 'GPT-4o Vision lit votre étiquette...'}</p>
              <div className="w-full bg-white/10 rounded-full h-1.5 mb-6 overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-burgundy-dark to-gold rounded-full" animate={{ width: `${analysisProgress}%` }} transition={{ duration: 0.5 }} />
              </div>
              <div className="w-full space-y-2">
                {ANALYSIS_STEPS.map((step, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: i <= analysisStep ? 1 : 0.25, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${i < analysisStep ? 'bg-success' : i === analysisStep ? 'bg-gold' : 'bg-white/10'}`}>
                      {i < analysisStep ? <span className="text-white text-xs font-bold">✓</span> : i === analysisStep ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-3 h-3 rounded-full border-2 border-black-wine border-t-transparent" /> : <div className="w-2 h-2 rounded-full bg-white/30" />}
                    </div>
                    <span className={`text-sm font-medium ${i <= analysisStep ? 'text-white' : 'text-white/25'}`}>
                      {step.label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {scanState === 'error' && (
            <motion.div key="error" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center text-center z-10 w-full max-w-sm">
              {cameraError ? (
                /* Erreur d'accès caméra (permissions refusées, caméra absente…) */
                <>
                  <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-5">
                    <Camera size={36} color="rgba(212,175,55,0.9)" />
                  </div>
                  <h2 className="font-display text-xl font-bold text-white mb-2">Accès à la caméra</h2>
                  <p className="text-white/60 text-sm mb-8 leading-relaxed max-w-xs">{cameraError}</p>
                  <button onClick={startCamera} className="w-full py-4 bg-white text-black-wine rounded-2xl font-bold text-base border-none cursor-pointer hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2">
                    <RotateCcw size={18} /> Réessayer
                  </button>
                  <button onClick={() => { setCameraError(''); setScanState('idle'); setTimeout(() => fileInputRef.current?.click(), 50); }} className="w-full mt-3 py-3.5 border border-white/20 text-white/60 text-sm rounded-xl bg-transparent cursor-pointer hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                    <Upload size={16} /> Choisir depuis la galerie
                  </button>
                </>
              ) : (
                /* Erreur analyse IA */
                <>
                  <div className="w-20 h-20 rounded-full bg-danger/20 flex items-center justify-center mb-5">
                    <AlertCircle size={40} color="#ef4444" />
                  </div>
                  <h2 className="font-display text-xl font-bold text-white mb-2">Oups&#x202F;!</h2>
                  <p className="text-white/60 text-sm mb-8 leading-relaxed max-w-xs">{errorMessage || 'Une erreur est survenue. Réessayez.'}</p>
                  <button onClick={() => { handleReset(); setTimeout(() => startCamera(), 50); }} className="w-full py-4 bg-white text-black-wine rounded-2xl font-bold text-base border-none cursor-pointer hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2">
                    <RotateCcw size={18} /> Réessayer
                  </button>
                  <button onClick={() => { handleReset(); fileInputRef.current?.click(); }} className="w-full mt-3 py-3.5 border border-white/20 text-white/60 text-sm rounded-xl bg-transparent cursor-pointer hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                    <Upload size={16} /> Importer une photo à la place
                  </button>
                </>
              )}
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

{/* Tips moved inside scroll area - see idle state below */}

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        feature="Scans illimités"
        description="Vous avez atteint la limite de 3 scans gratuits. Passez à Sommely Pro pour scanner autant de vins que vous voulez."
      />
    </div>
  );
}
