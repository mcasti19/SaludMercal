// ============================================================
// Global TypeScript Definitions — SaludMercal
// Aligned with PostgreSQL schema (backend-ready)
// ============================================================

// Auth / Session
export type UserRole = "ADMIN" | "RECEPCION" | "MEDICO" | "ENFERMERIA" | "EMPLEADO";

export interface AuthUser {
  id: string;
  cedula: string;
  nombre: string;
  apellido: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  departamento: string;
}

// Paciente
export interface Paciente {
  id: string;
  cedula: string;
  nombre: string;
  apellido: string;
  departamento: string;
  telefono: string;
  email: string;
  fechaNacimiento: string; // ISO date string
  estado: "ACTIVO" | "INACTIVO";
}

// Especialidad
export interface Especialidad {
  id: string;
  nombre: string;
  descripcion?: string;
}

// Medico
export interface Medico {
  id: string;
  cedula?: string;
  nombre: string;
  apellido: string;
  especialidadId: string;
  especialidadNombre: string;
  diasLaborables: number[]; // 0=Dom, 1=Lun, 2=Mar, 3=Mie, 4=Jue, 5=Vie, 6=Sab
  turno: "MANANA" | "TARDE" | "NOCTURNO";
  horaInicio?: string; // HH:mm
  horaFin?: string;    // HH:mm
  cubiculo: string;
  telefono?: string;
  email?: string;
  activo: boolean;
  fotoPerfil?: string; // base64 data URL
  creadoEn?: string;   // ISO datetime
}

// Estado de Cita
export type CitaEstado =
  | "PENDIENTE"
  | "CONFIRMADA"
  | "EN_ATENCION"
  | "COMPLETADA"
  | "CANCELADA";

// Cita
export interface Cita {
  id: string;
  pacienteId: string;
  pacienteNombre: string;
  pacienteCedula: string;
  medicoId: string;
  medicoNombre: string;
  especialidad: string;
  fecha: string; // ISO date string  YYYY-MM-DD
  hora: string; // HH:mm
  estado: CitaEstado;
  motivo: string;
  notas?: string;
  creadoEn: string; // ISO datetime
}

// Dashboard Metrics
export interface DashboardMetric {
  label: string;
  value: number | string;
  change?: number;
  changeType?: "up" | "down" | "neutral";
  icon?: string;
}

// Reposo Médico
export type ReposoEstado = "PENDIENTE" | "APROBADO" | "RECHAZADO";

export interface Reposo {
  id: string;
  empleadoId: string;
  empleadoNombre: string;
  fechaInicio: string; // YYYY-MM-DD
  fechaFin: string;    // YYYY-MM-DD
  dias: number;
  diagnostico: string;
  medicoTratante: string;
  tipo: "LABORAL" | "ACCIDENTE" | "ENFERMEDAD" | "MATERNIDAD";
  estado: ReposoEstado;
  adjuntoBase64?: string; // Image or PDF
  creadoEn: string;
  notasAdmin?: string;
}
