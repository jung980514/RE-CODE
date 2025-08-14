// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // ✅ S3(또는 CloudFront) 외부 이미지를 허용.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ssafy-recode-bucket.s3.ap-northeast-2.amazonaws.com",
        pathname: "/**", // 버킷 내 모든 경로 허용
      },
      // CloudFront를 쓰면 여기도 추가
      // { protocol: "https", hostname: "dXXXXXXXX.cloudfront.net", pathname: "/**" },
    ],

    // Presigned URL(만료되는 URL)이라면 캐시 충돌 피하려면 전역으로 끄는 것도 방법.
    // 컴포넌트에서 <Image unoptimized />로 꺼도 됩니다.
    // unoptimized: true,
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), autoplay=(self)" },
        ],
      },
    ];
  },
};

export default nextConfig;
