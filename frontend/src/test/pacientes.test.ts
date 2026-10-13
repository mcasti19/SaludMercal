import { describe, it, expect } from "vitest";
import { mapApiPatient } from "@/modules/pacientes/pacientes.store";
import { ApiPatient } from "@/lib/api";

describe("mapApiPatient", () => {
  it("correctly maps a patient located at Sede Central with full national scope", () => {
    const apiData: ApiPatient = {
      id: 1,
      national_id: "V-18765432",
      first_name: "Carlos",
      last_name: "Pérez",
      birth_date: "1988-06-15",
      gender: "M",
      phone: "0414-1234567",
      email: "carlos.perez@mercal.gob.ve",
      job_title: "Analista de Operaciones",
      blood_type: "O+",
      allergies: "Penicilina",
      emergency_contact_name: "María Pérez",
      emergency_contact_phone: "0412-9876543",
      is_active: true,
      department: {
        id: 1,
        name: "Tecnología",
      },
      location: {
        id: 1,
        name: "Sede Central (Torre Caracas)",
        code: "HQ-CARACAS",
        state: "Distrito Capital",
        is_headquarters: true,
      },
      appointments: [
        {
          id: 101,
          code: "APT-00101",
          patient_id: 1,
          doctor_id: 5,
          specialty_id: 2,
          scheduled_date: "2026-10-12",
          start_time: "08:30",
          end_time: "09:00",
          status: "completed",
          reason: "Evaluación médica ocupacional",
          notes: "Paciente en óptimas condiciones",
          created_at: "2026-10-12T08:00:00Z",
        },
      ],
      medical_leaves: [
        {
          id: 201,
          patient_id: 1,
          type: "occupational",
          start_date: "2026-10-01",
          end_date: "2026-10-03",
          days: 3,
          diagnosis: "Lumbalgia mecánica aguda",
          status: "approved",
          has_attachment: false,
          created_at: "2026-10-01T08:00:00Z",
        },
      ],
    };

    const result = mapApiPatient(apiData);

    expect(result.id).toBe("1");
    expect(result.cedula).toBe("V-18765432");
    expect(result.nombre).toBe("Carlos");
    expect(result.apellido).toBe("Pérez");
    expect(result.departamento).toBe("Tecnología");
    expect(result.isHeadquarters).toBe(true);
    expect(result.location?.state).toBe("Distrito Capital");
    expect(result.grupoSanguineo).toBe("O+");
    expect(result.alergias).toBe("Penicilina");
    expect(result.appointments).toHaveLength(1);
    expect(result.appointments?.[0].estado).toBe("COMPLETADA");
    expect(result.medical_leaves).toHaveLength(1);
    expect(result.medical_leaves?.[0].estado).toBe("APROBADO");
    expect(result.medical_leaves?.[0].tipo).toBe("LABORAL");
  });

  it("handles regional state sede without headquarters flag", () => {
    const apiData: ApiPatient = {
      id: 2,
      national_id: "V-20123456",
      first_name: "Elena",
      last_name: "Gómez",
      birth_date: "1994-03-22",
      is_active: true,
      location: {
        id: 7,
        name: "Sede Regional Carabobo",
        code: "MED-CAR",
        state: "Carabobo",
        is_headquarters: false,
      },
    };

    const result = mapApiPatient(apiData);

    expect(result.isHeadquarters).toBe(false);
    expect(result.sede).toBe("Sede Regional Carabobo");
    expect(result.location?.state).toBe("Carabobo");
  });
});
