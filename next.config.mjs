/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["gsap"],
  reactStrictMode: true,
  turbopack: {},
  devIndicators: false,
  experimental: {
    optimizePackageImports: ["motion"],
  },
};

export default nextConfig;
