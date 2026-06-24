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
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
    responseLimit: "20mb",
  },
};

module.exports = nextConfig;
