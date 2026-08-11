/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  swcMinify: false,
  compiler: {
    removeConsole: false,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },

  // DEUX MARQUES, UN SEUL DEPOT.
  //
  // mrcomptable.fr sert le contenu de /comptable SANS que l adresse change :
  // le visiteur voit mrcomptable.fr/tarifs, jamais academiapro.fr. Le code
  // reste unique — session, guides, authentification et base de donnees sont
  // partages, et une correction faite ici vaut pour les deux marques.
  //
  // DEUX NOMS POUR UN SEUL PRODUIT. La vitrine vit sous /comptable, mais
  // l espace du cabinet — dossiers, chiffres, pieces, espaces clients,
  // teletransmissions — vit sous /admin/compliance : « compliance » est le
  // nom de code du dossier, « Mr. Comptable » le nom commercial. Sans la
  // seconde regle, le cabinet basculerait sur academiapro.fr des qu il se met
  // au travail.
  //
  // Les routes d API, les fichiers statiques et le sitemap ne sont PAS
  // reecrits : ils sont communs aux deux domaines.
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          has: [{ type: "host", value: "(www\\.)?mrcomptable\\.fr" }],
          destination: "/comptable",
        },
        {
          source: "/admin/compliance/:chemin*",
          has: [{ type: "host", value: "(www\\.)?mrcomptable\\.fr" }],
          destination: "/admin/compliance/:chemin*",
        },
        {
          source: "/:chemin((?!api|_next|comptable|admin|connexion|favicon|icon|manifest|sitemap|robots).*)",
          has: [{ type: "host", value: "(www\\.)?mrcomptable\\.fr" }],
          destination: "/comptable/:chemin",
        },
      ],
    };
  },
};

module.exports = nextConfig;
