import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, RotateCcw, Sparkles } from 'lucide-react';
import { canAccessFeature } from '../utils/subscription';
import { fetchOpenAI } from '../lib/openai';
import { useAuth } from '../context/AuthContext';
import { getCaveBottles } from '../lib/supabase';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

const QUICK_SUGGESTIONS = [
  { emoji: '🍽️', label: 'Accord pour ce soir', contextKey: 'Accord pour ce soir', placeholder: 'Quel plat préparez-vous ce soir ?' },
  { emoji: '🍾', label: 'Ma cave : quoi ouvrir ?', contextKey: 'Ma cave', placeholder: 'Quelle bouteille souhaitez-vous ouvrir ?' },
  { emoji: '🎁', label: 'Cadeau : quel budget ?', contextKey: 'Cadeau', placeholder: 'Quel est votre budget et l\'occasion ?' },
  { emoji: '📋', label: 'Au resto : que commander ?', contextKey: 'Au resto', placeholder: 'Quel type de cuisine ou quelle carte ?' },
  { emoji: '📈', label: 'Investissement vin', contextKey: 'Investissement', placeholder: 'Quel budget souhaitez-vous investir ?' },
  { emoji: '🌍', label: 'Découverte : surprends-moi', contextKey: 'Découverte', placeholder: 'Quel style de vin aimez-vous en général ?' },
];

const DEFAULT_PLACEHOLDER = "Posez votre question à Antoine...";

function renderMessage(text: string) {
  // Convertit le markdown basique en JSX propre
  const lines = text.split('\n').filter(l => l.trim());
  return lines.map((line, i) => {
    // Supprime les ** et * 
    const clean = line
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/^#{1,3}\s+/, '')
      .replace(/^[-•]\s+/, '• ');
    
    // Lignes numérotées (1. 2. 3.)
    if (/^\d+\.\s/.test(clean)) {
      return <p key={i} className="mb-2 last:mb-0">{clean}</p>;
    }
    return <p key={i} className="mb-2 last:mb-0">{clean}</p>;
  });
}

export function Sommelier() {
  const navigate = useNavigate();
  const { subscriptionState, profile: authProfile, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [cave, setCave] = useState<any[]>([]);
  const [caveBottles, setCaveBottles] = useState<any[]>([]);
  const [activeContext, setActiveContext] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;
    getCaveBottles(user.id).then(({ data }) => {
      if (!mounted) return;
      if (data?.length) setCaveBottles(data);
    });
    return () => { mounted = false; };
  }, [user?.id]);

  useEffect(() => {
    if (!canAccessFeature(subscriptionState, 'antoine')) {
      navigate('/premium');
      return;
    }
  }, [navigate, subscriptionState]);

  useEffect(() => {
    const p = localStorage.getItem('sommely_profile');
    const c = localStorage.getItem('sommely_cave_v3');
    if (p) setProfile(JSON.parse(p));
    if (c) {
      try {
        setCave(JSON.parse(c));
      } catch {
        setCave([]);
      }
    }

    setMessages([
      {
        id: '0',
        role: 'assistant',
        content: "Bonjour ! 🍷 Je suis Antoine, votre sommelier personnel. Que vous cherchiez l'accord parfait pour ce soir, un conseil sur votre cave, ou simplement à découvrir un vin exceptionnel, je suis là. Par où commençons-nous ?",
        timestamp: new Date(),
      },
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const contextForPrompt = activeContext;

    setShowSuggestions(false);
    setInput('');
    setActiveContext(null);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const bottles = caveBottles.length > 0 ? caveBottles : cave;
      const caveContext = bottles.length > 0
        ? caveBottles.length > 0
          ? `\n\nCAVE DE L'UTILISATEUR (${caveBottles.length} bouteilles) :\n${caveBottles
              .slice(0, 10)
              .map((b: any) => `- ${b.name} ${b.vintage ?? b.year} · ${b.wine_type ?? ''} · ${b.region ?? ''} · acheté ${b.price_paid ?? b.purchasePrice}€ · valeur actuelle ${b.current_price ?? b.estimatedCurrentValue}€`)
              .join('\n')}${caveBottles.length > 10 ? '\n(+ autres bouteilles...)' : ''}`
          : `\n\nCAVE VIRTUELLE (${cave.length} références) :\n${cave
              .slice(0, 8)
              .map((b: any) => `- ${b.name} ${b.year} (${b.quantity}x) · Acheté ${b.purchasePrice}€ · Valeur actuelle ${b.estimatedCurrentValue}€ · Statut: ${b.status || 'ok'}`)
              .join('\n')}${cave.length > 8 ? '\n(+ autres bouteilles...)' : ''}\n\nValeur totale cave : ${cave
              .reduce((sum: number, b: any) => sum + b.estimatedCurrentValue * (b.quantity || 1), 0)
              .toFixed(0)}€`
        : "\n\nCAVE : L'utilisateur n'a pas encore de bouteilles dans sa cave.";

      const activeContextLine = contextForPrompt
        ? `\n\nCONTEXTE ACTIF : L'utilisateur veut parler de : ${contextForPrompt}. Adapte ta première réponse à ce contexte précis.`
        : '';

      const tasteProfile = (authProfile?.taste_profile as Record<string, unknown>) || profile || {};
      const safeJoin = (x: unknown) => (Array.isArray(x) ? (x as string[]).join(', ') : 'non spécifié');
      const userContext = (tasteProfile && (tasteProfile.budget || tasteProfile.experience || tasteProfile.expertise)) ?
        `\n\nPROFIL DE L'UTILISATEUR :\n- Budget habituel : ${tasteProfile.budget ?? 'non spécifié'}\n- Niveau : ${tasteProfile.experience ?? tasteProfile.expertise ?? 'non spécifié'}\n- Types préférés : ${safeJoin(tasteProfile.favoriteTypes ?? tasteProfile.types)}\n- Régions favorites : ${safeJoin(tasteProfile.regions)}` : '';

      const systemPrompt = `Tu es Antoine, sommelier expert de Sommely. Tu as 20 ans d'expérience dans les plus grands restaurants étoilés d'Europe. Tu parles comme un ami passionné — jamais condescendant, toujours précis et enthousiaste.

PERSONNALITÉ :
- Chaleureux, direct, passionné. Tu vouvoies l'utilisateur naturellement.
- Tu donnes des recommandations concrètes avec des exemples de vins réels et des prix réels
- Tu expliques POURQUOI un vin est bon, pas juste qu'il l'est
- Tu utilises des analogies sensorielles vivantes (ex: 'notes de cerise noire comme un matin de marché en Provence')

CONTEXTE UTILISATEUR :
- Tu connais le profil de goût de l'utilisateur (budget, style préféré, expérience)
- Tu connais sa cave virtuelle si elle existe
- Tu adaptes TOUJOURS tes conseils à son profil et son budget

RÈGLES STRICTES :
- Jamais de réponses génériques type 'ça dépend de vos goûts'
- Toujours donner UNE recommandation principale claire avec un prix réel
- Maximum 3-4 phrases par réponse — pas de pavés de texte
- Si l'utilisateur parle anglais, réponds en anglais. Français → français. Italien → italien.
- Termine parfois par une question engageante sur leur prochaine dégustation

EXPERTISE TECHNIQUE :
- Accords mets-vins : précis et originaux (ex: Sauternes avec Roquefort, Barolo avec truffe)
- Cave : conseils de garde, fenêtres de dégustation, apogée
- Restaurant : identifier les bonnes affaires sur une carte
- Investissement : vins qui prennent de la valeur (Bourgogne, Barolo, vins en primeur)

RÈGLE ABSOLUE 1 : Tu as TOUJOURS accès à la cave de l'utilisateur via le contexte ci-dessous. Ne jamais dire que tu n'as pas accès à la cave. Si la cave est vide, dire 'Votre cave est vide pour l'instant' et proposer d'ajouter des bouteilles.

RÈGLE ABSOLUE 2 : Ne jamais demander à l'utilisateur de te décrire sa cave — tu la connais déjà. Utilise directement les données du contexte CAVE ci-dessous pour répondre.

${caveContext}${userContext}${activeContextLine}

RÈGLE FORMAT : N'utilise JAMAIS de markdown (**gras**, *italique*, ##titres, listes avec tirets). Écris en texte naturel comme un vrai sommelier qui parle.`;

      const conversationHistory = messages
        .filter((m) => !m.isLoading)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetchOpenAI({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: systemPrompt }, ...conversationHistory, { role: 'user', content: messageText }],
        max_tokens: 600,
        temperature: 0.7,
      });

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "Désolé, je n'ai pas pu traiter votre demande.";

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetConversation = () => {
    setMessages([
      {
        id: '0',
        role: 'assistant',
        content: "Bonjour ! 🍷 Je suis Antoine, votre sommelier personnel. Que vous cherchiez l'accord parfait pour ce soir, un conseil sur votre cave, ou simplement à découvrir un vin exceptionnel, je suis là. Par où commençons-nous ?",
        timestamp: new Date(),
      },
    ]);
    setShowSuggestions(true);
    setInput('');
    setActiveContext(null);
  };

  const inputPlaceholder = activeContext
    ? (QUICK_SUGGESTIONS.find((s) => s.contextKey === activeContext)?.placeholder ?? DEFAULT_PLACEHOLDER)
    : DEFAULT_PLACEHOLDER;

  return (
    <div className="min-h-screen bg-cream font-body flex flex-col">
      <div className="bg-white border-b border-gray-light/30 px-5 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <button onClick={() => navigate(-1)} className="bg-transparent border-none cursor-pointer p-1">
          <ArrowLeft size={20} color="#722F37" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-burgundy-dark flex items-center justify-center">
            <span className="text-sm">🍷</span>
          </div>
          <div className="text-left">
            <p className="font-display text-sm font-bold text-burgundy-dark">Antoine</p>
            <p className="text-xs text-gray-dark flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-success" />
              Sommelier IA · En ligne
            </p>
          </div>
        </div>
        <button onClick={resetConversation} className="bg-transparent border-none cursor-pointer p-1">
          <RotateCcw size={18} color="#6B5D56" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user' ? 'bg-burgundy-dark text-white' : 'bg-white border border-gray-light/30 text-black-wine shadow-sm'
                }`}
              >
                <div className="text-sm leading-relaxed">{renderMessage(msg.content)}</div>
                <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-white/50' : 'text-gray-dark'}`}>
                  {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-white border border-gray-light/30 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-burgundy-dark"
                  />
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                    className="w-2 h-2 rounded-full bg-burgundy-dark"
                  />
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                    className="w-2 h-2 rounded-full bg-burgundy-dark"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {showSuggestions && messages.length === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 gap-2 mt-4"
          >
            {QUICK_SUGGESTIONS.map((s, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                onClick={() => setActiveContext(s.contextKey)}
                className="bg-white border border-gray-light/30 rounded-2xl p-3 text-left cursor-pointer hover:border-burgundy-dark/30 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{s.emoji}</span>
                  <p className="font-semibold text-xs text-black-wine">{s.label}</p>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t border-gray-light/30 px-5 py-4 sticky bottom-0">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-2 bg-cream rounded-2xl px-4 py-3">
            {input.trim() ? <Sparkles size={18} color="#D4AF37" /> : null}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              onFocus={(e) => (e.target as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' })}
              placeholder={inputPlaceholder}
              disabled={isLoading}
              className="flex-1 bg-transparent border-none outline-none text-sm text-black-wine placeholder-gray-dark disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="w-9 h-9 rounded-xl bg-burgundy-dark flex items-center justify-center border-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:bg-burgundy-medium transition-colors"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 rounded-full border-2 border-white border-t-transparent"
                />
              ) : (
                <Send size={16} color="white" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-dark text-center mt-2">🍷 Antoine connaît votre profil et votre cave</p>
        </div>
      </div>
    </div>
  );
}
