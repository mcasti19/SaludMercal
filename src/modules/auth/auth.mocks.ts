import { AuthUser } from "@/types";

export const MOCK_USERS: AuthUser[] = [
  {
    id: "USR001",
    cedula: "V-10234567",
    nombre: "María",
    apellido: "González",
    email: "maria.gonzalez@mercal.gob.ve",
    role: "ADMIN",
    roleLabel: "Administradora / Recepción",
    departamento: "Administración",
  },
  {
    id: "USR002",
    cedula: "V-15678901",
    nombre: "Carlos",
    apellido: "Rodríguez",
    email: "carlos.rodriguez@mercal.gob.ve",
    role: "MEDICO",
    roleLabel: "Médico",
    departamento: "Consulta General",
  },
  {
    id: "USR003",
    cedula: "V-18234567",
    nombre: "Luisa",
    apellido: "Pérez",
    email: "luisa.perez@mercal.gob.ve",
    role: "RECEPCION",
    roleLabel: "Recepcionista",
    departamento: "Recepción",
  },
  // ── Empleados (Portal Empleado) ────────────────────────────
  {
    id: "USR004",
    cedula: "V-20987654",
    nombre: "Pedro",
    apellido: "Silva",
    email: "pedro.silva@mercal.gob.ve",
    role: "EMPLEADO",
    roleLabel: "Empleado",
    departamento: "Logística",
  },
  {
    id: "USR005",
    cedula: "V-22134567",
    nombre: "Luis",
    apellido: "Vargas",
    email: "luis.vargas@mercal.gob.ve",
    role: "EMPLEADO",
    roleLabel: "Empleado",
    departamento: "Tecnología",
  },
  {
    id: "USR006",
    cedula: "V-17654321",
    nombre: "María",
    apellido: "Fernández",
    email: "maria.fernandez@mercal.gob.ve",
    role: "EMPLEADO",
    roleLabel: "Empleada",
    departamento: "Distribución",
  },
];

// Credenciales de demo — Portal Administrativo
export const DEMO_CREDENTIALS = {
  cedula: "V-10234567",
  password: "mercal2024",
};

// Credenciales de demo — Portal Empleado
export const DEMO_EMPLEADO_CREDENTIALS = {
  cedula: "V-20987654",
  password: "mercal2024",
};

// Roles que acceden al portal administrativo
export const ADMIN_ROLES = ["ADMIN", "RECEPCION", "MEDICO", "ENFERMERIA"] as const;

// Roles que acceden al portal del empleado
export const EMPLEADO_ROLES = ["EMPLEADO"] as const;
