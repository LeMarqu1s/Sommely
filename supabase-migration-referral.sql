-- Migration Parrainage Sommely
-- À exécuter manuellement dans Supabase SQL Editor

-- Table pour tracker les parrainages
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'rewarded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referred_id)
);

-- Chaque code ne peut être utilisé qu'une seule fois au total
ALTER TABLE referrals DROP CONSTRAINT IF EXISTS referrals_code_unique;
ALTER TABLE referrals ADD CONSTRAINT referrals_code_unique UNIQUE (referral_code);

-- Colonne pour savoir si l'user a utilisé un code
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS referred_by TEXT,
ADD COLUMN IF NOT EXISTS referral_reward_given BOOLEAN DEFAULT false;

-- Colonnes pour récompenses parrainage (mois offerts, extension abo)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS referral_reward_months INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS subscription_extended_until TIMESTAMPTZ;
