import type { Metadata } from "next";
import { PortalCitasContent } from "@/modules/portal/citas/PortalCitasContent";

export const metadata: Metadata = {
  title: "Mis Citas | Portal del Empleado",
  description: "Solicita y gestiona tus citas médicas",
};

export default function PortalCitasPage() {
  return <PortalCitasContent />;
}
