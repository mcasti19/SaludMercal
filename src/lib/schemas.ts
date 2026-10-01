import { z } from "zod";

// ── Login ────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  cedula: z
    .string()
    .min(1, "La cédula es obligatoria")
    .regex(/^[VEve]-?\d{7,8}$/, "Formato válido: V-12345678"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// ── Paciente ─────────────────────────────────────────────────────────────────
export const pacienteSchema = z.object({
  cedula: z
    .string()
    .min(1, "La cédula es obligatoria")
    .regex(/^[VEve]-?\d{7,8}$/, "Formato válido: V-12345678"),
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  apellido: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  departamento: z.string().min(1, "Seleccione un departamento"),
  telefono: z
    .string()
    .min(1, "El teléfono es obligatorio")
    .regex(/^0\d{3}-\d{7}$/, "Formato válido: 0414-1234567"),
  email: z.string().email("Ingrese un email válido"),
  fechaNacimiento: z.string().min(1, "La fecha de nacimiento es obligatoria"),
  estado: z.enum(["ACTIVO", "INACTIVO"]),
});

export type PacienteFormValues = z.infer<typeof pacienteSchema>;

// ── Cita ─────────────────────────────────────────────────────────────────────
export const citaSchema = z.object({
  pacienteId: z.string().min(1, "Seleccione un paciente"),
  medicoId: z.string().min(1, "Seleccione un médico"),
  fecha: z.string().min(1, "La fecha es obligatoria"),
  hora: z.string().min(1, "La hora es obligatoria"),
  motivo: z.string().min(5, "Describa brevemente el motivo (mín. 5 caracteres)"),
  estado: z.enum(["PENDIENTE", "CONFIRMADA", "EN_ATENCION", "COMPLETADA", "CANCELADA"]),
  notas: z.string().optional(),
});

export type CitaFormValues = z.infer<typeof citaSchema>;

// ── Médico ───────────────────────────────────────────────────────────────────
export const medicoSchema = z.object({
  cedula: z
    .string()
    .optional()
    .refine((v) => !v || /^[VEve]-?\d{7,8}$/.test(v), {
      message: "Formato válido: V-12345678",
    }),
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  apellido: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  especialidadId: z.string().min(1, "Seleccione una especialidad"),
  turno: z.enum(["MANANA", "TARDE", "NOCTURNO"]),
  horaInicio: z.string().optional(),
  horaFin: z.string().optional(),
  cubiculo: z.string().min(1, "El cubículo es obligatorio"),
  telefono: z
    .string()
    .optional()
    .refine((v) => !v || /^0\d{3}-\d{7}$/.test(v), {
      message: "Formato válido: 0414-1234567",
    }),
  email: z
    .string()
    .optional()
    .refine((v) => !v || z.string().email().safeParse(v).success, {
      message: "Ingrese un email válido",
    }),
  activo: z.boolean(),
  fotoPerfil: z.string().optional(),
});

export type MedicoFormValues = z.infer<typeof medicoSchema>;

// ── Reposo ───────────────────────────────────────────────────────────────────
export const reposoSchema = z.object({
  fechaInicio: z.string().min(1, "La fecha de inicio es obligatoria"),
  fechaFin: z.string().min(1, "La fecha de fin es obligatoria"),
  diagnostico: z.string().min(5, "Describa brevemente el diagnóstico (mín. 5 caracteres)"),
  medicoTratante: z.string().min(3, "Indique el médico tratante"),
  tipo: z.enum(["LABORAL", "ACCIDENTE", "ENFERMEDAD", "MATERNIDAD"]),
  adjuntoBase64: z.string().optional(),
});

export type ReposoFormValues = z.infer<typeof reposoSchema>;
