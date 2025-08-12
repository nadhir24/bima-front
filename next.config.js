/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      domains: ["bima-back-production.up.railway.app"],
      remotePatterns: [
        {
          protocol: "https",
          hostname: "bima-back-production.up.railway.app",
          pathname: "/**",
        },
        {
          protocol: "http",
          hostname: "bima-back-production.up.railway.app",
          pathname: "/**",
        },
        {
          protocol: "http",
          hostname: "localhost",
          port: "5000",
          pathname: "/**",
        },
      ],
      formats: ["image/webp"],
    },
    reactStrictMode: true,
  };
  
  module.exports = nextConfig;
  