import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'avatars.githubusercontent.com',  // GitHub avatars
      'github.com',                     // GitHub general 
    ],
  },
};

export default nextConfig;
