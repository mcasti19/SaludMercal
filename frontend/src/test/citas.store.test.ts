import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCitasStore, mapApiAppointment, getTodayLocalString } from "@/modules/citas/citas.store";
import * as api from "@/lib/api";
import { ApiAppointment } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  apiGetAppointments: vi.fn(),
  apiCreateAppointment: vi.fn(),
  apiRescheduleAppointment: vi.fn(),
  apiTransitionAppointment: vi.fn(),
  apiDeleteAppointment: vi.fn(),
}));

describe("Citas Store (src/modules/citas/citas.store.ts)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCitasStore.setState({
      citas: [],
      isLoading: false,
      error: null,
      search: "",
      filterEstado: "TODAS",
    });
  });

  describe("getTodayLocalString", () => {
    it("returns formatted date YYYY-MM-DD for today", () => {
      const today = getTodayLocalString();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("mapApiAppointment", () => {
    it("correctly maps backend API appointment to UI interface", () => {
      const apiItem: ApiAppointment = {
        id: 42,
        code: "CIT-2026-00042",
        patient_id: 10,
        doctor_id: 5,
        specialty_id: 1,
        scheduled_date: "2026-06-20",
        start_time: "08:30:00",
        end_time: "09:00:00",
        status: "confirmed",
        reason: "Chequeo médico de rutina",
        notes: "Paciente en ayunas",
        created_at: "2026-06-01T12:00:00Z",
        patient: {
          id: 10,
          first_name: "Elena",
          last_name: "Torres",
          national_id: "V-20123456",
          birth_date: "1995-05-10",
          is_active: true,
        },
        doctor: {
          id: 5,
          specialty_id: 1,
          first_name: "Alberto",
          last_name: "Morales",
          specialty: { id: 1, name: "Cardiología" },
          slot_duration_minutes: 30,
          is_active: true,
        },
      };

      const mapped = mapApiAppointment(apiItem);

      expect(mapped.id).toBe("42");
      expect(mapped.pacienteId).toBe("10");
      expect(mapped.pacienteNombre).toBe("Elena Torres");
      expect(mapped.pacienteCedula).toBe("V-20123456");
      expect(mapped.medicoNombre).toBe("Dr. Alberto Morales");
      expect(mapped.especialidad).toBe("Cardiología");
      expect(mapped.hora).toBe("08:30");
      expect(mapped.estado).toBe("CONFIRMADA");
      expect(mapped.motivo).toBe("Chequeo médico de rutina");
    });
  });

  describe("store actions", () => {
    it("fetches appointments and updates state", async () => {
      const mockApiList: ApiAppointment[] = [
        {
          id: 1,
          code: "CIT-2026-00001",
          patient_id: 10,
          doctor_id: 5,
          specialty_id: 1,
          scheduled_date: "2026-06-20",
          start_time: "09:00:00",
          end_time: "09:30:00",
          status: "pending",
          reason: "Dolor en la rodilla",
          created_at: "2026-06-01T12:00:00Z",
        },
      ];

      vi.mocked(api.apiGetAppointments).mockResolvedValueOnce(mockApiList);

      await useCitasStore.getState().fetchCitas();

      const state = useCitasStore.getState();
      expect(state.citas).toHaveLength(1);
      expect(state.citas[0].id).toBe("1");
      expect(state.citas[0].estado).toBe("PENDIENTE");
      expect(state.isLoading).toBe(false);
    });

    it("filters appointments by patient ID with getCitasByPaciente", () => {
      useCitasStore.setState({
        citas: [
          {
            id: "1",
            pacienteId: "10",
            pacienteNombre: "Elena",
            pacienteCedula: "V-1",
            medicoId: "5",
            medicoNombre: "Dr. Alberto",
            especialidad: "Cardiología",
            fecha: "2026-06-20",
            hora: "09:00",
            estado: "CONFIRMADA",
            motivo: "Consulta",
            creadoEn: "2026-06-01",
          },
          {
            id: "2",
            pacienteId: "20",
            pacienteNombre: "Pedro",
            pacienteCedula: "V-2",
            medicoId: "5",
            medicoNombre: "Dr. Alberto",
            especialidad: "Cardiología",
            fecha: "2026-06-20",
            hora: "10:00",
            estado: "PENDIENTE",
            motivo: "Consulta",
            creadoEn: "2026-06-01",
          },
        ],
      });

      const patient10Citas = useCitasStore.getState().getCitasByPaciente("10");
      expect(patient10Citas).toHaveLength(1);
      expect(patient10Citas[0].id).toBe("1");
    });
  });
});
