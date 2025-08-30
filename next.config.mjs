/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  output: "standalone", // ✅ Netlify compatibility
  experimental: {
    appDir: true, // just in case
  },
};

export default nextConfig;
