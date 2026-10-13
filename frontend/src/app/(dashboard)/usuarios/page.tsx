import { UsuariosContent } from "@/modules/usuarios/UsuariosContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gestión de Usuarios y Accesos — SaludMercal",
  description: "Administración de usuarios, roles, políticas de seguridad y credenciales en SaludMercal",
};

export default function UsuariosPage() {
  return <UsuariosContent />;
}
