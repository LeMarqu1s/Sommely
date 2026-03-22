import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Bell, Trash2, RefreshCw, DollarSign, BarChart2, Package, X, Filter, Camera } from 'lucide-react';
import { canAddToCave } from '../utils/subscription';
import { fetchOpenAI } from '../lib/openai';
import { PaywallModal } from '../components/PaywallModal';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  getCaveBottles,
  insertCaveBottle,
  updateCaveBottle,
  deleteCaveBottle,
  type CaveBottleRow,
} from '../lib/supabase';

// ─── TYPES ────────────────────────────────────────────────

interface PriceHistory { date: string; price: number; event?: string; }

interface CaveBottle {
  id: string; name: string; year: number; region: string; type: string;
  appellation?: string; grapes?: string; quantity: number;
  purchasePrice: number; estimatedCurrentValue: number;
  priceHistory: PriceHistory[]; lastPriceUpdate: string;
  priceVariation24h: number; drinkFrom: number; drinkUntil: number;
  peakYear: number; status: 'trop_tot' | 'boire_maintenant' | 'apogee' | 'trop_tard';
  alert?: 'hausse' | 'baisse' | null; notes?: string;
  addedDate: string; location?: string;
}

interface CaveValuePoint { month: string; totalValue: number; totalCost: number; }

// ─── HELPERS ──────────────────────────────────────────────

const todayStr = () => new Date().toISOString().split('T')[0];

function getStatus(b: Partial<CaveBottle>): CaveBottle['status'] {
  const y = new Date().getFullYear();
  if (!b.drinkFrom || !b.drinkUntil || !b.peakYear) return 'boire_maintenant';
  if (y < b.drinkFrom) return 'trop_tot';
  if (y > b.drinkUntil) return 'trop_tard';
  if (y >= b.peakYear - 1 && y <= b.peakYear + 2) return 'apogee';
  return 'boire_maintenant';
}

function sc(s: CaveBottle['status']) {
  return {
    trop_tot: { label: 'Trop tôt', color: '#1976D2', bg: 'bg-blue-50 border-blue-200', emoji: '⏳' },
    boire_maintenant: { label: 'Prêt à boire', color: '#2E7D32', bg: 'bg-green-50 border-green-200', emoji: '✅' },
    apogee: { label: 'À son apogée', color: '#B8860B', bg: 'bg-yellow-50 border-yellow-200', emoji: '🏆' },
    trop_tard: { label: 'Passé', color: '#C62828', bg: 'bg-red-50 border-red-200', emoji: '⚠️' },
  }[s];
}

function genHistory(bottles: CaveBottle[]): CaveValuePoint[] {
  const pts: CaveValuePoint[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const f = 1 - i * 0.007 + (Math.sin(i) * 0.005);
    pts.push({
      month: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      totalValue: Math.round(bottles.reduce((s, b) => s + b.estimatedCurrentValue * f * b.quantity, 0)),
      totalCost: Math.round(bottles.reduce((s, b) => s + b.purchasePrice * b.quantity, 0)),
    });
  }
  if (pts.length > 0) pts[pts.length - 1].totalValue = Math.round(bottles.reduce((s, b) => s + b.estimatedCurrentValue * b.quantity, 0));
  return pts;
}

// ─── MAPPING DB ↔ APP ─────────────────────────────────────

function rowToBottle(r: CaveBottleRow): CaveBottle {
  const ph = Array.isArray(r.price_history) ? r.price_history : [];
  return {
    id: r.id,
    name: r.name,
    year: r.vintage,
    region: r.region ?? '',
    type: (r.wine_type as CaveBottle['type']) ?? 'Rouge',
    appellation: r.appellation ?? undefined,
    grapes: r.grapes ?? undefined,
    quantity: r.quantity,
    purchasePrice: Number(r.price_paid),
    estimatedCurrentValue: Number(r.current_price),
    priceHistory: ph as PriceHistory[],
    lastPriceUpdate: r.last_price_update ?? todayStr(),
    priceVariation24h: Number(r.price_variation_24h ?? 0),
    drinkFrom: r.drink_from ?? new Date().getFullYear() + 2,
    drinkUntil: r.drink_until ?? new Date().getFullYear() + 8,
    peakYear: r.peak_year ?? new Date().getFullYear() + 4,
    status: getStatus({
      drinkFrom: r.drink_from ?? undefined,
      drinkUntil: r.drink_until ?? undefined,
      peakYear: r.peak_year ?? undefined,
    }),
    alert: (r.alert as CaveBottle['alert']) ?? null,
    notes: r.notes ?? undefined,
    addedDate: r.added_at?.split('T')[0] ?? todayStr(),
    location: r.location ?? undefined,
  };
}

function bottleToInsert(b: CaveBottle): Omit<CaveBottleRow, 'id' | 'user_id' | 'added_at'> {
  return {
    name: b.name,
    vintage: b.year,
    region: b.region || null,
    appellation: b.appellation || null,
    wine_type: b.type,
    grapes: b.grapes || null,
    price_paid: b.purchasePrice,
    current_price: b.estimatedCurrentValue,
    quantity: b.quantity,
    peak_start: b.drinkFrom ?? null,
    peak_end: b.drinkUntil ?? null,
    peak_year: b.peakYear ?? null,
    drink_from: b.drinkFrom ?? null,
    drink_until: b.drinkUntil ?? null,
    image_url: null,
    notes: b.notes ?? null,
    price_history: b.priceHistory ?? [],
    price_variation_24h: b.priceVariation24h ?? 0,
    last_price_update: b.lastPriceUpdate ?? null,
    alert: b.alert ?? null,
    location: b.location ?? null,
  };
}

const EMPTY = { name: '', year: new Date().getFullYear() - 2, region: '', type: 'Rouge', appellation: '', grapes: '', quantity: '1', purchasePrice: '', notes: '', location: '' };

// ─── GRAPHIQUE ────────────────────────────────────────────

function MiniChart({ history }: { history: CaveValuePoint[] }) {
  if (history.length < 2) return null;
  const vals = history.map(h => h.totalValue);
  const costs = history.map(h => h.totalCost);
  const maxV = Math.max(...vals, ...costs); const minV = Math.min(...vals, ...costs) * 0.95;
  const range = maxV - minV || 1; const W = 320; const H = 110; const P = 12;
  const gx = (i: number) => P + (i / (history.length - 1)) * (W - P * 2);
  const gy = (v: number) => H - P - ((v - minV) / range) * (H - P * 2);
  const vPath = vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${gx(i)} ${gy(v)}`).join(' ');
  const cPath = costs.map((v, i) => `${i === 0 ? 'M' : 'L'} ${gx(i)} ${gy(v)}`).join(' ');
  const aPath = [`M ${gx(0)} ${gy(vals[0])}`, ...vals.map((v, i) => `L ${gx(i)} ${gy(v)}`), `L ${gx(vals.length - 1)} ${H - P}`, `L ${gx(0)} ${H - P}`, 'Z'].join(' ');
  const isPos = vals[vals.length - 1] >= costs[costs.length - 1];
  const col = isPos ? '#4CAF50' : '#EF5350';
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={col} stopOpacity="0.3" /><stop offset="100%" stopColor={col} stopOpacity="0" /></linearGradient></defs>
      <path d={aPath} fill="url(#cg)" />
      <path d={cPath} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="4,3" />
      <path d={vPath} fill="none" stroke={col} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={gx(vals.length - 1)} cy={gy(vals[vals.length - 1])} r="5" fill={col} />
      {history.filter((_, i) => i % 3 === 0).map((h, i) => (
        <text key={i} x={gx(i * 3)} y={H} fontSize="7" fill="rgba(255,255,255,0.35)" textAnchor="middle">{h.month}</text>
      ))}
    </svg>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────

export function Cave() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, subscriptionState } = useAuth();
  const { theme, formatPrice } = useTheme();
  type View = 'overview' | 'list' | 'add' | 'detail' | 'sell';
  const [view, setView] = useState<View>('overview');
  const [bottles, setBottles] = useState<CaveBottle[]>([]);
  const [selected, setSelected] = useState<CaveBottle | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState<'gain' | 'status' | 'year' | 'name'>('gain');
  const [form, setForm] = useState(EMPTY);
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [history, setHistory] = useState<CaveValuePoint[]>([]);
  const [alerts, setAlerts] = useState<CaveBottle[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [sellData, setSellData] = useState<{ b: CaveBottle; cost: number; value: number; gross: number; fees: number; net: number; netPct: number; future: number; ytp: number } | null>(null);
  const projectionRef = useRef<HTMLDivElement>(null);
  const [lastUpdate, setLastUpdate] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const totalBottleCount = bottles.reduce((s, b) => s + b.quantity, 0);

  /* Bloquer le refresh natif iOS quand on tire vers le bas en haut de page */
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const deltaY = e.touches[0].clientY - startY;
      if (scrollTop === 0 && deltaY > 0) {
        e.preventDefault();
      }
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  const canAdd = !!user && canAddToCave(subscriptionState, totalBottleCount);

  const fetchCaveData = useCallback(async () => {
    if (!user?.id) return;
    let mounted = true;
    const { data } = await getCaveBottles(user.id);
    if (!mounted) return;
    const ws = (data || []).map(rowToBottle).map(b => ({ ...b, status: getStatus(b) }));
    setBottles(ws);
    setHistory(genHistory(ws));
    setAlerts(ws.filter(b => b.alert || Math.abs(b.priceVariation24h) >= 5));
    const lu = localStorage.getItem('sommely_cave_update') || '';
    setLastUpdate(lu);
    const stale = !lu || Date.now() - new Date(lu).getTime() > 86400000;
    if (stale && ws.length > 0) updatePrices(ws);
    return () => { mounted = false; };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setBottles([]);
      setHistory([]);
      setAlerts([]);
      return;
    }
    let mounted = true;
    getCaveBottles(user.id).then(({ data }) => {
      if (!mounted) return;
      const ws = (data || []).map(rowToBottle).map(b => ({ ...b, status: getStatus(b) }));
      setBottles(ws);
      setHistory(genHistory(ws));
      setAlerts(ws.filter(b => b.alert || Math.abs(b.priceVariation24h) >= 5));
      const lu = localStorage.getItem('sommely_cave_update') || '';
      setLastUpdate(lu);
      const stale = !lu || Date.now() - new Date(lu).getTime() > 86400000;
      if (stale && ws.length > 0) updatePrices(ws);
    });
    return () => { mounted = false; };
  }, [user?.id, refreshKey]);

  useEffect(() => {
    const prefill = (location.state as { prefill?: Partial<typeof EMPTY> })?.prefill;
    if (prefill && Object.keys(prefill).length > 0) {
      setForm(prev => ({ ...EMPTY, ...prev, ...prefill }));
      setView('add');
    }
  }, [location.state]);

  const persistQuantity = async (b: CaveBottle, qty: number) => {
    if (!user?.id) return;
    if (qty <= 0) {
      await deleteCaveBottle(user.id, b.id);
      const next = bottles.filter(x => x.id !== b.id);
      setBottles(next.map(x => ({ ...x, status: getStatus(x) })));
      setHistory(genHistory(next));
      setAlerts(next.filter(x => x.alert || Math.abs(x.priceVariation24h) >= 5));
      setSelected(null);
    } else {
      await updateCaveBottle(user.id, b.id, { quantity: qty });
      const updated = bottles.map(x => (x.id === b.id ? { ...x, quantity: qty } : x));
      setBottles(updated.map(x => ({ ...x, status: getStatus(x) })));
      setHistory(genHistory(updated));
      setSelected(prev => (prev?.id === b.id ? { ...prev, quantity: qty } : prev));
    }
  };

  const persistDelete = async (b: CaveBottle) => {
    if (!user?.id) return;
    await deleteCaveBottle(user.id, b.id);
    const next = bottles.filter(x => x.id !== b.id);
    setBottles(next.map(x => ({ ...x, status: getStatus(x) })));
    setHistory(genHistory(next));
    setAlerts(next.filter(x => x.alert || Math.abs(x.priceVariation24h) >= 5));
    setSelected(null);
  };

  const updatePrices = async (list: CaveBottle[]) => {
    if (!user?.id || isUpdating || list.length === 0) return;
    setIsUpdating(true);
    try {
      const wines = list.map(b => `id:${b.id} | "${b.name}" ${b.year} | acheté ${b.purchasePrice}€ | actuel ${b.estimatedCurrentValue}€`).join('\n');
      const res = await fetchOpenAI({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'Expert marché vins fins. JSON uniquement.' },
          { role: 'user', content: `Date: ${new Date().toLocaleDateString('fr-FR')}\nMets à jour les prix de ces vins selon le marché actuel:\n${wines}\n\nJSON:\n{"updates":[{"id":"...","newPrice":0,"variation24h":0.0,"trend":"hausse","reason":"..."}]}` },
        ],
        max_tokens: 600, temperature: 0.1, response_format: { type: 'json_object' },
      });
      const data = await res.json();
      const result = JSON.parse(data.choices?.[0]?.message?.content || '{}');
      if (result.updates) {
        const now = todayStr();
        const updated = list.map(b => {
          const u = result.updates.find((x: { id: string }) => x.id === b.id);
          if (!u) return b;
          const newP = u.newPrice || b.estimatedCurrentValue;
          const variation = ((newP - b.estimatedCurrentValue) / b.estimatedCurrentValue) * 100;
          return { ...b, estimatedCurrentValue: newP, priceVariation24h: u.variation24h || 0, lastPriceUpdate: now, alert: Math.abs(variation) >= 15 ? (variation > 0 ? 'hausse' : 'baisse') : null, priceHistory: [...b.priceHistory, ...(Math.abs(newP - b.estimatedCurrentValue) > 1 ? [{ date: now, price: newP, event: u.reason }] : [])].slice(-20) } as CaveBottle;
        });
        for (const b of updated) {
          const u = result.updates.find((x: { id: string }) => x.id === b.id);
          if (u) {
            await updateCaveBottle(user.id, b.id, {
              current_price: b.estimatedCurrentValue,
              price_variation_24h: b.priceVariation24h,
              last_price_update: b.lastPriceUpdate,
              alert: b.alert,
              price_history: b.priceHistory,
            });
          }
        }
        setBottles(updated.map(b => ({ ...b, status: getStatus(b) })));
        setHistory(genHistory(updated));
        setAlerts(updated.filter(b => b.alert || Math.abs(b.priceVariation24h) >= 5));
        const lu = new Date().toISOString();
        localStorage.setItem('sommely_cave_update', lu);
        setLastUpdate(lu);
        if (updated.filter(b => b.alert).length > 0) setShowAlerts(true);
      }
    } catch (e) { console.error(e); } finally { setIsUpdating(false); }
  };

  const addBottle = async () => {
    const purchasePriceNum = Number(String(form.purchasePrice).replace(',', '.')) || 0;
    const quantityNum = Math.max(1, parseInt(String(form.quantity), 10) || 1);
    if (!user?.id || !form.name || !form.purchasePrice || purchasePriceNum <= 0) return;
    if (!canAdd) {
      setShowPaywall(true);
      return;
    }
    setIsAdding(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout 15s')), 15000);
      });
      const fetchPromise = fetchOpenAI({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Expert vins fins. JSON uniquement.' },
          { role: 'user', content: `Vin: "${form.name}" ${form.year} ${form.region} | Achat: ${purchasePriceNum}€\nJSON:\n{"estimatedCurrentValue":0,"drinkFrom":0,"drinkUntil":0,"peakYear":0,"grapes":"","appellation":"","agingNote":""}` },
        ],
        max_tokens: 200, temperature: 0.1, response_format: { type: 'json_object' },
      });
      const res = await Promise.race([fetchPromise, timeoutPromise]);
      const data = await res.json();
      const ai = JSON.parse(data.choices?.[0]?.message?.content || '{}');
      const nb: CaveBottle = { id: '', name: form.name, year: Number(form.year), region: form.region, type: form.type, appellation: form.appellation || ai.appellation || '', grapes: form.grapes || ai.grapes || '', quantity: quantityNum, purchasePrice: purchasePriceNum, estimatedCurrentValue: ai.estimatedCurrentValue || Math.round(purchasePriceNum * 1.05), priceHistory: [{ date: todayStr(), price: purchasePriceNum, event: "Prix d'achat" }], lastPriceUpdate: todayStr(), priceVariation24h: 0, drinkFrom: ai.drinkFrom || new Date().getFullYear() + 2, drinkUntil: ai.drinkUntil || new Date().getFullYear() + 8, peakYear: ai.peakYear || new Date().getFullYear() + 4, status: 'trop_tot', alert: null, notes: form.notes || ai.agingNote || '', addedDate: todayStr(), location: form.location };
      nb.status = getStatus(nb);
      const { data: inserted } = await insertCaveBottle(user.id, bottleToInsert(nb));
      if (inserted) {
        const newBottle = rowToBottle(inserted);
        newBottle.status = getStatus(newBottle);
        setBottles(prev => [...prev, newBottle]);
        setHistory(genHistory([...bottles, newBottle]));
        setAlerts(prev => [...prev, newBottle].filter(b => b.alert || Math.abs(b.priceVariation24h) >= 5));
      }
    } catch {
      const nb: CaveBottle = { id: '', name: form.name, year: Number(form.year), region: form.region, type: form.type, appellation: form.appellation, grapes: form.grapes, quantity: quantityNum, purchasePrice: purchasePriceNum, estimatedCurrentValue: Math.round(purchasePriceNum * 1.05), priceHistory: [{ date: todayStr(), price: purchasePriceNum, event: "Prix d'achat" }], lastPriceUpdate: todayStr(), priceVariation24h: 0, drinkFrom: new Date().getFullYear() + 2, drinkUntil: new Date().getFullYear() + 8, peakYear: new Date().getFullYear() + 4, status: 'trop_tot', alert: null, notes: form.notes, addedDate: todayStr(), location: form.location };
      const { data: inserted } = await insertCaveBottle(user.id, bottleToInsert(nb));
      if (inserted) {
        const newBottle = rowToBottle(inserted);
        newBottle.status = getStatus(newBottle);
        setBottles(prev => [...prev, newBottle]);
        setHistory(genHistory([...bottles, newBottle]));
      }
    } finally {
      clearTimeout(timeout);
      setIsAdding(false);
      setForm(EMPTY);
      setView('list');
    }
  };

  const simulateSell = (b: CaveBottle) => {
    const cost = b.purchasePrice * b.quantity;
    const value = b.estimatedCurrentValue * b.quantity;
    const gross = value - cost;
    const fees = Math.round(value * 0.10);
    const net = gross - fees;
    const netPct = Math.round((net / cost) * 100);
    const ytp = b.peakYear - new Date().getFullYear();
    const future = Math.round(b.estimatedCurrentValue * Math.pow(1.08, Math.max(0, Math.min(5, ytp))));
    setSellData({ b, cost, value, gross, fees, net, netPct, future, ytp });
    setView('sell');
  };

  const totalBottles = bottles.reduce((s, b) => s + b.quantity, 0);
  const totalValue = bottles.reduce((s, b) => s + b.estimatedCurrentValue * b.quantity, 0);
  const totalCost = bottles.reduce((s, b) => s + b.purchasePrice * b.quantity, 0);
  const totalGain = totalValue - totalCost;
  const gainPct = totalCost > 0 ? Math.round((totalGain / totalCost) * 100) : 0;
  const ready = bottles.filter(b => b.status === 'boire_maintenant' || b.status === 'apogee').reduce((s, b) => s + b.quantity, 0);

  const filtered = bottles
    .filter(b => filterStatus === 'all' || b.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === 'gain') return ((b.estimatedCurrentValue - b.purchasePrice) / b.purchasePrice) - ((a.estimatedCurrentValue - a.purchasePrice) / a.purchasePrice);
      if (sortBy === 'year') return b.year - a.year;
      if (sortBy === 'status') return ({ apogee: 0, boire_maintenant: 1, trop_tot: 2, trop_tard: 3 }[a.status]) - ({ apogee: 0, boire_maintenant: 1, trop_tot: 2, trop_tard: 3 }[b.status]);
      return a.name.localeCompare(b.name);
    });

  const scrollIntoViewOnFocus = (e: React.FocusEvent) => {
    (e.target as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div ref={wrapperRef} className="min-h-screen font-body" style={{ background: 'var(--bg-app)' }}>
      {/* HEADER */}
      <div className="px-5 flex items-center justify-between sticky top-0 z-20"
        style={{ background: theme === 'dark' ? 'rgba(13,6,8,0.98)' : 'rgba(245,240,232,0.98)', borderBottom: '1px solid var(--border)', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)', paddingBottom: '8px' }}>
        <div className="w-8" />
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Ma cave</span>
          {isUpdating && <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><RefreshCw size={12} color="#D4AF37" /></motion.div>}
        </div>
        <div className="flex items-center gap-2">
          {alerts.length > 0 && (
            <button onClick={() => setShowAlerts(true)} className="relative bg-transparent border-none cursor-pointer p-1">
              <Bell size={18} color="#D4AF37" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">{alerts.length}</span>
            </button>
          )}
          {(view === 'overview' || view === 'list') && (
            <>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/scan', { state: { fromCave: true } })} className="w-8 h-8 rounded-full flex items-center justify-center border border-burgundy-dark/40 bg-cream cursor-pointer" title="Scanner">
                <Camera size={15} color="#722F37" />
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => { if (!canAdd) setShowPaywall(true); else setView('add'); }}
                className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #722F37, #8B4049)', boxShadow: '0 4px 12px rgba(114,47,55,0.3)' }}>
                <Plus size={15} color="white" />
              </motion.button>
            </>
          )}
        </div>
      </div>

      {/* MODAL ALERTES — && uniquement (pas AnimatePresence : évite overlay fixed invisible qui bloque la BottomNav) */}
      {showAlerts && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cave-alerts-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 90px)',
            paddingLeft: '16px',
            paddingRight: '16px',
            paddingTop: '16px',
          }}
          className="bg-black/60 flex items-end justify-center"
          onClick={() => setShowAlerts(false)}
        >
          <div
            className="rounded-3xl w-full max-w-lg p-6 space-y-3"
            style={{ background: 'var(--bg-card)' }}
            onClick={e => e.stopPropagation()}
          >
              <div className="flex items-center justify-between mb-2">
                <h3 id="cave-alerts-title" className="font-display text-lg font-bold text-black-wine flex items-center gap-2"><Bell size={18} color="#D4AF37" /> Alertes prix</h3>
                <button type="button" onClick={() => setShowAlerts(false)} className="bg-transparent border-none cursor-pointer"><X size={20} color="var(--text-secondary)" /></button>
              </div>
              {alerts.map(b => {
                const gp = Math.round(((b.estimatedCurrentValue - b.purchasePrice) / b.purchasePrice) * 100);
                const up = b.priceVariation24h >= 0;
                return (
                  <div key={b.id} className={`rounded-2xl p-4 border ${up ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-sm text-black-wine" style={{ wordBreak: 'break-word', whiteSpace: 'normal', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{b.name} {b.year}</p>
                        <p className="text-xs text-gray-dark mt-0.5">{up ? '📈' : '📉'} {b.priceVariation24h > 0 ? '+' : ''}{b.priceVariation24h.toFixed(1)}% · Stock : {formatPrice(b.estimatedCurrentValue * b.quantity)}</p>
                        <p className="text-xs font-bold mt-1" style={{ color: up ? '#2E7D32' : '#C62828' }}>{gp >= 0 ? '+' : ''}{gp}% depuis l'achat</p>
                      </div>
                      <button type="button" onClick={() => { setShowAlerts(false); simulateSell(b); }} className="flex-shrink-0 bg-burgundy-dark text-white text-xs px-3 py-1.5 rounded-full border-none cursor-pointer font-semibold">
                        Simuler vente
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-5 py-5">
        {!user && (
          <div className="rounded-2xl border border-dashed border-gray-light p-8 text-center mb-6" style={{ background: 'var(--bg-card)' }}>
            <span className="text-5xl block mb-3">🔐</span>
            <p className="font-display text-lg font-bold text-black-wine mb-2">Connectez-vous</p>
            <p className="text-gray-dark text-sm mb-4">Connectez-vous pour gérer votre cave et suivre la valeur de vos vins</p>
            <a href="/auth" className="inline-block bg-burgundy-dark text-white px-6 py-3 rounded-full font-semibold text-sm">Se connecter</a>
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ══ OVERVIEW ══ */}
          {view === 'overview' && user && (
            <motion.div key="ov" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="bg-gradient-to-br from-black-wine to-burgundy-dark rounded-3xl p-5 text-white overflow-hidden relative">
                <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
                <div className="flex items-start justify-between mb-1">
                  <p className="text-white/50 text-xs uppercase tracking-widest">Valeur totale</p>
                  <button onClick={() => updatePrices(bottles)} disabled={isUpdating} className="bg-white/10 rounded-full px-2.5 py-1 border-none cursor-pointer flex items-center gap-1.5 hover:bg-white/20 transition-colors">
                    <RefreshCw size={10} color="rgba(255,255,255,0.7)" /><span className="text-white/60 text-xs">Actualiser</span>
                  </button>
                </div>
                <p className="font-display text-4xl font-bold mt-1 mb-1">{formatPrice(totalValue)}</p>
                <div className="flex items-center gap-2 mb-5">
                  <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${gainPct >= 0 ? 'bg-green-900/40 text-green-300' : 'bg-red-900/40 text-red-300'}`}>
                    {gainPct >= 0 ? '▲ +' : '▼ '}{gainPct}% ({gainPct >= 0 ? '+' : ''}{formatPrice(Math.abs(totalGain))})
                  </span>
                  <span className="text-white/30 text-xs">coût : {formatPrice(totalCost)}</span>
                </div>
                <div className="bg-white/5 rounded-2xl p-3 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white/50 text-xs">Évolution 12 mois</p>
                    <div className="flex items-center gap-3 text-xs text-white/30"><span>Valeur</span><span>Coût</span></div>
                  </div>
                  <MiniChart history={history} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[{ v: totalBottles, l: 'Bouteilles' }, { v: ready, l: 'Prêtes' }, { v: alerts.length, l: 'Alertes' }].map(s => (
                    <div key={s.l} className="bg-white/10 rounded-xl p-2.5 text-center">
                      <p className="font-display text-xl font-bold">{s.v}</p>
                      <p className="text-white/50 text-xs" style={{ textAlign: 'center' }}>{s.l}</p>
                    </div>
                  ))}
                </div>
                {lastUpdate && <p className="text-white/25 text-xs mt-3 text-center">Mis à jour : {new Date(lastUpdate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>}
              </div>

              {bottles.length > 0 && (
                <div className="rounded-2xl border border-gray-light/30 shadow-sm p-5" style={{ background: 'var(--bg-card)' }}>
                  <p className="font-display text-sm font-bold text-black-wine mb-3">🏆 Meilleures performances</p>
                  <div className="space-y-2">
                    {[...bottles].sort((a, b) => ((b.estimatedCurrentValue - b.purchasePrice) / b.purchasePrice) - ((a.estimatedCurrentValue - a.purchasePrice) / a.purchasePrice)).slice(0, 3).map(b => {
                      const pct = Math.round(((b.estimatedCurrentValue - b.purchasePrice) / b.purchasePrice) * 100);
                      return (
                        <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-light/20 last:border-0 cursor-pointer" onClick={() => { setSelected(b); setView('detail'); }}>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-black-wine truncate">{b.name} {b.year}</p>
                            <p className="text-xs text-gray-dark">{b.quantity} bt · {formatPrice(b.estimatedCurrentValue)}/bt</p>
                          </div>
                          <div className="text-right ml-3">
                            <p className={`text-sm font-bold ${pct >= 0 ? 'text-green-700' : 'text-red-700'}`}>{pct >= 0 ? '+' : ''}{pct}%</p>
                            <p className="text-xs text-gray-dark">{formatPrice((b.estimatedCurrentValue - b.purchasePrice) * b.quantity)} gain</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {bottles.length > 0 && (
                <div className="rounded-2xl border border-gray-light/30 shadow-sm p-5" style={{ background: 'var(--bg-card)' }}>
                  <p className="font-display text-sm font-bold text-black-wine mb-3">Composition</p>
                  {['Rouge', 'Blanc', 'Rosé', 'Champagne', 'Blanc liquoreux'].map(type => {
                    const count = bottles.filter(b => b.type === type).reduce((s, b) => s + b.quantity, 0);
                    if (!count) return null;
                    const pct = Math.round((count / totalBottles) * 100);
                    const cols: Record<string, string> = { Rouge: '#722F37', Blanc: '#D4AF37', Rosé: '#E91E8C', Champagne: '#F5C518', 'Blanc liquoreux': '#8D6E63' };
                    const emj: Record<string, string> = { Rouge: '🍷', Blanc: '🥂', Rosé: '🌸', Champagne: '🍾', 'Blanc liquoreux': '🍯' };
                    return (
                      <div key={type} className="mb-3">
                        <div className="flex justify-between mb-1"><span className="text-sm font-medium text-black-wine">{emj[type]} {type}</span><span className="text-xs text-gray-dark">{count} bt · {pct}%</span></div>
                        <div className="w-full bg-gray-light/30 rounded-full h-2 overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full" style={{ backgroundColor: cols[type] }} /></div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="grid grid-cols-3" style={{ gap: '8px' }}>
                <button onClick={() => setView('list')} className="bg-white border-2 border-burgundy-dark/20 text-burgundy-dark rounded-2xl font-semibold cursor-pointer hover:bg-burgundy-dark/5 transition-colors flex flex-1 min-w-0 items-center justify-center" style={{ minHeight: '48px', fontSize: '13px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span>📦</span>
                    <span>Mes bouteilles</span>
                  </span>
                </button>
                <button onClick={() => navigate('/scan', { state: { fromCave: true } })} className="bg-white border-2 border-burgundy-dark/20 text-burgundy-dark rounded-2xl font-semibold cursor-pointer hover:bg-burgundy-dark/5 transition-colors flex flex-1 min-w-0 items-center justify-center" style={{ minHeight: '48px', fontSize: '13px', gap: '6px' }}>
                  <Camera size={14} /><span style={{ whiteSpace: 'nowrap' }}>Scanner</span>
                </button>
                <button onClick={() => { if (!canAdd) setShowPaywall(true); else setView('add'); }} className="bg-burgundy-dark text-white rounded-2xl font-semibold border-none cursor-pointer shadow-md hover:bg-burgundy-medium transition-colors flex flex-1 min-w-0 items-center justify-center" style={{ minHeight: '48px', fontSize: '13px', gap: '6px' }}>
                  <Plus size={14} /><span style={{ whiteSpace: 'nowrap' }}>Ajouter</span>
                </button>
              </div>

              {bottles.length === 0 && (
                <div className="rounded-2xl border border-dashed border-gray-light p-8 text-center" style={{ background: 'var(--bg-card)' }}>
                  <span className="text-5xl block mb-3">🍾</span>
                  <p className="font-display text-lg font-bold text-black-wine mb-2">Cave vide</p>
                  <p className="text-gray-dark text-sm mb-4">Ajoutez vos premières bouteilles pour suivre leur valeur</p>
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => navigate('/scan', { state: { fromCave: true } })} className="bg-white border-2 border-burgundy-dark/30 text-burgundy-dark px-6 py-3 rounded-full font-semibold text-sm cursor-pointer">📷 Scanner</button>
                    <button onClick={() => { if (!canAdd) setShowPaywall(true); else setView('add'); }} className="bg-burgundy-dark text-white px-6 py-3 rounded-full font-semibold text-sm border-none cursor-pointer">Ajouter une bouteille</button>
                  </div>
                </div>
              )}
              <div className="h-28" />
            </motion.div>
          )}

          {/* ══ LISTE ══ */}
          {view === 'list' && user && (
            <motion.div key="list" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-gray-light/30 p-4 text-center shadow-sm" style={{ background: 'var(--bg-card)' }}><p className="font-display text-2xl font-bold text-black-wine">{formatPrice(totalValue)}</p><p className="text-xs text-gray-dark">Valeur totale</p></div>
                <div className={`rounded-2xl border p-4 text-center shadow-sm ${gainPct >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}><p className={`font-display text-2xl font-bold ${gainPct >= 0 ? 'text-green-700' : 'text-red-700'}`}>{gainPct >= 0 ? '+' : ''}{gainPct}%</p><p className="text-xs text-gray-dark">Gain total</p></div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {[{ id: 'all', l: 'Tous' }, { id: 'apogee', l: '🏆 Apogée' }, { id: 'boire_maintenant', l: '✅ Prêts' }, { id: 'trop_tot', l: '⏳ Attente' }, { id: 'trop_tard', l: '⚠️ Passés' }].map(f => (
                  <button key={f.id} onClick={() => setFilterStatus(f.id)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border-none cursor-pointer transition-all ${filterStatus === f.id ? 'bg-burgundy-dark text-white' : 'bg-white border border-gray-light/50 text-gray-dark'}`}>{f.l}</button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <Filter size={12} color="var(--text-secondary)" />
                <span className="text-gray-dark">Tri :</span>
                {(['gain', 'status', 'year', 'name'] as const).map(s => (
                  <button key={s} onClick={() => setSortBy(s)} className={`px-2 py-1 rounded-lg font-medium border-none cursor-pointer ${sortBy === s ? 'bg-burgundy-dark text-white' : 'bg-white text-gray-dark border border-gray-light/40'}`}>
                    {s === 'gain' ? '% Gain' : s === 'status' ? 'Statut' : s === 'year' ? 'Année' : 'Nom'}
                  </button>
                ))}
              </div>

              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-gray-light/30 p-8 text-center" style={{ background: 'var(--bg-card)' }}>
                  <span className="text-4xl block mb-3">🍾</span>
                  <p className="font-semibold text-black-wine mb-3">Aucune bouteille</p>
                  <button onClick={() => { if (!canAdd) setShowPaywall(true); else setView('add'); }} className="bg-burgundy-dark text-white px-5 py-2.5 rounded-full text-sm font-semibold border-none cursor-pointer">Ajouter</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map(b => {
                    const gp = Math.round(((b.estimatedCurrentValue - b.purchasePrice) / b.purchasePrice) * 100);
                    const conf = sc(b.status);
                    const up = b.priceVariation24h >= 0;
                    return (
                      <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} onClick={() => { setSelected(b); setView('detail'); }} className="rounded-2xl border border-gray-light/30 shadow-sm p-4 cursor-pointer hover:shadow-md transition-all" style={{ background: 'var(--bg-card)' }}>
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${conf.bg}`}><span className="text-lg">{conf.emoji}</span></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-black-wine text-sm leading-tight truncate">{b.name} {b.year}</p>
                                <p className="text-xs text-gray-dark">{b.region} · {b.quantity} bt · acheté {b.purchasePrice}€/bt</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="font-display text-base font-bold text-black-wine">{b.estimatedCurrentValue}€</p>
                                <p className={`text-xs font-bold ${gp >= 0 ? 'text-green-700' : 'text-red-700'}`}>{gp >= 0 ? '+' : ''}{gp}%</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${conf.bg}`} style={{ color: conf.color }}>{conf.label}</span>
                              <span className={`text-xs font-medium ${up ? 'text-green-600' : 'text-red-600'}`}>{up ? '▲' : '▼'} {Math.abs(b.priceVariation24h).toFixed(1)}% auj.</span>
                              {b.alert && <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${b.alert === 'hausse' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{b.alert === 'hausse' ? '🔥 Hausse' : '⚠️ Baisse'}</span>}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
              <div className="h-28" />
            </motion.div>
          )}

          {/* ══ DÉTAIL ══ */}
          {view === 'detail' && user && selected && (() => {
            const conf = sc(selected.status);
            const gp = Math.round(((selected.estimatedCurrentValue - selected.purchasePrice) / selected.purchasePrice) * 100);
            const totalVal = selected.estimatedCurrentValue * selected.quantity;
            const totalCostB = selected.purchasePrice * selected.quantity;
            const gain = totalVal - totalCostB;
            const up = selected.priceVariation24h >= 0;
            return (
              <motion.div key="detail" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="rounded-3xl border border-gray-light/30 shadow-md overflow-hidden" style={{ background: 'var(--bg-card)' }}>
                  <div className={`px-5 py-3 border-b border-gray-light/20 flex items-center justify-between border ${conf.bg}`}>
                    <div className="flex items-center gap-2"><span className="text-lg">{conf.emoji}</span><span className="font-semibold text-sm" style={{ color: conf.color }}>{conf.label}</span></div>
                    {selected.alert && <span className={`text-xs font-bold px-2 py-1 rounded-full ${selected.alert === 'hausse' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{selected.alert === 'hausse' ? '🔥 En hausse' : '⚠️ En baisse'}</span>}
                  </div>
                  <div className="p-5">
                    <h2 className="font-display text-xl font-bold text-black-wine mb-0.5">{selected.name}</h2>
                    <p className="text-gray-dark text-sm mb-4">{selected.year} · {selected.appellation || selected.region} · {selected.type}</p>
                    {selected.grapes && <p className="text-xs text-gray-dark mb-4">🍇 {selected.grapes}</p>}

                    {/* Prix temps réel */}
                    <div className="bg-gradient-to-r from-burgundy-dark/5 to-gold/5 rounded-2xl p-4 mb-4 border border-burgundy-dark/10">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-bold text-gray-dark uppercase tracking-wide">Prix actuel estimé</p>
                        <span className={`text-xs font-bold ${up ? 'text-green-600' : 'text-red-600'}`}>{up ? '▲' : '▼'} {Math.abs(selected.priceVariation24h).toFixed(1)}% auj.</span>
                      </div>
                      <div className="flex items-baseline gap-3">
                        <p className="font-display text-3xl font-bold text-burgundy-dark">{selected.estimatedCurrentValue}€</p>
                        <p className="text-gray-dark text-sm">/ bouteille</p>
                        <p className={`text-sm font-bold ml-auto ${gp >= 0 ? 'text-green-700' : 'text-red-700'}`}>{gp >= 0 ? '+' : ''}{gp}%</p>
                      </div>
                      <p className="text-xs text-gray-dark mt-1">Acheté {selected.purchasePrice}€ · {gain >= 0 ? '+' : ''}{formatPrice(gain)} gain total stock</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-cream rounded-xl p-3"><p className="text-xs text-gray-dark mb-1">Valeur stock</p><p className="font-display text-lg font-bold text-black-wine">{formatPrice(totalVal)}</p><p className="text-xs text-gray-dark">{selected.quantity} bouteille{selected.quantity > 1 ? 's' : ''}</p></div>
                      <div className="bg-cream rounded-xl p-3"><p className="text-xs text-gray-dark mb-1">Coût achat</p><p className="font-display text-lg font-bold text-black-wine">{formatPrice(totalCostB)}</p><p className={`text-xs font-semibold ${gain >= 0 ? 'text-green-700' : 'text-red-700'}`}>{gain >= 0 ? '+' : ''}{formatPrice(gain)}</p></div>
                    </div>

                    {/* Fenêtre dégustation */}
                    <div className="bg-cream rounded-xl p-3 mb-4">
                      <p className="text-xs text-gray-dark mb-2">📅 Fenêtre de dégustation</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-black-wine">{selected.drinkFrom}</span>
                        <div className="flex-1 bg-gray-light/40 rounded-full h-2 relative overflow-hidden">
                          <div className="absolute inset-y-0 bg-burgundy-dark/20 rounded-full" style={{ left: '0%', width: '100%' }} />
                          <div className="absolute inset-y-0 bg-gold rounded-full" style={{ left: `${Math.max(0, Math.min(80, ((selected.peakYear - selected.drinkFrom) / Math.max(1, selected.drinkUntil - selected.drinkFrom)) * 100 - 15))}%`, width: '30%' }} />
                        </div>
                        <span className="text-xs font-semibold text-black-wine">{selected.drinkUntil}</span>
                      </div>
                      <p className="text-xs font-semibold mt-1" style={{ color: '#B8860B' }}>🏆 Apogée estimée : {selected.peakYear}</p>
                    </div>

                    {/* Quantité */}
                    <div className="flex items-center justify-between bg-cream rounded-xl p-3 mb-4">
                      <p className="text-sm font-semibold text-black-wine">Quantité en cave</p>
                      <div className="flex items-center gap-3">
                        <button onClick={() => {
                          const newQty = Math.max(0, selected.quantity - 1);
                          persistQuantity(selected, newQty);
                          if (newQty === 0) setView('list');
                        }} className="w-8 h-8 rounded-full bg-white border border-gray-light flex items-center justify-center cursor-pointer font-bold text-burgundy-dark hover:bg-burgundy-dark hover:text-white transition-colors">−</button>
                        <span className="font-display text-xl font-bold text-black-wine w-8 text-center">{selected.quantity}</span>
                        <button onClick={() => persistQuantity(selected, selected.quantity + 1)} className="w-8 h-8 rounded-full bg-white border border-gray-light flex items-center justify-center cursor-pointer font-bold text-burgundy-dark hover:bg-burgundy-dark hover:text-white transition-colors">+</button>
                      </div>
                    </div>

                    {selected.location && <p className="text-xs text-gray-dark mb-3">📍 {selected.location}</p>}

                    {selected.notes && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
                        <p className="text-xs font-bold text-yellow-800 mb-1">💡 Conseil de garde</p>
                        <p className="text-xs text-gray-dark leading-relaxed">{selected.notes}</p>
                      </div>
                    )}

                    {/* Historique prix */}
                    {selected.priceHistory?.length > 1 && (
                      <div className="bg-cream rounded-xl p-3 mb-4">
                        <p className="text-xs font-bold text-gray-dark uppercase tracking-wide mb-2">Historique des prix</p>
                        <div className="space-y-1.5">
                          {selected.priceHistory.slice(-5).map((ph, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <span className="text-gray-dark">{new Date(ph.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                              {ph.event && <span className="text-gray-dark/60 truncate mx-2 flex-1 text-center">{ph.event}</span>}
                              <span className="font-semibold text-black-wine">{ph.price}€</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <button onClick={() => simulateSell(selected)} className="w-full py-4 bg-gold text-black-wine rounded-2xl font-bold text-base border-none cursor-pointer hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md">
                  <DollarSign size={20} /> Simuler la vente aujourd'hui
                </button>

                <div className="flex gap-3">
                  <button onClick={() => { persistDelete(selected); setView('list'); }} className="flex-1 py-3.5 border-2 border-red-200 text-red-600 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 bg-transparent cursor-pointer hover:bg-red-50 transition-colors">
                    <Trash2 size={16} /> Supprimer
                  </button>
                  <button onClick={() => setView('list')} className="flex-1 py-3.5 bg-burgundy-dark text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 border-none cursor-pointer hover:bg-burgundy-medium transition-colors">
                    <ArrowLeft size={16} /> Retour
                  </button>
                </div>
                <div className="h-28" />
              </motion.div>
            );
          })()}

          {/* ══ SIMULATION VENTE ══ */}
          {view === 'sell' && user && sellData && (() => {
            const yearsHeld = new Date().getFullYear() - (sellData.b.year || new Date().getFullYear());
            const { ytp, net, cost, future } = sellData;
            const gainPct = Math.round((net / cost) * 100);
            const futureValueTotal = future * sellData.b.quantity;
            const futureFees = Math.round(futureValueTotal * 0.10);
            const netAtPeak = futureValueTotal - cost - futureFees;
            const pctAtPeak = Math.round((netAtPeak / cost) * 100);
            const peakNetPctSingle = Math.round((future - sellData.b.purchasePrice) / sellData.b.purchasePrice * 100);

            const scenarioA = gainPct < 10 && net >= 0;
            const scenarioB = gainPct >= 10 && ytp > 2;
            const scenarioC = gainPct >= 10 && ytp <= 2;
            const scenarioD = net < 0;

            return (
              <motion.div key="sell" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="text-center">
                  <h2 className="font-display text-2xl font-bold text-black-wine">💰 Simulation de vente</h2>
                  <p className="text-gray-dark text-sm">{sellData.b.name} {sellData.b.year} · {sellData.b.quantity} bouteille{sellData.b.quantity > 1 ? 's' : ''}</p>
                </div>

                <div className={`rounded-3xl p-6 border-2 text-center ${sellData.net >= 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                  <p className="text-sm text-gray-dark mb-1">Gain net si vous vendez aujourd'hui</p>
                  <p className={`font-display text-5xl font-bold mb-1 ${sellData.net >= 0 ? 'text-green-700' : 'text-red-700'}`}>{sellData.net >= 0 ? '+' : ''}{formatPrice(sellData.net)}</p>
                  <p className={`text-lg font-bold ${sellData.net >= 0 ? 'text-green-700' : 'text-red-700'}`}>{gainPct >= 0 ? '+' : ''}{gainPct}% de rendement net</p>
                </div>

                {!scenarioD && (
                  <div className="rounded-2xl border border-gray-light/30 shadow-sm p-5 space-y-3" style={{ background: 'var(--bg-card)' }}>
                    <p className="font-semibold text-black-wine text-sm">Détail du calcul</p>
                    {[
                      { l: `Prix de vente (${sellData.b.quantity} × ${sellData.b.estimatedCurrentValue}€)`, v: formatPrice(sellData.value), pos: true },
                      { l: `Prix d'achat (${sellData.b.quantity} × ${sellData.b.purchasePrice}€)`, v: `−${formatPrice(sellData.cost)}`, pos: false },
                      { l: 'Frais de vente estimés (10%)', v: `−${formatPrice(sellData.fees)}`, pos: false },
                      { l: 'Gain net', v: `${sellData.net >= 0 ? '+' : ''}${formatPrice(sellData.net)}`, pos: sellData.net >= 0, bold: true },
                    ].map((row, i) => (
                      <div key={i} className={`flex items-center justify-between py-2 ${i < 3 ? 'border-b border-gray-light/20' : ''}`}>
                        <p className={`text-sm ${row.bold ? 'font-bold text-black-wine' : 'text-gray-dark'}`}>{row.l}</p>
                        <p className={`text-sm font-bold ${row.bold ? (row.pos ? 'text-green-700' : 'text-red-700') : 'text-black-wine'}`}>{row.v}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* SCÉNARIO A — Gain trop faible */}
                {scenarioA && (
                  <div className="rounded-2xl p-4 border bg-amber-50 border-amber-200 space-y-3">
                    <h3 className="font-display text-lg font-bold text-black-wine">⏳ Trop tôt pour vendre</h3>
                    <p className="text-sm text-gray-dark leading-relaxed">
                      Avec seulement +{gainPct}% de plus-value, les frais de vente (10%) effacent votre gain. Ce vin mérite plus de temps en cave.
                    </p>
                    <div ref={projectionRef} className="rounded-xl p-3 bg-white/80 border border-amber-200">
                      <p className="text-sm text-black-wine">À son apogée en {sellData.b.peakYear}, valeur estimée : {sellData.future}€/bt soit +{peakNetPctSingle}% de rendement net.</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => projectionRef.current?.scrollIntoView({ behavior: 'smooth' })} className="flex-1 py-3.5 bg-burgundy-dark text-white rounded-2xl font-semibold text-sm border-none cursor-pointer">
                        Voir le potentiel à l&apos;apogée
                      </button>
                      <button onClick={() => setView('detail')} className="flex-1 py-3.5 border-2 border-gray-light text-gray-dark rounded-2xl font-semibold text-sm bg-transparent cursor-pointer">
                        Vendre quand même
                      </button>
                    </div>
                  </div>
                )}

                {/* SCÉNARIO B — Bonne plus-value mais apogée pas encore atteinte */}
                {scenarioB && (
                  <div className="space-y-4">
                    <div className="rounded-2xl p-4 border bg-blue-50 border-blue-200">
                      <h3 className="font-display text-lg font-bold text-black-wine">📈 Bonne performance — mais pas encore au sommet</h3>
                      <p className="text-sm text-gray-dark leading-relaxed mt-2">
                        Vous êtes en plus-value de +{gainPct}% ({formatPrice(net)} net après frais). Mais ce vin n&apos;a pas encore atteint son apogée ({sellData.b.peakYear}).
                      </p>
                      <p className="text-sm text-gray-dark mt-2">
                        En attendant {ytp} ans de plus, valeur estimée : {sellData.future}€/bt — soit {Math.round((futureValueTotal - cost) / cost * 100)}% de rendement total.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl p-4 border-2 border-gray-light bg-white text-center">
                        <p className="text-xs font-bold text-gray-dark mb-1">Vendre maintenant</p>
                        <p className="font-display text-xl font-bold text-burgundy-dark">{formatPrice(net)}</p>
                        <p className="text-xs text-green-700 font-semibold">+{gainPct}%</p>
                      </div>
                      <div className="rounded-2xl p-4 border-2 border-gold bg-gold/10 text-center">
                        <p className="text-xs font-bold text-gray-dark mb-1">Attendre l&apos;apogée</p>
                        <p className="font-display text-xl font-bold text-burgundy-dark">{formatPrice(netAtPeak)}</p>
                        <p className="text-xs text-green-700 font-semibold">+{pctAtPeak}%</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setView('detail')} className="flex-1 py-4 border-2 border-burgundy-dark/30 text-burgundy-dark rounded-2xl font-semibold text-sm bg-transparent cursor-pointer">
                        Vendre maintenant
                      </button>
                      <button onClick={() => setView('detail')} className="flex-1 py-4 bg-burgundy-dark text-white rounded-2xl font-semibold text-sm border-none cursor-pointer">
                        Garder en cave
                      </button>
                    </div>
                  </div>
                )}

                {/* SCÉNARIO C — Apogée atteinte, bonne plus-value */}
                {scenarioC && (
                  <div className="space-y-4">
                    <div className="rounded-2xl p-4 border bg-green-50 border-green-200">
                      <h3 className="font-display text-lg font-bold text-black-wine">🏆 C&apos;est le moment idéal</h3>
                      <p className="text-sm text-gray-dark leading-relaxed mt-2">
                        Ce vin est à son apogée et vous êtes en plus-value de +{gainPct}%. Le timing est parfait pour vendre.
                      </p>
                    </div>
                    <button onClick={() => setView('detail')} className="w-full py-4 bg-burgundy-dark text-white rounded-2xl font-bold text-base border-none cursor-pointer">
                      Vendre maintenant
                    </button>
                  </div>
                )}

                {/* SCÉNARIO D — Moins-value */}
                {scenarioD && (
                  <div className="rounded-2xl p-4 border bg-red-50 border-red-200">
                    <h3 className="font-display text-lg font-bold text-black-wine">⚠️ Vous seriez en perte</h3>
                    <p className="text-sm text-gray-dark leading-relaxed mt-2">
                      Vendre maintenant vous ferait perdre {formatPrice(Math.abs(net))}€ après frais. Attendez minimum {ytp > 0 ? ytp + ' ans' : 'que le marché se redresse'}.
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setView('detail')} className="flex-1 py-4 border-2 border-burgundy-dark/20 text-burgundy-dark rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 bg-transparent cursor-pointer">
                    <ArrowLeft size={16} /> {scenarioD ? 'Retour à ma cave' : 'Retour'}
                  </button>
                  {!scenarioD && (
                    <button onClick={() => setView('overview')} className="flex-1 py-4 bg-burgundy-dark text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 border-none cursor-pointer">
                      <BarChart2 size={16} /> Vue cave
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-dark text-center leading-relaxed">⚠️ Simulation indicative. Ne constitue pas un conseil financier.</p>
                <div className="h-28" />
              </motion.div>
            );
          })()}

        </AnimatePresence>
      </div>

      {/* Modal ajout — démonté du DOM quand fermé (pas display:none) */}
      {view === 'add' && user && (
        <div
          className="flex flex-col pointer-events-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cave-add-title"
          style={{ position: 'fixed', inset: 0, zIndex: 50 }}
        >
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setView('overview')}
            onTouchStart={(e) => e.stopPropagation()}
            aria-hidden
          />
          <div
            className="relative z-10 mt-auto flex max-h-[92vh] flex-col rounded-t-3xl shadow-2xl overflow-hidden"
            style={{ background: 'var(--bg-app)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-light/30 flex-shrink-0 gap-3">
              <h2 id="cave-add-title" className="font-display text-lg font-bold text-black-wine flex-1 min-w-0">Ajouter une bouteille</h2>
              <button
                type="button"
                onClick={() => setView('overview')}
                className="p-2 rounded-full hover:bg-gray-light/30 border-none bg-transparent cursor-pointer flex-shrink-0"
                aria-label="Fermer"
              >
                <X size={22} color="var(--text-secondary)" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <p className="text-gray-dark text-sm">L&apos;IA évalue automatiquement la valeur actuelle et les conseils de garde.</p>
              <div className="rounded-2xl border border-gray-light/30 shadow-sm p-5 space-y-4" style={{ background: 'var(--bg-card)' }}>
                {[
                  { label: 'Nom du vin *', key: 'name', type: 'text', placeholder: 'Ex : Château Margaux, Gevrey-Chambertin...' },
                  { label: 'Millésime *', key: 'year', type: 'number', placeholder: '2019' },
                  { label: 'Région', key: 'region', type: 'text', placeholder: 'Ex : Bordeaux, Bourgogne...' },
                  { label: 'Appellation', key: 'appellation', type: 'text', placeholder: 'Ex : AOC Pauillac...' },
                  { label: 'Cépages', key: 'grapes', type: 'text', placeholder: 'Ex : Cabernet Sauvignon, Merlot...' },
                  { label: "Prix d'achat (€) *", key: 'purchasePrice', type: 'text', inputMode: 'decimal' as const, placeholder: '25' },
                  { label: 'Quantité', key: 'quantity', type: 'text', inputMode: 'numeric' as const, placeholder: '1' },
                  { label: 'Emplacement', key: 'location', type: 'text', placeholder: 'Ex : Étagère A, rangée 2' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-bold text-gray-dark uppercase tracking-wide mb-1.5 block">{f.label}</label>
                    <input
                      type={f.key === 'purchasePrice' || f.key === 'quantity' ? 'text' : f.type}
                      inputMode={f.key === 'purchasePrice' ? 'decimal' : f.key === 'quantity' ? 'numeric' : undefined}
                      placeholder={f.placeholder}
                      value={String(form[f.key as keyof typeof form] ?? '')}
                      onFocus={scrollIntoViewOnFocus}
                      onChange={e => {
                        if (f.key === 'purchasePrice') {
                          const val = e.target.value.replace(',', '.');
                          setForm(p => ({ ...p, purchasePrice: val }));
                        } else if (f.key === 'quantity') {
                          setForm(p => ({ ...p, quantity: e.target.value }));
                        } else {
                          setForm(p => ({ ...p, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }));
                        }
                      }}
                      className="w-full px-4 py-3 bg-cream border border-gray-light rounded-xl text-sm text-black-wine placeholder-gray-light focus:border-burgundy-dark focus:outline-none" />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-bold text-gray-dark uppercase tracking-wide mb-1.5 block">Type</label>
                  <div className="flex gap-2 flex-wrap">
                    {['Rouge', 'Blanc', 'Rosé', 'Champagne', 'Blanc liquoreux'].map(t => (
                      <button key={t} type="button" onClick={() => setForm(p => ({ ...p, type: t }))} className={`px-3 py-2 rounded-xl text-xs font-bold border-none cursor-pointer ${form.type === t ? 'bg-burgundy-dark text-white' : 'bg-cream text-gray-dark border border-gray-light'}`}>{t}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-dark uppercase tracking-wide mb-1.5 block">Notes personnelles</label>
                  <textarea placeholder="Vos notes..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} onFocus={scrollIntoViewOnFocus} rows={2} className="w-full px-4 py-3 bg-cream border border-gray-light rounded-xl text-sm text-black-wine placeholder-gray-light focus:border-burgundy-dark focus:outline-none resize-none" />
                </div>
              </div>
              <button type="button" onClick={addBottle} disabled={!form.name || !form.purchasePrice || isAdding} className="w-full py-5 bg-burgundy-dark text-white rounded-2xl font-bold text-base border-none cursor-pointer disabled:opacity-40 hover:bg-burgundy-medium active:scale-95 transition-all flex items-center justify-center gap-3 shadow-lg">
                {isAdding ? (<><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 rounded-full border-2 border-white border-t-transparent" />L&apos;IA évalue ce vin...</>) : (<><Plus size={20} />Ajouter à ma cave</>)}
              </button>
              <p className="text-xs text-gray-dark text-center pb-4">💡 L&apos;IA calcule automatiquement la valeur actuelle et la fenêtre de garde</p>
            </div>
          </div>
        </div>
      )}

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        feature="Cave illimitée"
        description="Vous avez atteint la limite de 5 bouteilles en version gratuite. Passez à Pro pour gérer une cave illimitée avec prix dynamiques."
      />
    </div>
  );
}
