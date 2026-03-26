/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  // Disable client-side router cache so navigating back always shows fresh data
  experimental: {
    staleTimes: { dynamic: 0, static: 0 },
  },
}

export default nextConfig
