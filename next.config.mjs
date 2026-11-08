/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["gsap"],
  reactStrictMode: true,
  turbopack: {},
  devIndicators: false,
  experimental: {
    optimizePackageImports: ["motion"],
  },
  // JS is cached forever, so fonts must be too. If they have to be re-checked
  // over the network, they land after the entrance starts and the text jumps.
  async headers() {
    return [
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
