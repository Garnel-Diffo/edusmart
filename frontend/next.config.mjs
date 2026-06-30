/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  async rewrites() {
    // Proxy API en développement pour éviter les problèmes CORS
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: `${process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000'}/api/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
