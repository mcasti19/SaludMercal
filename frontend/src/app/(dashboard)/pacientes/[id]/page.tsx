import { PacienteDetalleContent } from "@/modules/pacientes/PacienteDetalleContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Expediente de Paciente — SaludMercal",
  description: "Historial médico, consultas clínicas y reposos del trabajador",
};

interface PacientePageProps {
  params: Promise<{ id: string }>;
}

export default async function PacientePage({ params }: PacientePageProps) {
  const { id } = await params;
  return <PacienteDetalleContent patientId={id} />;
}
