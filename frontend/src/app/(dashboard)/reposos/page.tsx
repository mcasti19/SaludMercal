import type { Metadata } from "next";
import { AdminRepososContent } from "@/modules/reposos/AdminRepososContent";

export const metadata: Metadata = {
  title: "Auditoría de Reposos | SaludMercal",
  description: "Revisión y validación de reposos médicos de empleados",
};

export default function RepososAdminPage() {
  return <AdminRepososContent />;
}
