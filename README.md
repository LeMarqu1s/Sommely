# SOMMELY - Déploiement Vercel

## Étapes de déploiement (≈ 5 minutes)

### 1. Pousser sur GitHub

```bash
git init
git add .
git commit -m "Initial commit - Sommely MVP"
git branch -M main
git remote add origin https://github.com/TON_USERNAME/sommely.git
git push -u origin main
```

### 2. Connecter à Vercel

- Aller sur `https://vercel.com`
- Cliquer **New Project**
- Importer depuis GitHub
- Sélectionner le repo `sommely`

### 3. Variables d’environnement Vite sur Vercel

Dans **Project Settings → Environment Variables**, ajouter (valeurs réelles à récupérer dans Supabase / Stripe / OpenAI / Clarity / GA) :

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLIC_KEY`
- `VITE_OPENAI_API_KEY`
- `VITE_CLARITY_ID`
- `VITE_GA_ID`
- `VITE_SENTRY_DSN` (optionnel, monitoring erreurs)

### 4. Configuration build

Vercel détecte automatiquement Vite.

- **Build command** : `npm run build`
- **Output directory** : `dist`

### 5. Domaine custom (recommandé)

- Dans **Project Settings → Domains**
- Ajouter `sommely.fr` ou `sommely.com`
- Suivre les instructions DNS chez ton registrar (OVH, Namecheap, Gandi, …)

### 6. Configurer Supabase pour la prod

- Dans Supabase → **Authentication → URL Configuration**
- Ajouter :
  - `https://sommely-xxxx.vercel.app`
  - `https://sommely.fr` (si domaine custom)

### 7. Configurer Google OAuth dans Supabase

- Supabase → **Authentication → Providers → Google**
- Activer Google
- Créer les credentials dans Google Cloud Console
- **Authorized redirect URIs** :
  - `https://xxxxx.supabase.co/auth/v1/callback`

### 8. Schéma Supabase

Dans Supabase SQL editor, exécuter le contenu de `supabase-schema.sql` (tables `user_profiles` et `scans`, RLS, policies, index).

## Checklist après déploiement

- Landing page OK sur mobile (Vercel URL + domaine custom)
- Flow onboarding complet fonctionne (`/onboarding`)
- Scan + résultat vin fonctionnent (`/scan` → `/result`)
- Paywall 3 tiers fonctionne (`/premium`) + simulation paiement
- Microsoft Clarity reçoit des sessions (user recordings)
- Google Analytics reçoit des visites (événements page_view)
- Connexion Google OAuth en production fonctionne (`/auth`)
- Les scans sont bien sauvegardés dans Supabase (tables `scans` et `user_profiles`)

---

## CHECKLIST PRE-LANCEMENT SOMMELY

### TECHNIQUE
- [ ] npm run build sans erreurs
- [ ] npm run preview fonctionne
- [ ] Mobile Chrome : test complet
- [ ] Mobile Safari : test complet
- [ ] Camera fonctionne sur mobile
- [ ] Scan + resultat fonctionne
- [ ] Paywall accessible apres 3 scans
- [ ] Paiement simule fonctionne
- [ ] Profil s affiche correctement
- [ ] Auth Google fonctionne en prod

### TRACKING (NON NEGOCIABLE)
- [ ] Microsoft Clarity ID configure dans .env
- [ ] Clarity recoit des sessions en prod
- [ ] Google Analytics ID configure
- [ ] GA recoit des pageviews en prod
- [ ] Evenements custom (scan, paywall, payment) trackes### SUPABASE
- [ ] Schema SQL execute dans Supabase
- [ ] RLS policies actives
- [ ] Auth URL configure avec domaine Vercel
- [ ] Google OAuth active dans Supabase
- [ ] Test inscription/connexion en prod

### STRIPE
- [ ] Compte Stripe cree
- [ ] Produit "Sommely Club" cree
- [ ] 3 prix crees (monthly 4.99, annual 29.99, lifetime 79)
- [ ] Price IDs copies dans stripe.ts
- [ ] Cle publique dans .env Vercel

### SEO & PWA
- [ ] manifest.json configure
- [ ] Meta tags OG remplis
- [ ] Titre page optimise
- [ ] Description meta optimisee
- [ ] App installable sur iPhone (test Add to Home Screen)

### LANCEMENT
- [ ] Deploye sur Vercel
- [ ] Domaine custom configure (sommely.fr / sommely.com)
- [ ] HTTPS fonctionne
- [ ] URL partager : https://sommely.fr
- [ ] Premier utilisateur beta inscrit
- [ ] Premier scan realise en prod