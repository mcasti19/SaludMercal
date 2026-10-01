"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Paciente } from "@/types";
import { MOCK_PACIENTES } from "./pacientes.mocks";
import { generateId } from "@/lib/utils";

interface PacientesState {
  pacientes: Paciente[];
  isLoading: boolean;
  search: string;
  setSearch: (search: string) => void;
  addPaciente: (data: Omit<Paciente, "id">) => void;
  updatePaciente: (id: string, data: Partial<Paciente>) => void;
  deletePaciente: (id: string) => void;
}

export const usePacientesStore = create<PacientesState>()(
  persist(
    (set) => ({
      pacientes: MOCK_PACIENTES,
      isLoading: false,
      search: "",

      setSearch: (search) => set({ search }),

      addPaciente: (data) =>
        set((state) => ({
          pacientes: [
            ...state.pacientes,
            { ...data, id: `PAC${generateId()}` },
          ],
        })),

      updatePaciente: (id, data) =>
        set((state) => ({
          pacientes: state.pacientes.map((p) =>
            p.id === id ? { ...p, ...data } : p
          ),
        })),

      deletePaciente: (id) =>
        set((state) => ({
          pacientes: state.pacientes.filter((p) => p.id !== id),
        })),
    }),
    {
      name: "saludmercal-pacientes",
    }
  )
);
