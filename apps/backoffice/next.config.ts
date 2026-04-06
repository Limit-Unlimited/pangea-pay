import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@pangea/db", "@pangea/ui", "@pangea/config"],
  serverExternalPackages: ["bcryptjs", "mysql2"],
};

export default nextConfig;
