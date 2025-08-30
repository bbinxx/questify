/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  output: "standalone", // ✅ required for Netlify
  experimental: {
    // ...other experimental options (if needed)
  },
};

export default nextConfig;
