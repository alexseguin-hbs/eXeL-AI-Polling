/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  // Security headers handled by public/_headers (CF Pages reads that file directly)
};

module.exports = nextConfig;
