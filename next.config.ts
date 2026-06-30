import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // The double asterisk allows ANY https domain
      },
      {
        protocol: 'http',
        hostname: '**', // The double asterisk allows ANY http domain
      },
    ],
  },
};

export default nextConfig;