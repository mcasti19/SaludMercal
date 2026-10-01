import { ReportesContent } from "@/modules/reportes/ReportesContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reportes — SaludMercal",
  description: "Estadísticas y reportes del sistema de gestión médica de Mercal",
};

export default function ReportesPage() {
  return <ReportesContent />;
}
