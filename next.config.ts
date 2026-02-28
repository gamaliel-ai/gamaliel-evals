import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // When used as submodule or alongside other lockfiles, pin trace root to this package
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
