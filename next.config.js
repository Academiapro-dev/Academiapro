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
          source: "/:chemin((?!api|_next|comptable|favicon|icon|manifest|sitemap|robots).*)",
          has: [{ type: "host", value: "(www\\.)?mrcomptable\\.fr" }],
          destination: "/comptable/:chemin",
        },
      ],
    };
  },
};

module.exports = nextConfig;
