import type { Metadata } from "next";
import { PortalRepososContent } from "@/modules/portal/reposos/PortalRepososContent";

export const metadata: Metadata = {
  title: "Mis Reposos | Portal del Empleado",
  description: "Gestión de reposos y constancias médicas",
};

export default function PortalRepososPage() {
  return <PortalRepososContent />;
}
