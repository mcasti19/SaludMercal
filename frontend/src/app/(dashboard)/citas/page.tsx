import { CitasContent } from "@/modules/citas/CitasContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Citas Médicas — SaludMercal",
  description: "Gestión de citas médicas del sistema de salud Mercal",
};

export default function CitasPage() {
  return <CitasContent />;
}
