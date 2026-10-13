import { describe, it, expect } from "vitest";
import { generarSlotsDisponibles } from "@/lib/date-utils";
import { Medico, Cita } from "@/types";

describe("Appointment Slot Generation (src/lib/date-utils.ts)", () => {
  const dummyMedico: Medico = {
    id: "1",
    nombre: "Carlos",
    apellido: "Mendoza",
    especialidadId: "1",
    especialidadNombre: "Medicina General",
    diasLaborables: [1, 2, 3, 4, 5],
    turno: "MANANA",
    horaInicio: "08:00",
    horaFin: "10:00",
    cubiculo: "Consultorio 1",
    activo: true,
  };

  it("returns empty slots if doctor or date are missing", () => {
    expect(generarSlotsDisponibles(undefined, new Date(), [])).toEqual([]);
    expect(generarSlotsDisponibles(dummyMedico, undefined, [])).toEqual([]);
  });

  it("returns empty slots if requested date is in the past", () => {
    const pastDate = new Date(2020, 0, 1);
    const slots = generarSlotsDisponibles(dummyMedico, pastDate, []);
    expect(slots).toEqual([]);
  });

  it("generates 30-minute intervals between start and end time", () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    futureDate.setMonth(5);
    futureDate.setDate(10);

    const slots = generarSlotsDisponibles(dummyMedico, futureDate, []);
    // From 08:00 to 10:00 with 30-min intervals: 08:00, 08:30, 09:00, 09:30
    expect(slots).toEqual(["08:00", "08:30", "09:00", "09:30"]);
  });

  it("filters out slots already booked by existing active appointments", () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    futureDate.setMonth(5);
    futureDate.setDate(10);

    const year = futureDate.getFullYear();
    const dateStr = `${year}-06-10`;

    const existingAppointments: Cita[] = [
      {
        id: "101",
        pacienteId: "1",
        pacienteNombre: "Juan Perez",
        pacienteCedula: "V-12345678",
        medicoId: "1",
        medicoNombre: "Carlos Mendoza",
        especialidad: "Medicina General",
        fecha: dateStr,
        hora: "08:30",
        estado: "CONFIRMADA",
        motivo: "Control de rutina",
        creadoEn: "2026-06-01T10:00:00Z",
      },
      {
        id: "102",
        pacienteId: "2",
        pacienteNombre: "Maria Gomez",
        pacienteCedula: "V-87654321",
        medicoId: "1",
        medicoNombre: "Carlos Mendoza",
        especialidad: "Medicina General",
        fecha: dateStr,
        hora: "09:00",
        estado: "CANCELADA", // Cancelled should NOT block the slot
        motivo: "Dolor de cabeza",
        creadoEn: "2026-06-01T10:00:00Z",
      },
    ];

    const slots = generarSlotsDisponibles(dummyMedico, futureDate, existingAppointments);
    // 08:30 is CONFIRMADA so excluded; 09:00 is CANCELADA so included
    expect(slots).toContain("08:00");
    expect(slots).not.toContain("08:30");
    expect(slots).toContain("09:00");
    expect(slots).toContain("09:30");
  });
});
