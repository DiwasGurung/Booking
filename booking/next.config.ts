import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  distDir: 'dist-front',
  images: {
    unoptimized: true, 

  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups', // Allows the Google popup to communicate back
          },
        ],
      },
    ]
  },
};

export default nextConfig;
