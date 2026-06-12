/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // sql.js references "fs" which doesn't exist in the browser bundle
    config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false, crypto: false };
    return config;
  },
};

module.exports = nextConfig;
