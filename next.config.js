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

  // AUCUNE REECRITURE ICI.
  //
  // Le partage des domaines — mrcomptable.fr vers /comptable, la marque
  // blanche des organismes, le sitemap comptable — est entierement traite
  // par middleware.ts, qui s execute AVANT ce fichier. Y ajouter des regles
  // creerait deux mecanismes pour une seule chose, dont l un sans effet.

  // La cle `api` a ete retiree : elle appartient a l ancien routeur et
  // n avait aucun effet ici, mais Next.js la signalait a chaque build comme
  // option non reconnue.
};

module.exports = nextConfig;
