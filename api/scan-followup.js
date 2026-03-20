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
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end();

  if (!supabaseUrl || !supabaseServiceKey || !process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return res.status(500).json({ error: 'Config manquante' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const twoHoursFifteenAgo = new Date(now.getTime() - 135 * 60 * 1000);

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('push_enabled', true)
    .gte('last_scan_at', twoHoursFifteenAgo.toISOString())
    .lte('last_scan_at', twoHoursAgo.toISOString());

  const payload = JSON.stringify({
    title: 'Sommely',
    body: 'Ce vin était à la hauteur de son score ? ⭐',
    url: '/cave',
  });

  for (const p of profiles || []) {
    const { data: subs } = await supabase.from('push_subscriptions').select('*').eq('user_id', p.id);
    if (!subs?.length) continue;
    await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      )
    );
  }

  res.json({ success: true });
}
