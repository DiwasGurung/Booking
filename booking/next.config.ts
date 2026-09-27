import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // value wins — this is just a safety-net fallback.
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "https://api.appoint-nepal.com",
  },

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