import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cream font-body">
      <div className="bg-white border-b border-gray-light/30 px-5 py-4 flex items-center gap-3 sticky top-0 z-20 shadow-sm" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)', paddingLeft: '100px' }}>
        <span className="font-display text-base font-bold text-burgundy-dark flex-1">Politique de confidentialité</span>
        <button onClick={() => navigate(-1)} className="bg-transparent border-none cursor-pointer p-1 ml-auto">
          <ArrowLeft size={20} color="#722F37" />
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-8 space-y-6">
        <div>
          <p className="text-xs text-gray-dark mb-6">Dernière mise à jour : mars 2025</p>

          <p className="text-sm text-ink-soft leading-relaxed mb-4">
            Sommely ("nous", "notre", "l'application") s'engage à protéger la vie privée de ses utilisateurs. 
            Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos données personnelles 
            lorsque vous utilisez notre application disponible sur <strong>sommely.shop</strong>.
          </p>
        </div>

        {[
          {
            title: "1. Données collectées",
            content: [
              "Informations de compte : adresse email, prénom, photo de profil (si connexion Google).",
              "Préférences vin : vos réponses au questionnaire d'onboarding (niveau, budget, goûts, occasions).",
              "Données d'utilisation : vins scannés, bouteilles dans votre cave virtuelle, historique des consultations.",
              "Données de paiement : traitées exclusivement par Stripe. Nous ne stockons aucune donnée bancaire.",
            ]
          },
          {
            title: "2. Utilisation des données",
            content: [
              "Personnaliser les recommandations de vins via notre sommelier IA Antoine.",
              "Gérer votre compte et votre abonnement.",
              "Améliorer les fonctionnalités de l'application.",
              "Vous envoyer des communications relatives à votre compte (confirmation d'inscription, renouvellement d'abonnement).",
            ]
          },
          {
            title: "3. Partage des données",
            content: [
              "Nous ne vendons jamais vos données personnelles à des tiers.",
              "Nous partageons vos données uniquement avec nos prestataires techniques : Supabase (base de données), OpenAI (analyse IA), Stripe (paiements), Vercel (hébergement).",
              "Ces prestataires sont contractuellement tenus de protéger vos données.",
            ]
          },
          {
            title: "4. Conservation des données",
            content: [
              "Vos données sont conservées tant que votre compte est actif.",
              "En cas de suppression de compte, vos données sont effacées dans un délai de 30 jours.",
              "Les données de paiement sont conservées par Stripe selon leurs propres politiques.",
            ]
          },
          {
            title: "5. Vos droits (RGPD)",
            content: [
              "Droit d'accès : vous pouvez demander une copie de vos données.",
              "Droit de rectification : vous pouvez corriger vos données via votre profil.",
              "Droit à l'effacement : vous pouvez supprimer votre compte depuis votre profil.",
              "Droit à la portabilité : vous pouvez demander l'export de vos données.",
              "Pour exercer ces droits, contactez-nous à : privacy@sommely.shop",
            ]
          },
          {
            title: "6. Cookies et tracking",
            content: [
              "Nous utilisons Microsoft Clarity et Google Analytics pour analyser l'utilisation de l'application.",
              "Ces outils collectent des données anonymisées sur la navigation.",
              "Vous pouvez désactiver ces cookies via les paramètres de votre navigateur.",
            ]
          },
          {
            title: "7. Sécurité",
            content: [
              "Vos données sont stockées de manière sécurisée via Supabase avec chiffrement en transit (HTTPS) et au repos.",
              "L'accès à vos données est protégé par authentification.",
              "Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données.",
            ]
          },
          {
            title: "8. Modifications",
            content: [
              "Nous pouvons mettre à jour cette politique de confidentialité.",
              "En cas de modification substantielle, vous serez notifié par email ou via l'application.",
              "La date de dernière mise à jour est indiquée en haut de cette page.",
            ]
          },
          {
            title: "9. Contact",
            content: [
              "Pour toute question relative à cette politique de confidentialité ou à vos données personnelles, contactez-nous à : privacy@sommely.shop",
              "Responsable du traitement : Sommely, France.",
            ]
          },
        ].map((section, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-light/30 p-5 shadow-sm">
            <h2 className="font-display text-base font-bold text-black-wine mb-3">{section.title}</h2>
            <ul className="space-y-2">
              {section.content.map((item, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-gray-dark leading-relaxed">
                  <span className="text-burgundy-dark mt-1 flex-shrink-0">·</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="bg-burgundy-dark/5 rounded-2xl p-5 text-center">
          <p className="text-sm text-gray-dark">
            Des questions ? Écrivez-nous à{' '}
            <a href="mailto:privacy@sommely.shop" className="text-burgundy-dark font-semibold">
              privacy@sommely.shop
            </a>
          </p>
        </div>

        <div className="h-6" />
      </div>
    </div>
  );
}
