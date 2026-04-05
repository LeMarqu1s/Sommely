const MAX_BODY_SIZE = 2 * 1024 * 1024; // 2MB max pour éviter les abus

const DETERMINISM_INSTRUCTION =
  'Be consistent and deterministic. For the same wine always return the exact same region, price range, grapes, and alcohol level. Use only data visible on the label or universally known facts about this wine. Never invent or estimate differently each time.';

/** Fusionne l’instruction de déterminisme dans le system prompt et force temperature: 0. */
function augmentOpenAIChatBody(body) {
  if (!body || typeof body !== 'object') return body;
  const out = { ...body, temperature: 0 };
  if (!Array.isArray(out.messages)) return out;
  const messages = out.messages.map((m) => (m && typeof m === 'object' ? { ...m } : m));
  const extra = '\n\n' + DETERMINISM_INSTRUCTION;
  const sysIdx = messages.findIndex((m) => m && m.role === 'system');
  if (sysIdx >= 0) {
    const c = messages[sysIdx].content;
    const base = typeof c === 'string' ? c : c == null ? '' : String(c);
    messages[sysIdx] = { ...messages[sysIdx], content: base + extra };
  } else {
    messages.unshift({ role: 'system', content: DETERMINISM_INSTRUCTION });
  }
  return { ...out, messages, temperature: 0 };
}

/** @param {string | null | undefined} text JSON {"min":n,"max":n} */
function parsePriceRangeFromCache(text) {
  if (!text || typeof text !== 'string') return null;
  try {
    const o = JSON.parse(text);
    if (o && typeof o.min === 'number' && typeof o.max === 'number') {
      return { min: o.min, max: o.max };
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function fetchWinePriceFromCache(supabaseUrl, serviceKey, normalizedName) {
  const base = String(supabaseUrl).replace(/\/$/, '');
  const url = `${base}/rest/v1/wine_cache?normalized_name=eq.${encodeURIComponent(normalizedName)}&select=price_range&limit=1`;
  const res = await fetch(url, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });
  if (!res.ok) return null;
  let rows;
  try {
    rows = await res.json();
  } catch {
    return null;
  }
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const row0 = rows[0];
  return row0 && typeof row0 === 'object' ? row0.price_range : null;
}

async function insertWinePriceCache(supabaseUrl, serviceKey, normalizedName, originalName, priceRangeObj) {
  const base = String(supabaseUrl).replace(/\/$/, '');
  const prText = JSON.stringify({
    min: Number(priceRangeObj.min),
    max: Number(priceRangeObj.max),
  });
  const res = await fetch(`${base}/rest/v1/wine_cache`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      normalized_name: normalizedName,
      original_name: originalName,
      price_range: prText,
    }),
  });
  if (!res.ok && res.status !== 409) {
    const errText = await res.text().catch(() => '');
    console.warn('wine_cache insert failed', res.status, errText);
  }
}

/**
 * Après réponse OpenAI OK : fige priceRange via wine_cache (Supabase).
 * Ne s’applique qu’au JSON « une étiquette » (name + priceRange), pas aux cartes / autres.
 */
async function applyWinePriceCacheToResponse(data) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return data;
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') return data;

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    return data;
  }

  if (Array.isArray(parsed) || (parsed.wines && Array.isArray(parsed.wines))) {
    return data;
  }
  if (parsed.error === 'not_wine') return data;

  const name = typeof parsed.name === 'string' ? parsed.name.trim() : '';
  if (!name) return data;

  const normalized = name.toLowerCase().trim();

  const gptRange = parsed.priceRange || parsed.price_range;
  const hasValidGptRange =
    gptRange &&
    typeof gptRange === 'object' &&
    typeof gptRange.min === 'number' &&
    typeof gptRange.max === 'number';

  const cachedText = await fetchWinePriceFromCache(supabaseUrl, serviceKey, normalized);

  if (cachedText) {
    const cachedRange = parsePriceRangeFromCache(cachedText);
    if (cachedRange) {
      parsed.priceRange = cachedRange;
      if ('price_range' in parsed) delete parsed.price_range;
    }
  } else if (hasValidGptRange) {
    await insertWinePriceCache(supabaseUrl, serviceKey, normalized, name, gptRange);
  }

  const msg = data?.choices?.[0]?.message;
  if (!msg || typeof msg !== 'object') return data;
  try {
    msg.content = JSON.stringify(parsed);
  } catch (e) {
    console.warn('wine_cache: stringify message failed', e);
  }
  return data;
}

/**
 * Proxy OpenAI API pour Vercel.
 * Le client envoie le body, on ajoute la clé API côté serveur (jamais exposée).
 */
export default async function handler(req, res) {
  // CORS : sommely.shop uniquement
  const origin = req.headers.origin || '';
  const allowedOrigins = ['https://sommely.shop', 'https://www.sommely.shop', 'http://localhost:5173', 'http://localhost:3000', 'capacitor://localhost', 'ionic://localhost', 'http://localhost'];
  if (allowedOrigins.some(o => origin.startsWith(o) || origin === o)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY non configurée' });
  }

  const body = req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: { message: 'Body invalide' } });
  }
  const payload = augmentOpenAIChatBody(body);
  const bodyStr = JSON.stringify(payload);
  if (bodyStr.length > MAX_BODY_SIZE) {
    return res.status(413).json({ error: { message: 'Requête trop volumineuse' } });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: bodyStr,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    let data;
    try {
      data = await response.json();
    } catch {
      return res.status(502).json({ error: { message: 'Réponse OpenAI invalide.' } });
    }

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    try {
      const patched = await applyWinePriceCacheToResponse(data);
      return res.status(200).json(patched);
    } catch (cacheErr) {
      console.error('wine_cache apply failed:', cacheErr);
      return res.status(200).json(data);
    }
  } catch (err) {
    console.error('OpenAI proxy error:', err);
    if (err && err.name === 'AbortError') {
      return res.status(504).json({ error: { message: "Délai dépassé. L'IA prend trop de temps, réessayez." } });
    }
    return res.status(500).json({ error: { message: err.message || 'Erreur serveur' } });
  }
}
