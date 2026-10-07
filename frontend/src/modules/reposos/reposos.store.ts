import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Reposo, ReposoEstado } from "@/types";

interface RepososState {
  reposos: Reposo[];
  addReposo: (reposo: Omit<Reposo, "id" | "creadoEn" | "estado" | "dias">) => void;
  updateEstado: (id: string, estado: ReposoEstado, notasAdmin?: string) => void;
  deleteReposo: (id: string) => void;
}

export const useRepososStore = create<RepososState>()(
  persist(
    (set) => ({
      reposos: [],

      addReposo: (data) =>
        set((state) => {
          const start = new Date(data.fechaInicio);
          const end = new Date(data.fechaFin);
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates

          const newReposo: Reposo = {
            ...data,
            id: `REP${String(Date.now()).slice(-6)}`,
            estado: "PENDIENTE",
            dias: diffDays,
            creadoEn: new Date().toISOString(),
          };
          return { reposos: [newReposo, ...state.reposos] };
        }),

      updateEstado: (id, estado, notasAdmin) =>
        set((state) => ({
          reposos: state.reposos.map((r) =>
            r.id === id ? { ...r, estado, notasAdmin } : r
          ),
        })),

      deleteReposo: (id) =>
        set((state) => ({
          reposos: state.reposos.filter((r) => r.id !== id),
        })),
    }),
    {
      name: "saludmercal-reposos",
    }
  )
);
