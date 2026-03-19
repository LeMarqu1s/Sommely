import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type ExitReason =
  | 'price'
  | 'usage'
  | 'features'
  | 'alternative'
  | 'technical'
  | 'other';

const REASONS: { id: ExitReason; label: string }[] = [
  { id: 'price', label: 'Trop cher' },
  { id: 'usage', label: "Je ne l'utilise pas assez" },
  { id: 'features', label: 'Fonctionnalités manquantes' },
  { id: 'alternative', label: "J'ai trouvé une meilleure alternative" },
  { id: 'technical', label: 'Problème technique' },
  { id: 'other', label: 'Autre raison' },
];

export interface StepExitSurveyProps {
  userId: string;
  selectedReason: ExitReason | null;
  onSelectReason: (r: ExitReason) => void;
  feedbackText: string;
  onFeedbackTextChange: (t: string) => void;
  onContinue: () => void;
  onBack: () => void;
  onContactSupport: () => void;
  onSubmitFeedback: (reason: ExitReason, text: string) => Promise<void>;
  isSubmittingFeedback?: boolean;
}

export function StepExitSurvey({
  userId,
  selectedReason,
  onSelectReason,
  feedbackText,
  onFeedbackTextChange,
  onContinue,
  onBack,
  onContactSupport,
  onSubmitFeedback,
  isSubmittingFeedback = false,
}: StepExitSurveyProps) {
  const [feedbackSent, setFeedbackSent] = useState(false);

  const handleSendFeedback = async () => {
    if (!selectedReason || !feedbackText.trim()) return;
    await onSubmitFeedback(selectedReason, feedbackText.trim());
    setFeedbackSent(true);
  };

  const needsTextInput =
    selectedReason === 'features' || selectedReason === 'alternative' || selectedReason === 'other';
  const isTechnical = selectedReason === 'technical';

  const needsSendToContinue = selectedReason === 'features' || selectedReason === 'alternative';
  const canContinue = selectedReason !== null && (!needsSendToContinue || feedbackSent);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: 'spring', damping: 25 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="font-display text-2xl font-bold text-black-wine">
          Aidez-nous à nous améliorer
        </h2>
        <p className="text-gray-dark text-sm mt-1">Pourquoi souhaitez-vous partir ?</p>
      </div>

      <div className="space-y-2">
        {REASONS.map((r) => (
          <button
            key={r.id}
            onClick={() => onSelectReason(r.id)}
            className={`w-full py-4 px-4 rounded-xl text-left font-medium text-sm transition-all border-2 min-h-[44px] ${
              selectedReason === r.id
                ? 'border-burgundy-dark bg-burgundy-dark/5 text-black-wine'
                : 'border-gray-light bg-cream/50 text-gray-dark hover:border-burgundy-dark/50'
            }`}
          >
            {selectedReason === r.id ? '✓ ' : '○ '}{r.label}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {selectedReason === 'price' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-cream rounded-xl p-3 text-sm text-gray-dark"
          >
            💡 Saviez-vous que le plan annuel revient à seulement 4€/mois ? Retournez à
            l&apos;étape précédente pour mettre en pause et économiser.
          </motion.div>
        )}
        {selectedReason === 'usage' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-cream rounded-xl p-3 text-sm text-gray-dark"
          >
            ⏸️ La pause 30 jours est faite pour vous — gardez vos données sans payer, revenez quand
            vous voulez.
          </motion.div>
        )}
        {selectedReason === 'features' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-cream rounded-xl p-4 space-y-3"
          >
            <p className="text-sm text-gray-dark">
              Quelle fonctionnalité vous manque ? Notre équipe lit chaque message.
            </p>
            <textarea
              value={feedbackText}
              onChange={(e) => onFeedbackTextChange(e.target.value)}
              placeholder="Décrivez votre idée..."
              className="w-full px-4 py-3 rounded-xl border border-gray-light text-sm resize-none min-h-[80px]"
              maxLength={500}
            />
            <button
              onClick={handleSendFeedback}
              disabled={!feedbackText.trim() || isSubmittingFeedback}
              className="w-full py-3 bg-burgundy-dark text-white rounded-xl font-semibold text-sm border-none cursor-pointer hover:bg-burgundy-medium disabled:opacity-60 min-h-[44px]"
            >
              {feedbackSent ? 'Merci !' : isSubmittingFeedback ? 'Envoi…' : 'Envoyer mon feedback'}
            </button>
          </motion.div>
        )}
        {selectedReason === 'alternative' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-cream rounded-xl p-4 space-y-3"
          >
            <p className="text-sm text-gray-dark">
              Quelle app ? Votre retour guide notre roadmap.
            </p>
            <textarea
              value={feedbackText}
              onChange={(e) => onFeedbackTextChange(e.target.value)}
              placeholder="Nom de l'app..."
              className="w-full px-4 py-3 rounded-xl border border-gray-light text-sm resize-none min-h-[60px]"
              maxLength={200}
            />
            <button
              onClick={handleSendFeedback}
              disabled={!feedbackText.trim() || isSubmittingFeedback}
              className="w-full py-3 bg-burgundy-dark text-white rounded-xl font-semibold text-sm border-none cursor-pointer hover:bg-burgundy-medium disabled:opacity-60 min-h-[44px]"
            >
              {feedbackSent ? 'Merci !' : isSubmittingFeedback ? 'Envoi…' : 'Envoyer mon feedback'}
            </button>
          </motion.div>
        )}
        {selectedReason === 'technical' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-cream rounded-xl p-4 space-y-3"
          >
            <div className="flex flex-col gap-2">
              <a
                href="mailto:support@sommely.shop"
                className="w-full py-4 bg-burgundy-dark text-white rounded-xl font-semibold text-sm text-center border-none cursor-pointer hover:bg-burgundy-medium min-h-[44px] flex items-center justify-center"
              >
                Contacter le support
              </a>
              <button
                onClick={onContinue}
                className="w-full py-3 text-gray-dark text-sm border-none bg-transparent cursor-pointer underline min-h-[44px]"
              >
                Continuer l&apos;annulation
              </button>
            </div>
          </motion.div>
        )}
        {selectedReason === 'other' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-cream rounded-xl p-4 space-y-3"
          >
            <textarea
              value={feedbackText}
              onChange={(e) => onFeedbackTextChange(e.target.value)}
              placeholder="Précisez si vous le souhaitez..."
              className="w-full px-4 py-3 rounded-xl border border-gray-light text-sm resize-none min-h-[80px]"
              maxLength={500}
            />
            <button
              onClick={handleSendFeedback}
              disabled={!feedbackText.trim() || isSubmittingFeedback}
              className="w-full py-3 bg-burgundy-dark text-white rounded-xl font-semibold text-sm border-none cursor-pointer hover:bg-burgundy-medium disabled:opacity-60 min-h-[44px]"
            >
              {feedbackSent ? 'Merci !' : isSubmittingFeedback ? 'Envoi…' : 'Envoyer mon feedback'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {!isTechnical && (
        <button
          onClick={canContinue ? onContinue : onBack}
          disabled={
            !canContinue ||
            (needsSendToContinue && !feedbackSent)
          }
          className="w-full py-4 bg-burgundy-dark text-white rounded-2xl font-semibold text-sm border-none cursor-pointer hover:bg-burgundy-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          Continuer
        </button>
      )}
    </motion.div>
  );
}
