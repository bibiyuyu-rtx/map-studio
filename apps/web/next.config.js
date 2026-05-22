/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile shared package
  transpilePackages: ["@map-studio/shared"],

  // Docker standalone output
  output: "standalone",
};

module.exports = nextConfig;