import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar Sesión — SaludMercal",
  description: "Acceda al Sistema de Gestión de Citas Médicas de Mercal",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
