# Configuration Google OAuth pour Sommely

## Erreur fréquente : mauvaise URL dans Google Cloud

Il y a **deux endroits différents** avec des URLs différentes :

| Où ? | Quel champ ? | Quelle URL ? |
|------|--------------|--------------|
| **Supabase** | Site URL | `https://sommely-wine.vercel.app` |
| **Supabase** | Redirect URLs | `https://sommely-wine.vercel.app/**` |
| **Google Cloud** | Authorized JavaScript origins | `https://sommely-wine.vercel.app` |
| **Google Cloud** | **Authorized redirect URIs** | `https://TON_PROJECT.supabase.co/auth/v1/callback` |

⚠️ **Dans Google Cloud, NE PAS mettre** `https://sommely-wine.vercel.app` dans les Authorized redirect URIs !

Google redirige vers **Supabase**, pas vers ton app. L’URL Supabase s’obtient ici :

1. Supabase Dashboard → **Authentication** → **URL Configuration**
2. Copier l’URL "Callback URL" (ex. `https://abcdefgh.supabase.co/auth/v1/callback`)
3. Coller cette URL exacte dans Google Cloud → **Authorized redirect URIs**

---

## Checklist complète

### 1. Supabase

**Authentication** → **URL Configuration** :
- **Site URL** : `https://sommely-wine.vercel.app`
- **Redirect URLs** : `https://sommely-wine.vercel.app/**`

**Authentication** → **Providers** → **Google** :
- Activé ✅
- Client ID (depuis Google Cloud)
- Client Secret (depuis Google Cloud)

### 2. Google Cloud Console

**APIs & Services** → **Credentials** → ton OAuth 2.0 Client ID :

**Authorized JavaScript origins** :
```
https://sommely-wine.vercel.app
```

**Authorized redirect URIs** (URL de Supabase, pas de ton app !) :
```
https://XXXXX.supabase.co/auth/v1/callback
```
→ Remplacer `XXXXX` par l’ID de ton projet Supabase (dans l’URL du dashboard).

### 3. Vercel

**Settings** → **Environment Variables** :
- `VITE_SUPABASE_URL` = ton URL Supabase (ex. `https://xxxxx.supabase.co`)
- `VITE_SUPABASE_ANON_KEY` = ta clé anon

---

## Tester

1. Déployer sur Vercel
2. Ouvrir https://sommely-wine.vercel.app/auth
3. Cliquer sur « Continuer avec Google »
4. Se connecter avec Google
5. Si erreur : noter le message affiché sur `/auth/callback`
