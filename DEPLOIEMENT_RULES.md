# Règles de déploiement Sommely

## ✅ TOUJOURS faire comme ça
git add .
git commit -m "description du changement"
git push origin main
→ Vercel déploie automatiquement sur sommely.shop en 30s

## ❌ NE JAMAIS faire
- Cliquer "Redeploy" manuellement sur Vercel dashboard
- Cela casse la connexion GitHub→Vercel automatique
- Si ça arrive : vercel --prod dans le terminal pour réparer

## En cas de bug critique en production
git revert HEAD
git push origin main
→ Annule le dernier commit et redéploie proprement
