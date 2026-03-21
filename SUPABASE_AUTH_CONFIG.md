# Configuration Supabase Auth à vérifier manuellement

## Authentication → Providers

- Email : activé ✓
- Google : activé ✓ (vérifier Client ID et Secret)
- Apple : ACTIVER si pas encore fait
  → Nécessite Apple Developer Account
  → Services ID + Private Key

## Authentication → URL Configuration

- Site URL : https://sommely.shop
- Redirect URLs :
  - https://sommely.shop
  - https://sommely.shop/**
  - https://sommely.shop/auth/confirm
  - https://sommely.shop/auth
  - https://sommely.shop/auth/callback

## Email Templates

- Confirm signup : template Sommely ✓
- Magic Link : template Sommely ✓
