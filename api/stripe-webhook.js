// TODO MANUEL : Dans Stripe Dashboard → Webhooks → Add endpoint
// URL : https://sommely.shop/api/stripe-webhook
// Events à écouter :
//   - customer.subscription.created
//   - invoice.payment_succeeded
// Copier le "Signing secret" → variable STRIPE_WEBHOOK_SECRET dans Vercel

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Quand un paiement réussit (abonnement activé)
  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'invoice.payment_succeeded'
  ) {
    let customerId =
      event.data.object.customer ||
      (event.data.object.subscription
        ? (await stripe.subscriptions.retrieve(event.data.object.subscription))?.customer
        : null);
    if (typeof customerId === 'object' && customerId?.id) customerId = customerId.id;

    if (!customerId) return res.json({ received: true });

    // Trouver l'user Supabase : subscriptions.stripe_customer_id ou customer email
    let userId = null;
    const { data: subByCustomer } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .limit(1)
      .maybeSingle();

    if (subByCustomer?.user_id) {
      userId = subByCustomer.user_id;
    } else {
      const customer = await stripe.customers.retrieve(customerId).catch(() => null);
      const email = customer?.deleted ? null : customer?.email;
      if (email) {
        const { data: profileByEmail } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .limit(1)
          .maybeSingle();
        if (profileByEmail?.id) userId = profileByEmail.id;
      }
    }

    if (!userId) return res.json({ received: true });

    const subscriptionId =
      event.data.object.subscription || event.data.object.id || null;

    // Sync stripe_customer_id et stripe_subscription_id si manquants
    if (subscriptionId) {
      await supabase
        .from('subscriptions')
        .update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          status: 'active',
        })
        .eq('user_id', userId);
    } else {
      await supabase
        .from('subscriptions')
        .update({ stripe_customer_id: customerId, status: 'active' })
        .eq('user_id', userId);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, first_name, referred_by')
      .eq('id', userId)
      .single();

    if (!profile) return res.json({ received: true });

    // ━━━ LOGIQUE PARRAINAGE ━━━
    if (profile.referred_by) {
      const { data: referral } = await supabase
        .from('referrals')
        .select('id, referrer_id, status')
        .eq('referral_code', profile.referred_by)
        .eq('referred_id', profile.id)
        .single();

      if (referral && referral.status === 'pending') {
        await supabase
          .from('referrals')
          .update({ status: 'rewarded' })
          .eq('id', referral.id);

        const { data: referrer } = await supabase
          .from('profiles')
          .select('id, first_name, subscription_extended_until, referral_reward_months')
          .eq('id', referral.referrer_id)
          .single();

        if (referrer) {
          const baseDate = referrer.subscription_extended_until
            ? new Date(referrer.subscription_extended_until)
            : new Date();
          const newDate = new Date(baseDate);
          newDate.setDate(newDate.getDate() + 30);

          await supabase
            .from('profiles')
            .update({
              subscription_extended_until: newDate.toISOString(),
              referral_reward_months: (referrer.referral_reward_months || 0) + 1,
            })
            .eq('id', referrer.id);

          const baseUrl =
            process.env.VERCEL_URL
              ? `https://${process.env.VERCEL_URL}`
              : 'https://sommely.shop';
          try {
            await fetch(`${baseUrl}/api/send-push`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: referrer.id,
                title: '🍷 Sommely',
                body: `${profile.first_name || 'Un ami'} a utilisé votre code et est passé Pro ! Vous gagnez 1 mois gratuit. 🎉`,
                url: '/profile',
              }),
            });
          } catch {
            // Ignorer erreurs notification
          }
        }
      }
    }
  }

  res.json({ received: true });
}

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}
