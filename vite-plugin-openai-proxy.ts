/**
 * Proxy Vite pour contourner CORS : les appels à l'API OpenAI
 * passent par le serveur Node (pas de CORS depuis le navigateur).
 */
import type { Plugin } from 'vite';
import { loadEnv } from 'vite';

export function openaiProxyPlugin(): Plugin {
  return {
    name: 'openai-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== 'POST' || req.url !== '/api/analyze-wine') {
          return next();
        }

        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', async () => {
          try {
            const { image, prompt } = JSON.parse(body || '{}');
            if (!image || typeof image !== 'string') {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Image base64 manquante' }));
              return;
            }

            const env = loadEnv(server.config.mode, process.cwd(), '');
            const apiKey = process.env.VITE_OPENAI_API_KEY || env.VITE_OPENAI_API_KEY;
            if (!apiKey || apiKey.length < 20) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Clé OpenAI manquante. Vérifiez VITE_OPENAI_API_KEY dans .env' }));
              return;
            }

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                  { role: 'system', content: 'Tu es un expert sommelier. Réponds UNIQUEMENT en JSON valide.' },
                  {
                    role: 'user',
                    content: [
                      { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}`, detail: 'high' } },
                      { type: 'text', text: prompt || 'Analyse cette étiquette de vin et réponds en JSON avec name, region, type, etc.' },
                    ],
                  },
                ],
                max_tokens: 1500,
                temperature: 0.1,
                response_format: { type: 'json_object' },
              }),
            });

            if (!response.ok) {
              const errText = await response.text();
              res.writeHead(response.status, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: errText || `HTTP ${response.status}` }));
              return;
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content || '{}';
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ choices: [{ message: { content } }] }));
          } catch (err: unknown) {
            console.error('[OpenAI Proxy]', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
          }
        });
      });
    },
  };
}
