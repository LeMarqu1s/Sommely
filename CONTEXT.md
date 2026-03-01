CONTEXT.md
# SOMMELY - Context Projet (Bible Technique)

## 🎯 Mission
Application mobile-first (PWA) de recommandation vin personnalisée.
"Yuka mais pour le vin" - Scanner → Score IA personnalisé

## 🎨 Design System

### Couleurs EXACTES
```css
--burgundy-dark: #722F37
--burgundy-medium: #8B4049
--burgundy-light: #C4989E
--gold: #D4AF37
--gold-light: #E8D4A0
--cream: #FAF9F6
--cream-dark: #F0EDE6
--black: #2C1810
--gray-dark: #6B5D56
--gray-light: #D1CBC4
--success: #2E7D32
--warning: #F57C00
--danger: #C62828
```

### Typographie
- Display (Titres) : 'Playfair Display', serif
- Body (Corps) : 'Inter', sans-serif
- Tailles : 12px, 14px, 16px, 18px, 24px, 32px, 48px

### Espacements (Système 8px)
8px, 16px, 24px, 32px, 40px, 48px, 64px

### Bordures
- radius-sm: 8px
- radius-md: 12px
- radius-lg: 16px
- radius-full: 9999px

## 📱 Pages & Routes

1. `/` - Landing Page
2. `/onboarding` - Quiz 12 questions
3. `/scan` - Scanner caméra
4. `/result` - Résultat avec score
5. `/premium` - Paywall
6. `/profile` - Profil utilisateur

## 🏗️ Stack Technique

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS
- Shadcn/ui (composants)
- Framer Motion (animations)
- Lucide React (icônes)
- React Router (routing)

### Backend/Services
- Supabase (Auth + Database + Storage)
- OpenAI GPT-4 Vision (reconnaissance étiquettes)
- Stripe (paiements)

### Mobile
- Capacitor (PWA → Native)

## 📊 Database Schema

### user_profiles
- id (uuid, PK)
- preferences (jsonb)
- onboarding_completed (boolean)
- subscription_status (text: 'free' | 'premium')
- scan_count_today (int)
- last_scan_date (date)
- created_at (timestamp)

### scans
- id (uuid, PK)
- user_id (uuid, FK)
- wine_id (uuid, FK)
- score (int)
- scanned_at (timestamp)

### wines
- id (uuid, PK)
- name (text)
- region (text)
- year (int)
- type (text)
- grapes (text[])
- image_url (text)
- avg_price (decimal)

## 🎯 User Flow

### Onboarding (12 Questions)
1. Fréquence consommation
2. Niveau expertise
3. Budget habituel
4. Types préférés (multi-select)
5. Sucré ←→ Sec (slider)
6. Fruité ←→ Boisé (slider)
7. Léger ←→ Corsé (slider)
8. Régions connues
9. Occasions usage
10. Accords mets préférés
11. Où achetez-vous
12. Prénom + Email

### Scan Flow
Gratuit : 3 scans/jour
Au 4ème scan → Redirect Paywall

### Paywall
- Offre : 29.99€/an (soit 2.50€/mois)
- Trial : 7 jours gratuits
- Features : Scans illimités, Gestion cave, Sommelier IA

## 🎨 Design References
- Yuka : Score circulaire + Simplicité
- Caleai : Premium & Trust
- Airbnb : Polish & Flow
- Headspace : Onboarding engageant

## 🚀 Priorités Absolues
1. Mobile-first (responsive parfait)
2. Animations fluides (Framer Motion)
3. Chargements optimisés
4. Feedback visuel immédiat
5. États de chargement élégants

## 📝 Conventions Code
- TypeScript strict mode
- Composants fonctionnels uniquement
- Tailwind pour styling (pas de CSS custom)
- Props typées avec interfaces
- Nommage : PascalCase (composants), kebab-case (fichiers)