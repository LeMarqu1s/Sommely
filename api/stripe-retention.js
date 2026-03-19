export const config = { maxDuration: 30 };

/**
 * Vercel serverless: Stripe retention actions (pause, discount, cancel).
 * Uses STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (server-side only).
 */
export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowedOrigins = [
    'https://sommely.shop',
    'https://www.sommely.shop',
    'http://localhost:5173',
    'http://localhost:3000',
  ];
  if (allowedOrigins.some((o) => origin.startsWith(o) || origin === o)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeKey) {
    return res.status(500).json({ error: 'STRIPE_SECRET_KEY non configurée' });
  }

  const body = req.body;
  if (!body || typeof body !== 'object' || !body.action || !body.subscriptionId) {
    return res.status(400).json({ error: 'action et subscriptionId requis' });
  }

  const { action, subscriptionId } = body;

  if (!['pause', 'discount', 'cancel'].includes(action)) {
    return res.status(400).json({ error: 'action invalide' });
  }

  let Stripe;
  try {
    Stripe = (await import('stripe')).default;
  } catch (e) {
    return res.status(500).json({ error: 'Module Stripe introuvable' });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' });

  try {
    if (action === 'pause') {
      const trialEnd = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
      await stripe.subscriptions.update(subscriptionId, { trial_end: trialEnd });

      if (supabaseUrl && supabaseServiceKey) {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscriptionId)
          .single();
        if (sub?.user_id) {
          const userId = sub.user_id;
          await supabase
            .from('subscriptions')
            .update({ status: 'paused' })
            .eq('user_id', userId)
            .eq('stripe_subscription_id', subscriptionId);
        }
      }

      return res.status(200).json({ success: true });
    }

    if (action === 'discount') {
      await stripe.subscriptions.update(subscriptionId, { coupon: 'SOMMELY_SAVE50_3M' });

      if (supabaseUrl && supabaseServiceKey) {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscriptionId)
          .single();
        if (sub?.user_id) {
          await supabase
            .from('profiles')
            .update({ discount_used: true })
            .eq('id', sub.user_id);
        }
      }

      return res.status(200).json({ success: true });
    }

    if (action === 'cancel') {
      await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });

      if (supabaseUrl && supabaseServiceKey) {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscriptionId)
          .single();
        if (sub?.user_id) {
          await supabase
            .from('subscriptions')
            .update({ status: 'cancelled' })
            .eq('user_id', sub.user_id)
            .eq('stripe_subscription_id', subscriptionId);
        }
      }

      return res.status(200).json({ success: true });
    }
  } catch (err) {
    console.error('stripe-retention error:', err);
    const msg = err.message || err.type || 'Erreur Stripe';
    return res.status(400).json({ error: msg });
  }
}
