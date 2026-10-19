// ============================================================
// Global TypeScript Definitions — SaludMercal
// Aligned with PostgreSQL schema (backend-ready)
// ============================================================

// Auth / Session
export type UserRole =
  | "SUPERADMIN"
  | "SEGURIDAD_LOGICA"
  | "DESARROLLADOR"
  | "ADMIN"
  | "RECEPCION"
  | "MEDICO"
  | "ENFERMERIA"
  | "EMPLEADO";

export interface SystemUser {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  must_change_password: boolean;
  password_expiration_months?: number;
  password_expires_at?: string | null;
  is_password_expired?: boolean;
  session_timeout_minutes?: number;
  national_id?: string | null;
  department?: string | null;
  patient_id?: number | null;
  location_id?: number | null;
  location?: {
    id: number;
    name: string;
    state?: string | null;
    is_headquarters?: boolean | null;
  } | null;
  last_login_at?: string | null;
  created_at?: string | null;
}

export interface AuthUser {
  id: string;
  cedula: string;
  nombre: string;
  apellido: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  departamento: string;
  patientId?: string;
  locationId?: number;
  locationName?: string;
  locationState?: string;
  isHeadquarters?: boolean;
}

// Beneficiarios Familiares del Paciente
export type ParentescoBeneficiario =
  | "conyuge"
  | "hijo"
  | "hija"
  | "padre"
  | "madre";

export interface Beneficiario {
  id?: number | string;
  patient_id?: number | string;
  first_name: string;
  last_name: string;
  full_name?: string;
  relationship: ParentescoBeneficiario;
  relationship_label?: string;
  national_id?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  phone?: string | null;
  is_active?: boolean;
  _delete?: boolean;
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
  location?: {
    id: string;
    name: string;
    state?: string;
    is_headquarters?: boolean;
  };
  sede?: string;
  isHeadquarters?: boolean;
  /** Pertenece a otra sede y solo es visible aquí por comisión de servicio o cita. */
  enComision?: boolean;
  cargo?: string;
  grupoSanguineo?: string;
  alergias?: string;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaTelefono?: string;
  beneficiaries?: Beneficiario[];
  appointments?: Cita[];
  medical_leaves?: Reposo[];
}

// Examen médico (expediente del paciente)
export interface ExamenArchivo {
  id: string;
  nombre: string;
  mimeType: string;
  tamano: number; // bytes
}

export interface Examen {
  id: string;
  pacienteId: string;
  especialidadId: string;
  especialidadNombre: string;
  citaId?: string;
  titulo: string;
  fecha: string; // YYYY-MM-DD
  notas?: string;
  subidoPor?: string;
  archivos: ExamenArchivo[];
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
  /** Especialidad principal (la usan las citas). */
  especialidadId: string;
  especialidadNombre: string;
  /** Todas las especialidades del médico (incluye la principal). */
  especialidadIds?: string[];
  especialidadesNombres?: string[];
  diasLaborables: number[]; // 0=Dom, 1=Lun, 2=Mar, 3=Mie, 4=Jue, 5=Vie, 6=Sab
  turno: "MANANA" | "TARDE" | "NOCTURNO";
  horaInicio?: string; // HH:mm
  horaFin?: string; // HH:mm
  cubiculo: string;
  telefono?: string;
  email?: string;
  activo: boolean;
  fotoPerfil?: string; // base64 data URL
  creadoEn?: string; // ISO datetime
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
  beneficiaryId?: string;
  beneficiary?: Beneficiario;
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
  fechaFin: string; // YYYY-MM-DD
  dias: number;
  diagnostico: string;
  medicoTratante: string;
  tipo: "LABORAL" | "ACCIDENTE" | "ENFERMEDAD" | "MATERNIDAD";
  estado: ReposoEstado;
  adjuntoBase64?: string; // Image or PDF
  creadoEn: string;
  notasAdmin?: string;
}
