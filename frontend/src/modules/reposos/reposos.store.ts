"use client";

import { create } from "zustand";
import { Reposo, ReposoEstado } from "@/types";
import {
  apiGetMedicalLeaves,
  apiCreateMedicalLeave,
  apiReviewMedicalLeave,
  apiDeleteMedicalLeave,
  apiGetMedicalLeaveAttachmentUrl,
  ApiMedicalLeave,
} from "@/lib/api";

const TYPE_API_TO_UI: Record<string, Reposo["tipo"]> = {
  occupational: "LABORAL",
  accident: "ACCIDENTE",
  illness: "ENFERMEDAD",
  maternity: "MATERNIDAD",
};

const TYPE_UI_TO_API: Record<Reposo["tipo"], string> = {
  LABORAL: "occupational",
  ACCIDENTE: "accident",
  ENFERMEDAD: "illness",
  MATERNIDAD: "maternity",
};

const STATUS_API_TO_UI: Record<string, ReposoEstado> = {
  pending: "PENDIENTE",
  approved: "APROBADO",
  rejected: "RECHAZADO",
};

export function mapApiMedicalLeave(m: ApiMedicalLeave): Reposo {
  const patientName = m.patient
    ? `${m.patient.first_name} ${m.patient.last_name}`
    : "Empleado";
  const doctorName = m.doctor
    ? `Dr. ${m.doctor.first_name} ${m.doctor.last_name}`
    : "Médico Tratante";

  return {
    id: String(m.id),
    empleadoId: String(m.patient_id),
    empleadoNombre: patientName,
    fechaInicio: m.start_date,
    fechaFin: m.end_date,
    dias: m.days,
    diagnostico: m.diagnosis,
    medicoTratante: doctorName,
    tipo: TYPE_API_TO_UI[m.type] ?? "ENFERMEDAD",
    estado: STATUS_API_TO_UI[m.status] ?? "PENDIENTE",
    adjuntoBase64: m.has_attachment ? apiGetMedicalLeaveAttachmentUrl(m.id) : undefined,
    creadoEn: m.created_at,
    notasAdmin: m.review_notes ?? undefined,
  };
}

interface RepososState {
  reposos: Reposo[];
  isLoading: boolean;
  error: string | null;
  fetchReposos: () => Promise<void>;
  addReposo: (
    reposo: Omit<Reposo, "id" | "creadoEn" | "estado" | "dias">,
    file?: File | null
  ) => Promise<boolean>;
  updateEstado: (id: string, estado: ReposoEstado, notasAdmin?: string) => Promise<boolean>;
  deleteReposo: (id: string) => Promise<boolean>;
}

export const useRepososStore = create<RepososState>()((set, get) => ({
  reposos: [],
  isLoading: false,
  error: null,

  fetchReposos: async () => {
    set({ isLoading: true, error: null });
    try {
      const apiList = await apiGetMedicalLeaves();
      set({
        reposos: apiList.map(mapApiMedicalLeave),
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cargar reposos";
      set({ isLoading: false, error: message });
    }
  },

  addReposo: async (data, file) => {
    set({ isLoading: true, error: null });
    try {
      const typeApi = TYPE_UI_TO_API[data.tipo] ?? "illness";
      let created: ApiMedicalLeave;

      if (file) {
        const formData = new FormData();
        formData.append("type", typeApi);
        formData.append("start_date", data.fechaInicio);
        formData.append("end_date", data.fechaFin);
        formData.append("diagnosis", data.diagnostico);
        formData.append("attachment", file);
        if (data.empleadoId) {
          const patientId = parseInt(data.empleadoId, 10);
          if (!isNaN(patientId)) {
            formData.append("patient_id", String(patientId));
          }
        }
        created = await apiCreateMedicalLeave(formData);
      } else {
        const patientId = data.empleadoId ? parseInt(data.empleadoId, 10) : undefined;
        created = await apiCreateMedicalLeave({
          type: typeApi,
          start_date: data.fechaInicio,
          end_date: data.fechaFin,
          diagnosis: data.diagnostico,
          patient_id: isNaN(patientId as number) ? undefined : patientId,
        });
      }

      const mapped = mapApiMedicalLeave(created);
      set((state) => ({
        reposos: [mapped, ...state.reposos],
        isLoading: false,
      }));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al registrar reposo";
      set({ isLoading: false, error: message });
      return false;
    }
  },

  updateEstado: async (id, estado, notasAdmin) => {
    set({ isLoading: true, error: null });
    try {
      const targetStatus: "approved" | "rejected" =
        estado === "RECHAZADO" ? "rejected" : "approved";

      const updated = await apiReviewMedicalLeave(id, {
        status: targetStatus,
        review_notes: notasAdmin,
      });

      const mapped = mapApiMedicalLeave(updated);
      set((state) => ({
        reposos: state.reposos.map((r) => (r.id === id ? mapped : r)),
        isLoading: false,
      }));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al actualizar reposo";
      set({ isLoading: false, error: message });
      return false;
    }
  },

  deleteReposo: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiDeleteMedicalLeave(id);
      set((state) => ({
        reposos: state.reposos.filter((r) => r.id !== id),
        isLoading: false,
      }));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al eliminar reposo";
      set({ isLoading: false, error: message });
      return false;
    }
  },
}));
