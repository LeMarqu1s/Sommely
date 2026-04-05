import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

webpush.setVapidDetails(
  'mailto:hello@sommely.shop',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const authStr = Array.isArray(authHeader) ? authHeader[0] : authHeader || '';
  const secret = process.env.CRON_SECRET;

  const { user_id, title, body, url } = req.body || {};
  if (!user_id || !title || !body) {
    return res.status(400).json({ error: 'user_id, title, body requis' });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Supabase non configuré' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  if (!secret || authStr !== `Bearer ${secret}`) {
    if (!secret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    if (!anonKey || !authStr.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authStr.slice(7);
    const authClient = createClient(supabaseUrl, anonKey);
    const { data: { user }, error: userErr } = await authClient.auth.getUser(token);
    if (userErr || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: refRow } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_id', user_id)
      .eq('referred_id', user.id)
      .gte('created_at', since)
      .limit(1)
      .maybeSingle();
    if (!refRow) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  return sendPushResponse(supabase, user_id, title, body, url, res);
}

async function sendPushResponse(supabase, user_id, title, body, url, res) {
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', user_id);

  if (!subs?.length) return res.status(404).json({ error: 'No subscriptions' });

  const payload = JSON.stringify({ title, body, url: url || '/' });

  await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  );

  res.json({ success: true });
}
