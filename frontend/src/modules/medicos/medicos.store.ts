import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Medico, Especialidad } from "@/types";
import { MOCK_MEDICOS, MOCK_ESPECIALIDADES } from "./medicos.mocks";

interface MedicosState {
  medicos: Medico[];
  especialidades: Especialidad[];
  // Actions
  addMedico: (medico: Omit<Medico, "id" | "creadoEn">) => void;
  updateMedico: (id: string, data: Partial<Omit<Medico, "id">>) => void;
  toggleActivo: (id: string) => void;
  deleteMedico: (id: string) => void;
}

export const useMedicosStore = create<MedicosState>()(
  persist(
    (set) => ({
      medicos: MOCK_MEDICOS,
      especialidades: MOCK_ESPECIALIDADES,

      addMedico: (data) =>
        set((state) => {
          const especialidad = state.especialidades.find(
            (e) => e.id === data.especialidadId
          );
          const newMedico: Medico = {
            ...data,
            id: `MED${String(Date.now()).slice(-6)}`,
            especialidadNombre: especialidad?.nombre ?? data.especialidadId,
            creadoEn: new Date().toISOString(),
          };
          return { medicos: [...state.medicos, newMedico] };
        }),

      updateMedico: (id, data) =>
        set((state) => ({
          medicos: state.medicos.map((m) => {
            if (m.id !== id) return m;
            const especialidad = data.especialidadId
              ? state.especialidades.find((e) => e.id === data.especialidadId)
              : null;
            return {
              ...m,
              ...data,
              ...(especialidad ? { especialidadNombre: especialidad.nombre } : {}),
            };
          }),
        })),

      toggleActivo: (id) =>
        set((state) => ({
          medicos: state.medicos.map((m) =>
            m.id === id ? { ...m, activo: !m.activo } : m
          ),
        })),

      deleteMedico: (id) =>
        set((state) => ({
          medicos: state.medicos.filter((m) => m.id !== id),
        })),
    }),
    {
      name: "saludmercal-medicos",
    }
  )
);
