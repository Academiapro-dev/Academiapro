```tsx
// app/politique-confidentialite/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de Confidentialité | AcadémIA Pro',
  description:
    'Politique de confidentialité et protection des données personnelles d\'AcadémIA Pro, conforme au Règlement Général sur la Protection des Données (RGPD).',
  robots: 'index, follow',
}

const sections = [
  {
    id: 'responsable',
    number: '01',
    title: 'Responsable du Traitement',
    content: (
      <div className="space-y-4">
        <p className="text-gray-300 leading-relaxed">
          Le responsable du traitement de vos données personnelles est :
        </p>
        <div className="bg-white/5 border border-[#c8a96e]/20 rounded-xl p-6 space-y-2">
          <div className="flex items-start gap-3">
            <span className="text-[#c8a96e] font-semibold min-w-[140px]">Société :</span>
            <span className="text-gray-200">AcadémIA Pro</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-[#c8a96e] font-semibold min-w-[140px]">Forme juridique :</span>
            <span className="text-gray-200">Société par Actions Simplifiée (SAS)</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-[#c8a96e] font-semibold min-w-[140px]">Siège social :</span>
            <span className="text-gray-200">France</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-[#c8a96e] font-semibold min-w-[140px]">Email DPO :</span>
            <a
              href="mailto:privacy@academiapro.fr"
              className="text-[#c8a96e] hover:text-[#e0c48a] underline underline-offset-2 transition-colors"
            >
              privacy@academiapro.fr
            </a>
          </div>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed">
          En tant que responsable du traitement, AcadémIA Pro détermine les finalités et les moyens
          des traitements de données à caractère personnel effectués dans le cadre de ses services,
          conformément au Règlement (UE) 2016/679 du Parlement européen et du Conseil du 27 avril
          2016 (RGPD) et à la loi Informatique et Libertés du 6 janvier 1978 modifiée.
        </p>
      </div>
    ),
  },
  {
    id: 'donnees-collectees',
    number: '02',
    title: 'Données Personnelles Collectées',
    content: (
      <div className="space-y-6">
        <p className="text-gray-300 leading-relaxed">
          AcadémIA Pro collecte uniquement les données strictement nécessaires à la fourniture de
          ses services (principe de minimisation, art. 5§1 c) RGPD).
        </p>
        <div className="space-y-4">
          {[
            {
              category: 'Données d\'identification',
              icon: '👤',
              items: [
                'Adresse email (identifiant principal du compte)',
                'Prénom (personnalisation de l\'expérience)',
                'Métier / profession (adaptation des contenus pédagogiques)',
              ],
            },
            {
              category: 'Données de formation',
              icon: '📚',
              items: [
                'Progression dans les modules de formation',
                'Scores et résultats aux évaluations',
                'Temps passé sur chaque contenu',
                'Certifications obtenues',
              ],
            },
            {
              category: 'Données de facturation',
              icon: '💳',
              items: [
                'Historique des abonnements et paiements (via Stripe)',
                'Pays de résidence fiscale (pour la TVA)',
                'Aucune donnée bancaire n\'est stockée par AcadémIA Pro',
              ],
            },
            {
              category: 'Données techniques',
              icon: '⚙️',
              items: [
                'Adresse IP (journaux de connexion)',
                'Type de navigateur et système d\'exploitation',
                'Pages visitées et interactions avec la plateforme',
                'Données de sessions vidéo (via Daily.co)',
              ],
            },
            {
              category: 'Communications',
              icon: '✉️',
              items: [
                'Historique des emails transactionnels (via Resend)',
                'Préférences de communication',
                'Taux d\'ouverture et de clics des emails (anonymisés)',
              ],
            },
          ].map((cat) => (
            <div
              key={cat.category}
              className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-[#c8a96e]/30 transition-colors"
            >
              <h4 className="text-[#c8a96e] font-semibold mb-3 flex items-center gap-2">
                <span>{cat.icon}</span>
                {cat.category}
              </h4>
              <ul className="space-y-1.5">
                {cat.items.map((item) => (
                  <li key={item} className="text-gray-300 text-sm flex items-start gap-2">
                    <span className="text-[#c8a96e] mt-1 shrink-0">›</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="bg-[#c8a96e]/10 border border-[#c8a96e]/30 rounded-xl p-4">
          <p className="text-[#c8a96e] text-sm font-medium mb-1">⚠️ Données sensibles</p>
          <p className="text-gray-300 text-sm leading-relaxed">
            AcadémIA Pro ne collecte aucune donnée sensible au sens de l'article 9 du RGPD
            (origine raciale ou ethnique, opinions politiques, convictions religieuses, données de
            santé, données biométriques, etc.).
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'finalites',
    number: '03',
    title: 'Finalités des Traitements',
    content: (
      <div className="space-y-4">
        <p className="text-gray-300 leading-relaxed">
          Vos données sont traitées pour des finalités déterminées, explicites et légitimes,
          conformément à l'article 5§1 b) du RGPD.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#c8a96e]/30">
                <th className="text-left text-[#c8a96e] font-semibold py-3 pr-4 min-w-[180px]">
                  Finalité
                </th>
                <th className="text-left text-[#c8a96e] font-semibold py-3 pr-4 min-w-[160px]">
                  Description
                </th>
                <th className="text-left text-[#c8a96e] font-semibold py-3 min-w-[140px]">
                  Base légale
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                {
                  finalite: 'Gestion du compte utilisateur',
                  description: 'Création, authentification, gestion du profil et de l\'espace personnel',
                  base: 'Exécution du contrat',
                },
                {
                  finalite: 'Accès aux formations',
                  description: 'Fourniture des modules, suivi de la progression, délivrance des certifications',
                  base: 'Exécution du contrat',
                },
                {
                  finalite: 'Facturation et paiement',
                  description: 'Traitement des abonnements, émission des factures, gestion des remboursements',
                  base: 'Exécution du contrat',
                },
                {
                  finalite: 'Emails transactionnels',
                  description: 'Confirmation d\'inscription, notifications de formations, reçus de paiement',
                  base: 'Exécution du contrat',
                },
                {
                  finalite: 'Communications marketing',
                  description: 'Newsletter, nouvelles formations, offres promotionnelles',
                  base: 'Consentement',
                },
                {
                  finalite: 'Amélioration du service',
                  description: 'Analyse anonymisée de l\'utilisation, optimisation pédagogique',
                  base: 'Intérêt légitime',
                },
                {
                  finalite: 'Sécurité et lutte contre la fraude',
                  description: 'Détection des accès non autorisés, prévention des abus',
                  base: 'Intérêt légitime',
                },
                {
                  finalite: 'Obligations légales',
                  description: 'Conservation des données comptables, réponse aux injonctions judiciaires',
                  base: 'Obligation légale',
                },
              ].map((row) => (
                <tr key={row.finalite} className="hover:bg-white/3 transition-colors">
                  <td className="py-3 pr-4 text-gray-200 font-medium">{row.finalite}</td>
                  <td className="py-3 pr-4 text-gray-400">{row.description}</td>
                  <td className="py-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        row.base === 'Exécution du contrat'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : row.base === 'Consentement'
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                          : row.base === 'Intérêt légitime'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                      }`}
                    >
                      {row.base}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
  {
    id: 'bases-legales',
    number: '04',
    title: 'Bases Légales des Traitements',
    content: (
      <div className="space-y-5">
        <p className="text-gray-300 leading-relaxed">
          Conformément à l'article 6 du RGPD, chaque traitement repose sur l'une des bases légales
          suivantes :
        </p>
        {[
          {
            base: 'Exécution du contrat (art. 6§1 b) RGPD)',
            color: 'blue',
            description:
              'Le traitement est nécessaire à l\'exécution du contrat auquel vous avez souscrit (Conditions Générales d\'Utilisation). Cela concerne la gestion de votre compte, l\'accès aux formations et la facturation. Vous ne pouvez pas vous opposer à ces traitements sans résilier votre abonnement.',
          },
          {
            base: 'Consentement (art. 6§1 a) RGPD)',
            color: 'green',
            description:
              'Pour certains traitements optionnels, notamment l\'envoi de communications marketing et l\'utilisation de cookies non essentiels, nous recueillons votre consentement explicite. Vous pouvez retirer ce consentement à tout moment, sans que cela affecte la licéité des traitements antérieurs.',
          },
          {
            base: 'Intérêt légitime (art. 6§1 f) RGPD)',
            color: 'purple',
            description:
              'Certains traitements reposent sur notre intérêt légitime à améliorer nos services et à assurer la sécurité de la plateforme. Nous avons effectué une analyse de mise en balance garantissant que cet intérêt ne prévaut pas sur vos droits et libertés fondamentaux. Vous pouvez exercer votre droit d\'opposition à ces traitements.',
          },
          {
            base: 'Obligation légale (art. 6§1 c) RGPD)',
            color: 'orange',
            description:
              'Certains traitements sont rendus nécessaires par des obligations légales auxquelles AcadémIA Pro est soumis, notamment la conservation des données comptables pendant 10 ans (Code de commerce) et la transmission d\'informations aux autorités compétentes sur injonction judiciaire.',
          },
        ].map((item) => (
          <div
            key={item.base}
            className={`border rounded-xl p-5 ${
              item.color === 'blue'
                ? 'border-blue-500/30 bg-blue-500/5'
                : item.color === 'green'
                ? 'border-green-500/30 bg-green-500/5'
                : item.color === 'purple'
                ? 'border-purple-500/30 bg-purple-500/5'
                : 'border-orange-500/30 bg-orange-500/5'
            }`}
          >
            <h4
              className={`font-semibold mb-2 ${
                item.color === 'blue'
                  ? 'text-blue-300'
                  : item.color === 'green'
                  ? 'text-green-300'
                  : item.color === 'purple'
                  ? 'text-purple-300'
                  : 'text-orange-300'
              }`}
            >
              {item.base}
            </h4>
            <p className="text-gray-300 text-sm leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'duree-conservation',
    number: '05',
    title: 'Durée de Conservation des Données',
    content: (
      <div className="space