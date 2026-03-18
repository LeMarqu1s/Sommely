/**
 * Proxy OpenAI API pour Vercel.
 * Le client envoie le body, on ajoute la clé API côté serveur (jamais exposée).
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY non configurée' });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
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
