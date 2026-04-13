import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /** Tarayıcıda localhost yerine 127.0.0.1 kullanılınca dev’de çıkan uyarıyı azaltır */
  allowedDevOrigins: [
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "http://127.0.0.1:3001",
    "http://localhost:3001",
  ],
};

export default nextConfig;
