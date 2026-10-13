import { describe, it, expect } from "vitest";
import {
  loginSchema,
  pacienteSchema,
  citaSchema,
  medicoSchema,
  reposoSchema,
} from "@/lib/schemas";

describe("Validation Schemas (src/lib/schemas.ts)", () => {
  describe("loginSchema", () => {
    it("validates correct login credentials", () => {
      const valid = { login: "admin@mercal.gob.ve", password: "Password123!" };
      const result = loginSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects login shorter than 3 characters or password shorter than 6 characters", () => {
      const invalid = { login: "ab", password: "123" };
      const result = loginSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issues = result.error.issues.map((i) => i.path[0]);
        expect(issues).toContain("login");
        expect(issues).toContain("password");
      }
    });
  });

  describe("pacienteSchema", () => {
    it("validates Venezuelan national id and phone format", () => {
      const valid = {
        cedula: "V-14567890",
        nombre: "Ana",
        apellido: "Rivas",
        departamento: "Logística",
        telefono: "0414-1234567",
        email: "ana.rivas@mercal.gob.ve",
        fechaNacimiento: "1990-04-12",
        estado: "ACTIVO",
      };
      expect(pacienteSchema.safeParse(valid).success).toBe(true);
    });

    it("rejects invalid Venezuelan national id format", () => {
      const invalid = {
        cedula: "ABC-123",
        nombre: "Ana",
        apellido: "Rivas",
        departamento: "Logística",
        telefono: "0414-1234567",
        email: "ana.rivas@mercal.gob.ve",
        fechaNacimiento: "1990-04-12",
        estado: "ACTIVO",
      };
      const result = pacienteSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("citaSchema", () => {
    it("validates complete appointment form data", () => {
      const valid = {
        pacienteId: "1",
        medicoId: "2",
        fecha: "2026-06-15",
        hora: "09:00",
        motivo: "Dolor abdominal recurrente",
        estado: "PENDIENTE",
        notas: "Traer exámenes previos",
      };
      expect(citaSchema.safeParse(valid).success).toBe(true);
    });

    it("rejects motive shorter than 5 characters", () => {
      const invalid = {
        pacienteId: "1",
        medicoId: "2",
        fecha: "2026-06-15",
        hora: "09:00",
        motivo: "Mal",
        estado: "PENDIENTE",
      };
      const result = citaSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("reposoSchema", () => {
    it("validates medical leave form data", () => {
      const valid = {
        fechaInicio: "2026-06-01",
        fechaFin: "2026-06-05",
        diagnostico: "Lumbago agudo e incapacitante",
        medicoTratante: "Dra. Carmen Salazar",
        tipo: "ENFERMEDAD",
      };
      expect(reposoSchema.safeParse(valid).success).toBe(true);
    });

    it("rejects diagnosis shorter than 5 characters", () => {
      const invalid = {
        fechaInicio: "2026-06-01",
        fechaFin: "2026-06-05",
        diagnostico: "Grip",
        medicoTratante: "Dr. Perez",
        tipo: "ENFERMEDAD",
      };
      const result = reposoSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("medicoSchema", () => {
    it("validates doctor creation form with days and cubiculo", () => {
      const valid = {
        cedula: "V-11223344",
        nombre: "Roberto",
        apellido: "García",
        especialidadId: "1",
        diasLaborables: [1, 3, 5],
        turno: "MANANA",
        cubiculo: "Consultorio 3",
        telefono: "0412-9876543",
        email: "roberto.garcia@saludmercal.gob.ve",
        activo: true,
      };
      expect(medicoSchema.safeParse(valid).success).toBe(true);
    });
  });
});
