import type { Metadata } from "next";
import { PortalPerfilContent } from "@/modules/portal/perfil/PortalPerfilContent";

export const metadata: Metadata = {
  title: "Mi Perfil | Portal del Empleado",
  description: "Información personal y de contacto del empleado",
};

export default function PortalPerfilPage() {
  return <PortalPerfilContent />;
}
