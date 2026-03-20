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
  { type: 'inactive_14d', days: 14, title: 'Sommely', body: "Le vin d'hier soir au resto... vous auriez pu le scanner. 😏", url: '/scanner' },
  { type: 'inactive_30d', days: 30, title: 'Sommely', body: "Un mois sans Sommely. On espère que vous avez survécu aux cartes des vins.", url: '/' },
  { type: 'trial_2d', title: '⏰ Sommely Pro', body: "{{first_name}}, votre trial expire dans 48h. 47,99€/an = moins qu'une mauvaise bouteille.", url: '/premium' },
  { type: 'friday_reminder', title: 'Sommely 🍷', body: "C'est vendredi {{first_name}}. Ce soir il faudra choisir un vin. On est là.", url: '/scanner' },
  { type: 'christmas', title: '🎄 Sommely', body: "Il reste 30 jours pour ne pas offrir une bouteille que personne ne veut.", url: '/' },
  { type: 'valentine', title: '❤️ Sommely', body: "Un 91/100 selon son profil > des fleurs. On vérifie ?", url: '/scanner' },
  { type: 'birthday', title: '🎂 Sommely', body: "Joyeux anniversaire {{first_name}} ! Offrez-vous une belle bouteille ce soir.", url: '/scanner' },
];

function personalize(text, profile) {
  return text.replace(/\{\{first_name\}\}/g, profile?.first_name || profile?.name?.split?.(' ')?.[0] || '');
}

async function sendPush(supabase, userId, title, body, url) {
  const { data: subs } = await supabase.from('push_subscriptions').select('*').eq('user_id', userId);
  if (!subs?.length) return;
  const payload = JSON.stringify({ title, body, url: url || '/' });
  await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  );
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end();

  if (!supabaseUrl || !supabaseServiceKey || !process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return res.status(500).json({ error: 'Config manquante' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const dayOfWeek = now.getDay();
  const isFriday = dayOfWeek === 5;

  // ─── Inactivité (last_scan_at ou created_at) — un seul trigger par user (le plus pertinent)
  const inactiveTriggers = TRIGGERS.filter((x) => x.days).sort((a, b) => (b.days || 0) - (a.days || 0));
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, first_name, name, last_scan_at, created_at')
    .or('push_enabled.eq.true,push_enabled.is.null');
  for (const p of allProfiles || []) {
    const lastActivity = p.last_scan_at ? new Date(p.last_scan_at) : new Date(p.created_at || 0);
    const t = inactiveTriggers.find((tr) => lastActivity < new Date(now.getTime() - (tr.days || 0) * 86400000));
    if (t) await sendPush(supabase, p.id, t.title, personalize(t.body, p), t.url);
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
      const { data: profiles } = await supabase.from('profiles').select('id, first_name, name').in('id', userIds);
      for (const p of profiles || []) {
        await sendPush(supabase, p.id, trial2d.title, personalize(trial2d.body, p), trial2d.url);
      }
    }
  }

  // ─── Vendredi
  if (isFriday) {
    const friday = TRIGGERS.find((x) => x.type === 'friday_reminder');
    if (friday) {
      const { data: profiles } = await supabase.from('profiles').select('id, first_name, name').eq('push_enabled', true);
      for (const p of profiles || []) {
        await sendPush(supabase, p.id, friday.title, personalize(friday.body, p), friday.url);
      }
    }
  }

  // ─── Noël (1–25 déc)
  if (today >= '12-01' && today <= '12-25') {
    const christmas = TRIGGERS.find((x) => x.type === 'christmas');
    if (christmas) {
      const { data: profiles } = await supabase.from('profiles').select('id').eq('push_enabled', true);
      for (const p of profiles || []) {
        await sendPush(supabase, p.id, christmas.title, christmas.body, christmas.url);
      }
    }
  }

  // ─── Saint-Valentin (14 fév)
  if (today === '02-14') {
    const valentine = TRIGGERS.find((x) => x.type === 'valentine');
    if (valentine) {
      const { data: profiles } = await supabase.from('profiles').select('id').eq('push_enabled', true);
      for (const p of profiles || []) {
        await sendPush(supabase, p.id, valentine.title, valentine.body, valentine.url);
      }
    }
  }

  // ─── Anniversaire (si birthday connu)
  const birthday = TRIGGERS.find((x) => x.type === 'birthday');
  if (birthday) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, name')
      .eq('push_enabled', true)
      .not('birthday', 'is', null);
    for (const p of profiles || []) {
      const bd = p.birthday;
      if (!bd) continue;
      const bdStr = typeof bd === 'string' ? bd.slice(5) : '';
      if (bdStr === today.slice(5)) {
        await sendPush(supabase, p.id, birthday.title, personalize(birthday.body, p), birthday.url);
      }
    }
  }

  res.json({ success: true });
}
