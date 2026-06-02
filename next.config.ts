import type { NextConfig } from "next";

type RemotePattern = {
  protocol: "https" | "http";
  hostname: string;
  pathname: string;
};

function objectStorageImagePatterns(): RemotePattern[] {
  const publicUrl = process.env.S3_PUBLIC_URL?.trim();
  if (!publicUrl) return [];

  try {
    const { protocol, hostname } = new URL(publicUrl);
    if (protocol !== "https:" && protocol !== "http:") return [];
    return [
      {
        protocol: protocol.replace(":", "") as "https" | "http",
        hostname,
        pathname: "/**",
      },
    ];
  } catch {
    return [];
  }
}

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
      ...objectStorageImagePatterns(),
    ],
  },
};

export default nextConfig;
