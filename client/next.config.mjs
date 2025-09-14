/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*', // Match all API routes (e.g., /api/auth/login)
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`, // Proxy to backend
      },
    ];
  },
};

export default nextConfig;