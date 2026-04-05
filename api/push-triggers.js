import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

webpush.setVapidDetails(
  'mailto:hello@sommely.shop',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const TRIGGERS = [
  { type: 'inactive_3d', days: 3, title: 'Sommely', body: "{{first_name}}, votre cave virtuelle s'ennuie. 🍷", url: '/cave' },
  { type: 'inactive_7d', days: 7, title: 'Sommely', body: "{{first_name}}, Vivino vous a peut-être manqué. Nous non.", url: '/' },
  { type: 'inactive_14d', days: 14, title: 'Sommely', body: "Le vin d'hier soir au resto... vous auriez pu le scanner. 😏", url: '/scan' },
  { type: 'inactive_30d', days: 30, title: 'Sommely', body: "Un mois sans Sommely. On espère que vous avez survécu aux cartes des vins.", url: '/' },
  { type: 'trial_2d', title: '⏰ Sommely Pro', body: "{{first_name}}, votre trial expire dans 48h. 47,99€/an = moins qu'une mauvaise bouteille.", url: '/premium' },
  { type: 'friday_reminder', title: 'Sommely 🍷', body: "C'est vendredi {{first_name}}. Ce soir il faudra choisir un vin. On est là.", url: '/scan' },
  { type: 'christmas', title: '🎄 Sommely', body: "Il reste 30 jours pour ne pas offrir une bouteille que personne ne veut.", url: '/' },
  { type: 'valentine', title: '❤️ Sommely', body: "Un 91/100 selon son profil > des fleurs. On vérifie ?", url: '/scan' },
  { type: 'birthday', title: '🎂 Sommely', body: "Joyeux anniversaire {{first_name}} ! Offrez-vous une belle bouteille ce soir.", url: '/scan' },
];

function personalize(text, profile) {
  return text.replace(/\{\{first_name\}\}/g, profile?.first_name || profile?.name?.split?.(' ')?.[0] || '');
}

async function sendPush(supabase, userId, title, body, url) {
  const { data: subs } = await supabase.from('push_subscriptions').select('*').eq('user_id', userId);
  if (!subs?.length) return false;
  const payload = JSON.stringify({ title, body, url: url || '/' });
  await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  );
  return true;
}

/** Au plus un push marketing / 7 jours par utilisateur (profiles.last_push_at). */
async function sendPushDedup(supabase, profileRow, title, body, url) {
  const weekMs = 7 * 86400000;
  const last = profileRow.last_push_at ? new Date(profileRow.last_push_at) : null;
  if (last && last.getTime() > Date.now() - weekMs) return;
  const sent = await sendPush(supabase, profileRow.id, title, body, url);
  if (sent) {
    await supabase
      .from('profiles')
      .update({ last_push_at: new Date().toISOString() })
      .eq('id', profileRow.id);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end();

  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers['authorization'];
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!supabaseUrl || !supabaseServiceKey || !process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return res.status(500).json({ error: 'Config manquante' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const monthDay = today.slice(5); // "MM-DD"
  const dayOfWeek = now.getDay();
  const isFriday = dayOfWeek === 5;

  // ─── Inactivité (last_scan_at ou created_at) — un seul trigger par user (le plus pertinent)
  const inactiveTriggers = TRIGGERS.filter((x) => x.days).sort((a, b) => (b.days || 0) - (a.days || 0));
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, first_name, name, last_scan_at, created_at, last_push_at')
    .or('push_enabled.eq.true,push_enabled.is.null');
  for (const p of allProfiles || []) {
    const lastActivity = p.last_scan_at ? new Date(p.last_scan_at) : new Date(p.created_at || 0);
    const t = inactiveTriggers.find((tr) => lastActivity < new Date(now.getTime() - (tr.days || 0) * 86400000));
    if (t) await sendPushDedup(supabase, p, t.title, personalize(t.body, p), t.url);
  }

  // ─── Trial 2 jours
  const trial2d = TRIGGERS.find((x) => x.type === 'trial_2d');
  if (trial2d) {
    const in2d = new Date(now);
    in2d.setDate(in2d.getDate() + 2);
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('status', 'trial')
      .lte('trial_ends_at', in2d.toISOString())
      .gte('trial_ends_at', now.toISOString());
    const userIds = [...new Set((subs || []).map((s) => s.user_id).filter(Boolean))];
    if (userIds.length) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, name, last_push_at')
        .in('id', userIds);
      for (const p of profiles || []) {
        await sendPushDedup(supabase, p, trial2d.title, personalize(trial2d.body, p), trial2d.url);
      }
    }
  }

  // ─── Vendredi
  if (isFriday) {
    const friday = TRIGGERS.find((x) => x.type === 'friday_reminder');
    if (friday) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, name, last_push_at')
        .eq('push_enabled', true);
      for (const p of profiles || []) {
        await sendPushDedup(supabase, p, friday.title, personalize(friday.body, p), friday.url);
      }
    }
  }

  // ─── Noël (1–25 déc)
  if (monthDay >= '12-01' && monthDay <= '12-25') {
    const christmas = TRIGGERS.find((x) => x.type === 'christmas');
    if (christmas) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, last_push_at')
        .eq('push_enabled', true);
      for (const p of profiles || []) {
        await sendPushDedup(supabase, p, christmas.title, christmas.body, christmas.url);
      }
    }
  }

  // ─── Saint-Valentin (14 fév)
  if (monthDay === '02-14') {
    const valentine = TRIGGERS.find((x) => x.type === 'valentine');
    if (valentine) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, last_push_at')
        .eq('push_enabled', true);
      for (const p of profiles || []) {
        await sendPushDedup(supabase, p, valentine.title, valentine.body, valentine.url);
      }
    }
  }

  // ─── Anniversaire (si birthday connu)
  const birthday = TRIGGERS.find((x) => x.type === 'birthday');
  if (birthday) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, name, birthday, last_push_at')
      .eq('push_enabled', true)
      .not('birthday', 'is', null);
    for (const p of profiles || []) {
      const bd = p.birthday;
      if (!bd) continue;
      const bdStr = typeof bd === 'string' ? bd.slice(5) : '';
      if (bdStr === monthDay) {
        await sendPushDedup(supabase, p, birthday.title, personalize(birthday.body, p), birthday.url);
      }
    }
  }

  res.json({ success: true });
}
