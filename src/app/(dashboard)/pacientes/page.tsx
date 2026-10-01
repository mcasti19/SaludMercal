import { PacientesContent } from "@/modules/pacientes/PacientesContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pacientes — SaludMercal",
  description: "Gestión del directorio de pacientes del servicio de salud Mercal",
};

export default function PacientesPage() {
  return <PacientesContent />;
}
