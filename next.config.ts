import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["discord.js", "@discordjs/ws", "pg"],
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
