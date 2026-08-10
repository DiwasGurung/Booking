import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true, 
    // Prevents image optimization errors on static exports
  },
   distDir: 'dist-front',
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
