/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/account/:path*',
        destination: 'https://krazycarma.com/account/:path*',
        permanent: false,
      },
      {
        source: '/pages/:path*',
        destination: 'https://krazycarma.com/pages/:path*',
        permanent: false,
      },
      {
        source: '/collections/:path*',
        destination: 'https://krazycarma.com/collections/:path*',
        permanent: false,
      },
    ];
  },
}

export default nextConfig
