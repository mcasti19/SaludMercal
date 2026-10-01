import type { Metadata } from "next";
import { PortalShell } from "@/components/layout/PortalShell";

export const metadata: Metadata = {
  title: "MiSaludMercal — Portal del Empleado",
  description: "Portal de autogestión de salud para empleados de Mercal",
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortalShell>{children}</PortalShell>;
}
