import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@pangea/db", "@pangea/ui", "@pangea/config"],
  experimental: {
    serverComponentsExternalPackages: ["bcryptjs", "mysql2"],
  },
};

export default nextConfig;
