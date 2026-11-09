import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // packages/shared ships TypeScript source; let Next compile it.
  transpilePackages: ['@aifirst/shared'],
};

export default nextConfig;
