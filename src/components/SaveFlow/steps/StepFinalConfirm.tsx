import { motion } from 'framer-motion';

interface StepFinalConfirmProps {
  nextBillingDate: string | null;
  onRetain: () => void;
  onConfirmCancel: () => void;
  isCancelling?: boolean;
  error?: string;
}

export function StepFinalConfirm({
  nextBillingDate,
  onRetain,
  onConfirmCancel,
  isCancelling = false,
  error,
}: StepFinalConfirmProps) {
  const formattedDate = nextBillingDate
    ? new Date(nextBillingDate).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="font-display text-2xl font-bold text-black-wine">
          Nous sommes désolés de vous voir partir
        </h2>
      </div>

      {error && (
        <div className="bg-danger/10 text-danger text-sm rounded-xl p-3">
          {error}
        </div>
      )}

      <div className="bg-cream rounded-2xl p-4 text-sm text-gray-dark">
        <p>
          Votre accès se termine le <strong className="text-black-wine">{formattedDate}</strong>.
          Vos données sont conservées 90 jours — vous pouvez réactiver à tout moment.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onRetain}
          disabled={isCancelling}
          className="flex-1 py-4 bg-burgundy-dark text-white rounded-2xl font-bold text-sm cursor-pointer hover:bg-burgundy-medium transition-colors border-none disabled:opacity-60 min-h-[44px]"
        >
          Conserver mon abonnement
        </button>
        <button
          onClick={onConfirmCancel}
          disabled={isCancelling}
          className="flex-1 py-4 border-2 border-gray-light text-gray-dark rounded-2xl font-semibold text-sm cursor-pointer hover:bg-cream transition-colors bg-transparent disabled:opacity-60 min-h-[44px]"
        >
          {isCancelling ? 'Annulation…' : 'Oui, annuler'}
        </button>
      </div>
    </div>
  );
}
