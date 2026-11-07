/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['lunar-javascript'],
  // Tối ưu tài nguyên CPU & RAM khi build trên môi trường có giới hạn bộ nhớ (Render Free Tier 512MB RAM)
  experimental: {
    cpus: 1,
  },
};

module.exports = nextConfig;
