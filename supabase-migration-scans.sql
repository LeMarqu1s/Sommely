-- Compteurs de scans pendant l’essai (trial)
-- Exécuter dans Supabase SQL Editor

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS scans_used INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scans_limit INT DEFAULT 3;

UPDATE public.subscriptions
SET scans_limit = 3
WHERE status = 'trial' AND (scans_limit IS NULL OR scans_limit < 1);

-- Optionnel : aligner scans_used sur le nombre réel de scans déjà effectués (équité)
UPDATE public.subscriptions s
SET scans_used = (
  SELECT COALESCE(COUNT(*)::int, 0)
  FROM public.scans sc
  WHERE sc.user_id = s.user_id
)
WHERE s.status = 'trial';

COMMENT ON COLUMN public.subscriptions.scans_used IS 'Nombre de scans effectués pendant le trial';
COMMENT ON COLUMN public.subscriptions.scans_limit IS 'Plafond de scans en trial (ex. 3)';
