import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StepLossAversion } from './steps/StepLossAversion';
import { StepAlternatives } from './steps/StepAlternatives';
import { StepExitSurvey, type ExitReason } from './steps/StepExitSurvey';
import { StepFinalConfirm } from './steps/StepFinalConfirm';
import { getScansCountTotal, getCaveBottles, getProfile, insertFeedback } from '../../lib/supabase';

const getApiBase = () => {
  const url = import.meta.env.VITE_API_BASE;
  if (url) return url.replace(/\/$/, '');
  return window.location.origin;
};

export interface SaveFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionId: string | null;
  customerId: string | null;
  nextBillingDate: string | null;
  plan: string;
  userId: string;
  onSuccessRetain?: () => void;
  onSuccessCancel?: () => void;
  refreshSubscription: () => Promise<void>;
}

type Step = 1 | 2 | 3 | 4;
type SuccessState = 'pause' | 'discount' | 'cancel' | null;

export function SaveFlowModal({
  isOpen,
  onClose,
  subscriptionId,
  customerId,
  nextBillingDate,
  plan,
  userId,
  onSuccessRetain,
  onSuccessCancel,
  refreshSubscription,
}: SaveFlowModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [scansCount, setScansCount] = useState(0);
  const [caveBottlesCount, setCaveBottlesCount] = useState(0);
  const [discountAlreadyApplied, setDiscountAlreadyApplied] = useState(false);
  const [selectedReason, setSelectedReason] = useState<ExitReason | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successState, setSuccessState] = useState<SuccessState>(null);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const preloadData = useCallback(async () => {
    if (!userId) return;
    const [scanRes, caveRes, profileRes] = await Promise.all([
      getScansCountTotal(userId),
      getCaveBottles(userId),
      getProfile(userId),
    ]);
    setScansCount(scanRes.count ?? 0);
    setCaveBottlesCount((caveRes.data ?? []).length);
    setDiscountAlreadyApplied(profileRes.data?.discount_used ?? false);
  }, [userId]);

  useEffect(() => {
    if (isOpen && userId) {
      preloadData();
      setStep(1);
      setSelectedReason(null);
      setFeedbackText('');
      setError(null);
      setSuccessState(null);
    }
  }, [isOpen, userId, preloadData]);

  const handleRetain = () => {
    onSuccessRetain?.();
    onClose();
  };

  const callRetentionApi = async (action: 'pause' | 'discount' | 'cancel') => {
    if (!subscriptionId) {
      setError('Abonnement introuvable.');
      return { success: false };
    }
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/api/stripe-retention`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, subscriptionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Une erreur est survenue.');
        return { success: false };
      }
      return data;
    } catch (e) {
      setError('Erreur réseau. Réessayez.');
      return { success: false };
    }
  };

  const handlePause = async () => {
    setError(null);
    setIsPausing(true);
    const result = await callRetentionApi('pause');
    setIsPausing(false);
    if (result.success) {
      setSuccessState('pause');
      await refreshSubscription();
      setTimeout(() => {
        onClose();
      }, 3000);
    }
  };

  const handleDiscount = async () => {
    setError(null);
    setIsApplyingDiscount(true);
    const result = await callRetentionApi('discount');
    setIsApplyingDiscount(false);
    if (result.success) {
      setSuccessState('discount');
      await refreshSubscription();
      setTimeout(() => {
        onClose();
      }, 3000);
    }
  };

  const handleConfirmCancel = async () => {
    setError(null);
    setIsCancelling(true);
    const result = await callRetentionApi('cancel');
    setIsCancelling(false);
    if (result.success) {
      setSuccessState('cancel');
      await refreshSubscription();
      onSuccessCancel?.();
      onClose();
    }
  };

  const handleSubmitFeedback = async (reason: ExitReason, text: string) => {
    setIsSubmittingFeedback(true);
    const { error: err } = await insertFeedback(userId, reason, text || null);
    setIsSubmittingFeedback(false);
    if (!err) {
      setFeedbackText('');
    }
  };

  const handleContactSupport = () => {
    window.location.href = 'mailto:support@sommely.shop';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 pb-safe"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25 }}
        className="w-full max-w-lg bg-white rounded-3xl p-6 pb-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {successState === 'pause' && (
          <div className="text-center py-4">
            <p className="text-lg font-semibold text-black-wine">
              ⏸️ Pause activée ! Votre prochain paiement est suspendu 30 jours.
            </p>
          </div>
        )}
        {successState === 'discount' && (
          <div className="text-center py-4">
            <p className="text-lg font-semibold text-black-wine">
              🎉 -50% appliqué ! Votre prochaine facture est réduite de moitié.
            </p>
          </div>
        )}
        {successState === 'cancel' && (
          <div className="text-center py-4">
            <p className="text-lg font-semibold text-black-wine">
              Abonnement annulé. Vous gardez l&apos;accès jusqu&apos;au{' '}
              {nextBillingDate
                ? new Date(nextBillingDate).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : '—'}
              .
            </p>
          </div>
        )}

        {!successState && (
          <AnimatePresence mode="wait">
            {step === 1 && (
              <StepLossAversion
                key="step1"
                scansCount={scansCount}
                caveBottlesCount={caveBottlesCount}
                onRetain={handleRetain}
                onContinue={() => setStep(2)}
              />
            )}
            {step === 2 && (
              <StepAlternatives
                key="step2"
                discountAlreadyApplied={discountAlreadyApplied}
                onPause={handlePause}
                onDiscount={handleDiscount}
                onContinue={() => setStep(3)}
                isPausing={isPausing}
                isApplyingDiscount={isApplyingDiscount}
                error={error}
              />
            )}
            {step === 3 && (
              <StepExitSurvey
                key="step3"
                userId={userId}
                selectedReason={selectedReason}
                onSelectReason={setSelectedReason}
                feedbackText={feedbackText}
                onFeedbackTextChange={setFeedbackText}
                onContinue={() => setStep(4)}
                onBack={() => setStep(2)}
                onContactSupport={handleContactSupport}
                onSubmitFeedback={handleSubmitFeedback}
                isSubmittingFeedback={isSubmittingFeedback}
              />
            )}
            {step === 4 && (
              <StepFinalConfirm
                key="step4"
                nextBillingDate={nextBillingDate}
                onRetain={handleRetain}
                onConfirmCancel={handleConfirmCancel}
                isCancelling={isCancelling}
                error={error ?? undefined}
              />
            )}
          </AnimatePresence>
        )}
      </motion.div>
    </motion.div>
  );
}
