"use client";

import { create } from "zustand";
import { Examen } from "@/types";
import {
  apiCreateMedicalExam,
  apiDeleteMedicalExam,
  apiGetPatientMedicalExams,
  ApiMedicalExam,
} from "@/lib/api";

export const EXAMEN_ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png"] as const;
export const EXAMEN_MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
export const EXAMEN_MAX_FILES = 10;

export function mapApiExam(e: ApiMedicalExam): Examen {
  return {
    id: String(e.id),
    pacienteId: String(e.patient_id),
    especialidadId: String(e.specialty_id),
    especialidadNombre: e.specialty?.name ?? "Sin especialidad",
    citaId: e.appointment_id ? String(e.appointment_id) : undefined,
    titulo: e.title,
    fecha: e.exam_date,
    notas: e.notes ?? undefined,
    subidoPor: e.uploader_name ?? undefined,
    archivos: (e.files ?? []).map((f) => ({
      id: String(f.id),
      nombre: f.original_name,
      mimeType: f.mime_type,
      tamano: f.size,
    })),
  };
}

export interface NuevoExamenInput {
  especialidadId: string;
  titulo: string;
  fecha: string;
  citaId?: string;
  notas?: string;
  archivos: File[];
}

interface ExamenesState {
  examenes: Examen[];
  isLoading: boolean;
  error: string | null;
  fetchExamenes: (patientId: string) => Promise<void>;
  addExamen: (patientId: string, input: NuevoExamenInput) => Promise<boolean>;
  deleteExamen: (id: string) => Promise<boolean>;
}

const byDateDesc = (a: Examen, b: Examen) => b.fecha.localeCompare(a.fecha);

export const useExamenesStore = create<ExamenesState>()((set) => ({
  examenes: [],
  isLoading: false,
  error: null,

  fetchExamenes: async (patientId) => {
    set({ isLoading: true, error: null });
    try {
      const list = await apiGetPatientMedicalExams(patientId);
      set({ examenes: list.map(mapApiExam), isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : "Error al cargar los exámenes",
      });
    }
  },

  addExamen: async (patientId, input) => {
    set({ error: null });
    try {
      const form = new FormData();
      form.append("specialty_id", input.especialidadId);
      form.append("title", input.titulo);
      form.append("exam_date", input.fecha);
      if (input.citaId) form.append("appointment_id", input.citaId);
      if (input.notas) form.append("notes", input.notas);
      input.archivos.forEach((file) => form.append("files[]", file));

      const created = mapApiExam(await apiCreateMedicalExam(patientId, form));
      set((state) => ({ examenes: [created, ...state.examenes].sort(byDateDesc) }));
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Error al cargar el examen" });
      return false;
    }
  },

  deleteExamen: async (id) => {
    set({ error: null });
    try {
      await apiDeleteMedicalExam(id);
      set((state) => ({ examenes: state.examenes.filter((e) => e.id !== id) }));
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Error al eliminar el examen" });
      return false;
    }
  },
}));

