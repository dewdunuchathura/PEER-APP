/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), geolocation=(self), microphone=()'
          }
        ]
      }
    ];
  },

  // Image optimization
  images: {
    domains: ['s3.amazonaws.com', 'cloudinary.com'],
    formats: ['image/avif', 'image/webp']
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  },

  // Webpack optimization
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.runtimeChunk = 'single';
    }
    return config;
  }
};

module.exports = nextConfig;
