import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // 카메라/마이크/자동재생 권한 허용 (self)
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), autoplay=(self)' },
        ],
      },
    ]
  },
};

export default nextConfig;
