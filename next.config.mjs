/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  serverExternalPackages: ["pdf-parse", "tesseract.js"],
  turbopack: {
    root: process.cwd()
  }
};

export default nextConfig;
