const MAX_BODY_SIZE = 2 * 1024 * 1024; // 2MB max pour éviter les abus

/**
 * Proxy OpenAI API pour Vercel.
 * Le client envoie le body, on ajoute la clé API côté serveur (jamais exposée).
 */
export default async function handler(req, res) {
  // CORS : sommely.shop uniquement
  const origin = req.headers.origin || '';
  const allowedOrigins = ['https://sommely.shop', 'https://www.sommely.shop', 'http://localhost:5173', 'http://localhost:3000'];
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
  const bodyStr = JSON.stringify(body);
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

    return res.status(200).json(data);
  } catch (err) {
    console.error('OpenAI proxy error:', err);
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: { message: "Délai dépassé. L'IA prend trop de temps, réessayez." } });
    }
    return res.status(500).json({ error: { message: err.message || 'Erreur serveur' } });
  }
}
