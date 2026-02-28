/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // NOTE: next.config is evaluated at build time in our Docker image.
    // Use the docker-compose service name by default so the container can reach the API.
    const apiBase = process.env.INTERNAL_API_BASE || "http://api:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${apiBase}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
