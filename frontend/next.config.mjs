/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Backup if a page still runs long; primary fix is bounded fetches in lib/api-fetch.ts
  staticPageGenerationTimeout: 120,
  // experimental: {
  //   appDir: true,
  // },
};

export default nextConfig;

