import { CitaEstado } from "@/types";
import { CITA_ESTADO_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface CitaEstadoBadgeProps {
  estado: CitaEstado;
  className?: string;
}

export function CitaEstadoBadge({ estado, className }: CitaEstadoBadgeProps) {
  const config = CITA_ESTADO_CONFIG[estado];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.color,
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full mr-1.5",
          estado === "EN_ATENCION" && "animate-pulse bg-violet-500",
          estado === "PENDIENTE" && "bg-amber-500",
          estado === "CONFIRMADA" && "bg-blue-500",
          estado === "COMPLETADA" && "bg-emerald-500",
          estado === "CANCELADA" && "bg-red-500"
        )}
      />
      {config.label}
    </span>
  );
}
