/**
 * Vercel Serverless Function - OAuth PKCE Callback
 * Échange le code avec Supabase et redirige avec access_token dans le hash
 */
export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const errorDesc = url.searchParams.get('error_description');

  if (error) {
    return res.redirect(302, `/auth?error=${encodeURIComponent(errorDesc || error)}`);
  }

  if (!code) {
    return res.redirect(302, '/auth');
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=pkce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ auth_code: code }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error('Token exchange failed:', data);
      return res.redirect(302, '/auth?error=connexion_echouee');
    }

    const { access_token, refresh_token, expires_in } = data;

    // Redirige vers /home avec les tokens — Supabase detectSessionInUrl les capte
    const redirectUrl = `/home#access_token=${access_token}&refresh_token=${encodeURIComponent(refresh_token)}&expires_in=${expires_in}&token_type=bearer`;
    return res.redirect(302, redirectUrl);

  } catch (err) {
    console.error('Callback error:', err);
    return res.redirect(302, '/auth?error=erreur_serveur');
  }
}
