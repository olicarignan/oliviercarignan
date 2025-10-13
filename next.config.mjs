/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["gsap"],
  reactStrictMode: true,
  webpack: (config) => {
    config.cache.compression = "brotli";
    return config;
  },
};

export default nextConfig;
