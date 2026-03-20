/**
 * Récompense parrain — appelé par le webhook Stripe quand payment_intent.succeeded
 * ou subscription créée/renouvelée.
 *
 * Logique à implémenter :
 * 1. Vérifier si le nouveau Pro (customer) avait un parrain (referred_by dans profiles)
 * 2. Si oui, récupérer le referrer_id depuis la table referrals
 * 3. Étendre l'abonnement du parrain de 30 jours (Stripe API ou Supabase subscriptions)
 * 4. Mettre à jour referrals.status = 'rewarded' pour la ligne concernée
 * 5. Mettre à jour profiles.referral_reward_given = true pour le parrain
 *
 * À connecter au webhook Stripe (customer.subscription.created, invoice.paid, etc.)
 * quand le filleul passe au statut 'active'.
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  res.json({ message: 'Stub — à connecter au webhook Stripe' });
}
