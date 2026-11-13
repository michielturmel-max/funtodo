import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";

function localOrigins(): string[] {
  const origins = new Set(["127.0.0.1", "**.ts.net"]);

  for (const addresses of Object.values(networkInterfaces())) {
    for (const address of addresses ?? []) {
      if (address.family === "IPv4" && !address.internal) {
        origins.add(address.address);
      }
    }
  }

  return [...origins];
}

const nextConfig: NextConfig = {
  cacheComponents: false,
  allowedDevOrigins: localOrigins(),
  serverExternalPackages: ["better-sqlite3"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
