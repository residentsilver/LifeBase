import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Docker環境でのホットリロードを有効化
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.watchOptions = {
        poll: 1000, // 1秒ごとにポーリング
        aggregateTimeout: 300, // 300ms待機してから再コンパイル
      };
    }
    return config;
  },
  // APIリクエストをバックエンドにプロキシ
  async rewrites() {
    return [
      {
        source: '/sanctum/:path*',
        destination: 'http://laravel.test/sanctum/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'http://laravel.test/api/:path*',
      },
    ];
  },
};

export default nextConfig;
