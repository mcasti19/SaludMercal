"use client";

import {
  ApiAppointment,
  apiCreateAppointment,
  apiDeleteAppointment,
  apiGetAppointments,
  apiRescheduleAppointment,
  apiTransitionAppointment,
} from "@/lib/api";
import { Cita, CitaEstado } from "@/types";
import { create } from "zustand";

const STATUS_API_TO_UI: Record<string, CitaEstado> = {
  pending: "PENDIENTE",
  confirmed: "CONFIRMADA",
  in_progress: "EN_ATENCION",
  completed: "COMPLETADA",
  cancelled: "CANCELADA",
  no_show: "CANCELADA",
};

const STATUS_UI_TO_API: Record<CitaEstado, string> = {
  PENDIENTE: "pending",
  CONFIRMADA: "confirmed",
  EN_ATENCION: "in_progress",
  COMPLETADA: "completed",
  CANCELADA: "cancelled",
};

export function getTodayLocalString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function mapApiAppointment(a: ApiAppointment): Cita {
  const patientName = a.patient
    ? `${a.patient.first_name} ${a.patient.last_name}`
    : "Paciente";
  const doctorName = a.doctor
    ? `Dr. ${a.doctor.first_name} ${a.doctor.last_name}`
    : "Médico";
  const specialtyName = a.specialty?.name ?? a.doctor?.specialty?.name ?? "";

  return {
    id: String(a.id),
    pacienteId: String(a.patient_id),
    pacienteNombre: patientName,
    pacienteCedula: a.patient?.national_id ?? "",
    medicoId: String(a.doctor_id),
    medicoNombre: doctorName,
    especialidad: specialtyName,
    fecha: a.scheduled_date,
    hora: a.start_time.slice(0, 5),
    beneficiaryId: a.beneficiary_id ? String(a.beneficiary_id) : undefined,
    beneficiary: a.beneficiary
      ? {
          id: a.beneficiary.id,
          patient_id: a.beneficiary.patient_id,
          first_name: a.beneficiary.first_name,
          last_name: a.beneficiary.last_name,
          full_name: a.beneficiary.full_name,
          relationship: a.beneficiary
            .relationship as import("@/types").ParentescoBeneficiario,
          relationship_label: a.beneficiary.relationship_label,
          national_id: a.beneficiary.national_id,
          birth_date: a.beneficiary.birth_date,
          gender: a.beneficiary.gender,
          phone: a.beneficiary.phone,
          is_active: a.beneficiary.is_active,
        }
      : undefined,
    estado: STATUS_API_TO_UI[a.status] ?? "PENDIENTE",
    motivo: a.reason,
    notas: a.notes ?? undefined,
    creadoEn: a.created_at,
  };
}

interface CitasState {
  citas: Cita[];
  isLoading: boolean;
  error: string | null;
  search: string;
  filterEstado: CitaEstado | "TODAS";
  setSearch: (search: string) => void;
  setFilterEstado: (estado: CitaEstado | "TODAS") => void;
  fetchCitas: (filters?: {
    status?: string;
    date?: string;
    search?: string;
  }) => Promise<void>;
  addCita: (data: Omit<Cita, "id" | "creadoEn">) => Promise<boolean>;
  updateCita: (id: string, data: Partial<Cita>) => Promise<boolean>;
  updateEstado: (
    id: string,
    estado: CitaEstado,
    comment?: string,
  ) => Promise<boolean>;
  deleteCita: (id: string) => Promise<boolean>;
  getCitasHoy: () => Cita[];
  getCitasByPaciente: (pacienteId: string) => Cita[];
}

export const useCitasStore = create<CitasState>()((set, get) => ({
  citas: [],
  isLoading: false,
  error: null,
  search: "",
  filterEstado: "TODAS",

  setSearch: (search) => {
    set({ search });
    get().fetchCitas({ search });
  },

  setFilterEstado: (filterEstado) => {
    set({ filterEstado });
    const statusApi =
      filterEstado === "TODAS" ? undefined : STATUS_UI_TO_API[filterEstado];
    get().fetchCitas({ status: statusApi });
  },

  fetchCitas: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const currentFilter = get().filterEstado;
      const status =
        filters?.status !== undefined
          ? filters.status
          : currentFilter !== "TODAS"
            ? STATUS_UI_TO_API[currentFilter]
            : undefined;

      const search =
        filters?.search !== undefined ? filters.search : get().search;

      const apiList = await apiGetAppointments({
        status,
        search: search || undefined,
        date: filters?.date,
      });

      set({
        citas: apiList.map(mapApiAppointment),
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al cargar citas";
      set({ isLoading: false, error: message });
    }
  },

  addCita: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const patientId = data.pacienteId
        ? parseInt(data.pacienteId, 10)
        : undefined;
      const beneficiaryId = data.beneficiaryId
        ? parseInt(data.beneficiaryId, 10)
        : undefined;
      const doctorId = parseInt(data.medicoId, 10);

      const created = await apiCreateAppointment({
        patient_id: isNaN(patientId as number) ? null : patientId,
        beneficiary_id: isNaN(beneficiaryId as number) ? null : beneficiaryId,
        doctor_id: isNaN(doctorId) ? 1 : doctorId,
        scheduled_date: data.fecha,
        start_time: data.hora,
        reason: data.motivo,
        notes: data.notas ?? null,
      });

      const mapped = mapApiAppointment(created);
      set((state) => ({
        citas: [mapped, ...state.citas],
        isLoading: false,
      }));
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al reservar cita";
      set({ isLoading: false, error: message });
      return false;
    }
  },

  updateCita: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      let updatedAppt: ApiAppointment | null = null;

      // Si cambió fecha u hora, reprogramar
      if (data.fecha && data.hora) {
        updatedAppt = await apiRescheduleAppointment(id, {
          scheduled_date: data.fecha,
          start_time: data.hora,
        });
      }

      // Si cambió de estado, transicionar
      if (data.estado) {
        const targetStatus = STATUS_UI_TO_API[data.estado];
        updatedAppt = await apiTransitionAppointment(id, {
          status: targetStatus,
          comment: data.notas || "Actualizado desde panel administrativo",
        });
      }

      if (updatedAppt) {
        const mapped = mapApiAppointment(updatedAppt);
        set((state) => ({
          citas: state.citas.map((c) => (c.id === id ? mapped : c)),
          isLoading: false,
        }));
      } else {
        set({ isLoading: false });
      }
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al actualizar cita";
      set({ isLoading: false, error: message });
      return false;
    }
  },

  updateEstado: async (id, estado, comment) => {
    set({ isLoading: true, error: null });
    try {
      const targetStatus = STATUS_UI_TO_API[estado];
      const updated = await apiTransitionAppointment(id, {
        status: targetStatus,
        comment: comment || `Estado cambiado a ${estado}`,
      });

      const mapped = mapApiAppointment(updated);
      set((state) => ({
        citas: state.citas.map((c) => (c.id === id ? mapped : c)),
        isLoading: false,
      }));
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al cambiar estado";
      set({ isLoading: false, error: message });
      return false;
    }
  },

  deleteCita: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiDeleteAppointment(id);
      set((state) => ({
        citas: state.citas.filter((c) => c.id !== id),
        isLoading: false,
      }));
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al eliminar cita";
      set({ isLoading: false, error: message });
      return false;
    }
  },

  getCitasHoy: () => {
    const today = getTodayLocalString();
    return get().citas.filter((c) => c.fecha === today);
  },

  getCitasByPaciente: (pacienteId: string) => {
    return get().citas.filter((c) => c.pacienteId === pacienteId);
  },
}));
