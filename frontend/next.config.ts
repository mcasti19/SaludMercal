import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permitir imágenes y orígenes de red local (desarrollo)
  allowedDevOrigins: ["10.20.16.26:3000", "10.20.16.26", "localhost:3000"],

  // Configuración de imágenes remotas (si se usan fotos de perfil del backend)
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/storage/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/storage/**",
      },
    ],
  },
};

export default nextConfig;