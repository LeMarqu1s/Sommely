import { motion } from 'framer-motion';

export interface StepAlternativesProps {
  discountAlreadyApplied: boolean;
  onPause: () => void;
  onDiscount: () => void;
  onContinue: () => void;
  isPausing?: boolean;
  isApplyingDiscount?: boolean;
  error?: string | null;
}

export function StepAlternatives({
  discountAlreadyApplied,
  onPause,
  onDiscount,
  onContinue,
  isPausing = false,
  isApplyingDiscount = false,
  error = null,
}: StepAlternativesProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: 'spring', damping: 25 }}
      className="space-y-6"
    >
      <h2 className="font-display text-2xl font-bold text-black-wine text-center">
        Avant de partir — deux options pour vous
      </h2>

      {/* Option A — Pause */}
      <div className="rounded-2xl p-4 border-2 border-gold bg-gold/5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⏸️</span>
          <div className="flex-1">
            <h3 className="font-semibold text-black-wine">Mettre en pause 30 jours</h3>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-gold/20 text-gold">
              ⭐ Recommandé
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-dark">
          Gardez toutes vos données. Sautez votre prochain paiement. Reprenez quand vous voulez.
        </p>
        <button
          onClick={onPause}
          disabled={isPausing || isApplyingDiscount}
          className="w-full py-4 bg-burgundy-dark text-white rounded-2xl font-semibold text-sm border-none cursor-pointer hover:bg-burgundy-medium transition-colors disabled:opacity-60 min-h-[44px]"
        >
          {isPausing ? 'En cours…' : 'Mettre en pause'}
        </button>
      </div>

      {/* Option B — Discount */}
      {discountAlreadyApplied ? (
        <div className="rounded-2xl p-4 bg-cream text-gray-dark text-sm text-center">
          Vous avez déjà bénéficié d&apos;une remise sur ce plan.
        </div>
      ) : (
        <div className="rounded-2xl p-4 border border-gray-light space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎁</span>
            <div className="flex-1">
              <h3 className="font-semibold text-black-wine">Rester à moitié prix</h3>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-burgundy-dark/10 text-burgundy-dark">
                Offre limitée
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-dark">
            50% de réduction pendant 3 mois. Annulable à tout moment après.
          </p>
          <button
            onClick={onDiscount}
            disabled={isPausing || isApplyingDiscount}
            className="w-full py-4 border-2 border-burgundy-dark text-burgundy-dark rounded-2xl font-semibold text-sm bg-transparent cursor-pointer hover:bg-burgundy-dark/5 transition-colors disabled:opacity-60 min-h-[44px]"
          >
            {isApplyingDiscount ? 'En cours…' : 'Obtenir -50%'}
          </button>
        </div>
      )}

      {error && (
        <p className="text-danger text-sm text-center">{error}</p>
      )}

      <button
        onClick={onContinue}
        className="w-full mt-3 text-gray-dark text-sm underline block text-center bg-transparent border-none cursor-pointer hover:text-burgundy-dark transition-colors min-h-[44px] flex items-center justify-center"
      >
        Aucune de ces options ne me convient →
      </button>
    </motion.div>
  );
}
