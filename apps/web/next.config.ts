import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Backend berjalan di port 3000 dengan prefix /api/v1
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env['NEXT_PUBLIC_API_BASE_URL'] ?? 'http://localhost:3000/api/v1',
  },
};

export default nextConfig;
