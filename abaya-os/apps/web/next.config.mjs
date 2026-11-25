import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const API = process.env.API_INTERNAL_URL || 'http://localhost:4000';
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(path.dirname(fileURLToPath(import.meta.url)), '../../'),
  transpilePackages: ['@abaya/shared'],
  poweredByHeader: false,
  // Same-origin API proxy: refresh-token cookie stays first-party and httpOnly.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API}/api/:path*` }];
  },
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }, { protocol: 'http', hostname: 'localhost' }] },
};
export default nextConfig;
