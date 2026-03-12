/** @type {import('next').NextConfig} */
const nextConfig = {
  generateBuildId: async () => 'build-' + Date.now(),
  reactStrictMode: true,
  headers: async () => [
    {
      source: '/_next/static/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
    {
      source: '/(.*)',
      headers: [
        { key: 'Cache-Control', value: 'no-store' },
      ],
    },
  ],
};

module.exports = nextConfig;
