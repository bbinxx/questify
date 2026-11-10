/** @type {import('next').NextConfig} */
const nextConfig = {
    distDir: process.env.NODE_ENV !== 'production' ? '.next-dev' : '.next',
    experimental: { serverActions: { bodySizeLimit: '21mb' } },
}

export default nextConfig
