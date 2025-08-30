/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  output: "standalone", // ✅ required for Netlify
  experimental: {
    appDir: true,
  },
};

export default nextConfig;
