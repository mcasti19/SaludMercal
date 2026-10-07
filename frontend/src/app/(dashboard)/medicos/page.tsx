import { MedicosContent } from "@/modules/medicos/MedicosContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Médicos y Especialidades — SaludMercal",
  description: "Directorio del cuerpo médico del servicio de salud Mercal",
};

export default function MedicosPage() {
  return <MedicosContent />;
}
