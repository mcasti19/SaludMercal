import { CitaEstado } from "@/types";

export const CITA_ESTADO_CONFIG: Record<
  CitaEstado,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  PENDIENTE: {
    label: "Pendiente",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  CONFIRMADA: {
    label: "Confirmada",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  EN_ATENCION: {
    label: "En Atención",
    color: "text-violet-700",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
  },
  COMPLETADA: {
    label: "Completada",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
  CANCELADA: {
    label: "Cancelada",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
};

export const TURNOS_CONFIG = {
  MANANA: { label: "Mañana", hours: "07:00 - 12:00" },
  TARDE: { label: "Tarde", hours: "12:00 - 18:00" },
  NOCTURNO: { label: "Nocturno", hours: "18:00 - 23:00" },
};

export const DEPARTAMENTOS = [
  "Administración",
  "Almacén",
  "Distribución",
  "Finanzas",
  "Logística",
  "Recursos Humanos",
  "Recepción",
  "Tecnología",
  "Consulta General",
];

export const HORAS_DISPONIBLES = [
  "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30",
];
