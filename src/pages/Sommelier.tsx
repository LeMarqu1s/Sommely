import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, RotateCcw, Sparkles } from 'lucide-react';
import { canAccessFeature } from '../utils/subscription';
import { fetchOpenAI } from '../lib/openai';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

const QUICK_SUGGESTIONS = [
  { emoji: '🍽️', label: 'Accord pour ce soir', prompt: 'Je cuisine un bœuf bourguignon ce soir, quel vin de ma cave devrais-je ouvrir ?' },
  { emoji: '🍾', label: 'Ma cave', prompt: 'Quelle bouteille de ma cave devrais-je ouvrir maintenant selon leur maturité ?' },
  { emoji: '🎁', label: 'Cadeau 40€', prompt: 'Je cherche un vin à offrir autour de 40€, que me conseilles-tu ?' },
  { emoji: '📋', label: 'Au resto', prompt: 'Comment choisir un bon vin au restaurant sans me faire avoir ?' },
  { emoji: '📈', label: 'Investissement', prompt: 'Quels sont les vins avec le meilleur potentiel d\'investissement actuellement ?' },
  { emoji: '🌍', label: 'Découverte', prompt: 'Je veux découvrir une nouvelle région viticole, que me recommandes-tu ?' },
];

export function Sommelier() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [cave, setCave] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canAccessFeature('antoine')) {
      navigate('/premium');
      return;
    }
  }, [navigate]);

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

    const firstName = p ? (JSON.parse(p) as { name?: string }).name?.split(' ')[0] || '' : '';
    setMessages([
      {
        id: '0',
        role: 'assistant',
        content: `Bonjour${firstName ? ` ${firstName}` : ''} ! 🍷 Je suis Antoine, votre sommelier personnel. Posez-moi n'importe quelle question sur le vin, les accords mets-vins, votre cave, ou demandez-moi conseil pour un achat. Je suis là pour vous guider !`,
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

    setShowSuggestions(false);
    setInput('');

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const caveContext =
        cave.length > 0
          ? `\n\nCAVE VIRTUELLE (${cave.length} références) :\n${cave
              .slice(0, 8)
              .map((b: any) => `- ${b.name} ${b.year} (${b.quantity}x) · Acheté ${b.purchasePrice}€ · Valeur actuelle ${b.estimatedCurrentValue}€ · Statut: ${b.status || 'ok'}`)
              .join('\n')}${cave.length > 8 ? '\n(+ autres bouteilles...)' : ''}\n\nValeur totale cave : ${cave
              .reduce((sum: number, b: any) => sum + b.estimatedCurrentValue * (b.quantity || 1), 0)
              .toFixed(0)}€`
          : '';

      const systemPrompt = `Tu es Antoine, sommelier expert chaleureux et passionné. Tu es précis, accessible et concret.

PROFIL UTILISATEUR :
- Prénom : ${profile?.name || 'Utilisateur'}
- Niveau : ${profile?.experience || 'non spécifié'}
- Types préférés : ${profile?.favoriteTypes?.join(', ') || 'non spécifié'}
- Membre depuis : ${profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('fr-FR') : 'récent'}
${caveContext}

RÈGLES :
1. Adapte ton langage au niveau de l'utilisateur (débutant = simple, expert = technique)
2. Si l'utilisateur mentionne un plat, propose 2-3 accords précis avec producteurs réels et prix indicatifs
3. Si l'utilisateur parle de sa cave, utilise les données ci-dessus pour personnaliser tes conseils
4. Cite des producteurs réels, des appellations précises, des prix de marché réalistes
5. Maximum 3-4 paragraphes par réponse, sois concis
6. Utilise les emojis avec parcimonie (1-2 max par message)
7. Termine parfois par une question pour approfondir si pertinent

Tu es un vrai sommelier qui connaît son métier et donne des conseils pratiques et actionnables.`;

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
    const firstName = profile?.name?.split(' ')[0] || '';
    setMessages([
      {
        id: '0',
        role: 'assistant',
        content: `Bonjour${firstName ? ` ${firstName}` : ''} ! 🍷 Je suis Antoine, votre sommelier personnel. Posez-moi n'importe quelle question sur le vin, les accords mets-vins, votre cave, ou demandez-moi conseil pour un achat. Je suis là pour vous guider !`,
        timestamp: new Date(),
      },
    ]);
    setShowSuggestions(true);
    setInput('');
  };

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
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
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
                onClick={() => sendMessage(s.prompt)}
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
              placeholder="Posez votre question à Antoine..."
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
