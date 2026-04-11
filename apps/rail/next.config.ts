import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@pangea/db", "@pangea/config"],
  serverExternalPackages: ["bcryptjs", "mysql2"],
};

export default nextConfig;
