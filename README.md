# AcadémIA Pro — Site Web Complet

**Premier centre de formation professionnelle 100% piloté par l'IA.**

## Stack technique

- **Next.js 14** — App Router, Server Components
- **TypeScript** — Typage complet
- **Tailwind CSS** — Styles utilitaires
- **Claude API (Anthropic)** — Intelligence des 10 agents IA
- **ElevenLabs API** — Synthèse vocale streaming (optionnel)
- **Stripe** — Paiements Pôle Bien-être (Phase 1)

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Accueil | `/` | Hero · Formations · Financement · Bien-être |
| Agents IA | `/agents` | 10 agents avec chat complet |
| Formations | `/formations` | Catalogue filtrable 43 formations |
| Bien-être | `/bienetre` | 8 praticiens · Réservation séance |
| Financement | `/financement` | Simulateur CPF/OPCO/Transitions Pro |
| Blog | `/blog` | 12 articles SEO complets |
| Contact | `/contact` | Formulaire · Coordonnées · UNIA |

## Déploiement sur Vercel — 20 minutes

### Étape 1 — Préparer les fichiers

```bash
# Créer le projet localement (si Node.js installé)
npm install
npm run build  # Vérifier qu'il n'y a pas d'erreurs

# Ou pousser directement sur GitHub sans build local
```

### Étape 2 — GitHub

1. Créer un compte sur [github.com](https://github.com)
2. Créer un nouveau repository : `academiapro`
3. Uploader tous ces fichiers dans le repository
4. Commit les fichiers

### Étape 3 — Vercel

1. Aller sur [vercel.com](https://vercel.com)
2. Cliquer **Sign up with GitHub**
3. **New Project** → sélectionner `academiapro`
4. Framework preset : **Next.js** (détecté automatiquement)
5. Cliquer **Deploy**

### Étape 4 — Variables d'environnement (OBLIGATOIRE)

Dans Vercel → Project → Settings → Environment Variables :

```
ANTHROPIC_API_KEY = sk-ant-api03-VOTRE_CLE
ELEVENLABS_API_KEY = VOTRE_CLE_ELEVENLABS (optionnel)
NEXT_PUBLIC_SITE_URL = https://academiapro.fr
```

### Étape 5 — Domaine personnalisé (optionnel)

Dans Vercel → Project → Settings → Domains :
- Ajouter `academiapro.fr`
- Configurer les DNS chez votre registrar (OVH, Namecheap...)

## Variables d'environnement

Copier `.env.example` en `.env.local` et remplir :

```env
ANTHROPIC_API_KEY=sk-ant-api03-VOTRE_CLE
ELEVENLABS_API_KEY=OPTIONNEL_POUR_VOIX
STRIPE_SECRET_KEY=OPTIONNEL_POUR_PAIEMENTS
```

## Endpoints API sécurisés

| Route | Description |
|-------|-------------|
| `POST /api/chat` | Proxy Claude API avec rate limiting |
| `POST /api/voice` | Proxy ElevenLabs TTS |

Les clés API ne sont **jamais** exposées côté client.

## Coût de fonctionnement

| Service | Phase 0 | Phase Scale |
|---------|---------|-------------|
| Vercel (hébergement) | 0 EUR | 0 EUR |
| Claude API | ~30 EUR/mois | ~150 EUR/mois |
| ElevenLabs | 0 EUR (gratuit) | ~99 USD/mois |
| HeyGen (avatars) | Non requis | ~89 USD/mois |
| **TOTAL** | **~30 EUR/mois** | **~320 EUR/mois** |

## Structure du projet

```
src/
├── app/
│   ├── page.tsx              # Accueil
│   ├── agents/page.tsx       # 10 agents IA avec chat
│   ├── formations/page.tsx   # Catalogue formations
│   ├── bienetre/page.tsx     # Pôle Bien-être
│   ├── financement/page.tsx  # Simulateur CPF
│   ├── blog/page.tsx         # Blog SEO
│   ├── contact/page.tsx      # Contact
│   ├── api/chat/route.ts     # API Claude (sécurisée)
│   └── api/voice/route.ts    # API ElevenLabs (sécurisée)
├── components/
│   └── layout/
│       ├── Nav.tsx           # Navigation
│       └── Footer.tsx        # Pied de page
└── lib/
    └── data.ts               # Données (agents, formations, etc.)
```

---

**Produit par le CAM — AcadémIA Pro · Juin 2026**

<!-- Force redeploy -->

<!-- Force redeploy -->


rebuild 12-07 soir

<!-- Force redeploy -->

<!-- Force redeploy -->

<!-- Force redeploy -->

<!-- Force redeploy -->
