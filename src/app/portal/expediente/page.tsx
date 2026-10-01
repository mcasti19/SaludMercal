import type { Metadata } from "next";
import { PortalExpedienteContent } from "@/modules/portal/expediente/PortalExpedienteContent";

export const metadata: Metadata = {
  title: "Mi Expediente | Portal del Empleado",
  description: "Historial médico y consultas previas",
};

export default function PortalExpedientePage() {
  return <PortalExpedienteContent />;
}
