import { motion } from 'framer-motion';

export interface StepLossAversionProps {
  scansCount: number;
  caveBottlesCount: number;
  onRetain: () => void;
  onContinue: () => void;
}

export function StepLossAversion({
  scansCount,
  caveBottlesCount,
  onRetain,
  onContinue,
}: StepLossAversionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: 'spring', damping: 25 }}
      className="space-y-6"
    >
      <div className="text-center">
        <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-cream text-black-wine mb-3">
          🍷 Votre compte Sommely
        </span>
        <h2 className="font-display text-2xl font-bold text-black-wine">
          Ce que vous perdrez en partant
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-cream rounded-2xl p-4 text-center min-h-[44px] flex flex-col justify-center">
          <p className="font-display text-lg font-bold text-black-wine">{scansCount} bouteilles</p>
          <p className="text-xs text-gray-dark">analysées et sauvegardées</p>
        </div>
        <div className="bg-cream rounded-2xl p-4 text-center min-h-[44px] flex flex-col justify-center">
          <p className="font-display text-lg font-bold text-black-wine">{caveBottlesCount} bouteilles</p>
          <p className="text-xs text-gray-dark">dans votre cave virtuelle</p>
        </div>
        <div className="bg-cream rounded-2xl p-4 text-center min-h-[44px] flex flex-col justify-center">
          <p className="font-display text-lg font-bold text-black-wine">Antoine 24h/24</p>
          <p className="text-xs text-gray-dark">votre sommelier IA personnel</p>
        </div>
      </div>

      <p className="text-gray-dark text-sm text-center">
        Toutes vos données seront conservées 90 jours.
      </p>

      <button
        onClick={onRetain}
        className="w-full py-4 bg-burgundy-dark text-white rounded-2xl font-bold text-base border-none cursor-pointer hover:bg-burgundy-medium transition-colors min-h-[44px]"
      >
        Conserver mon abonnement
      </button>
      <button
        onClick={onContinue}
        className="w-full mt-3 text-gray-dark text-sm underline block text-center bg-transparent border-none cursor-pointer hover:text-burgundy-dark transition-colors min-h-[44px] flex items-center justify-center"
      >
        Continuer vers l&apos;annulation →
      </button>
    </motion.div>
  );
}
