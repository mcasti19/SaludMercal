import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Otras opciones de configuración si existen */
  experimental: {
    // Si la propiedad está bajo experimental en tu versión, o directamente en la raíz:
  },
  allowedDevOrigins: ["10.20.16.26:3000", "10.20.16.26"],
};

export default nextConfig;