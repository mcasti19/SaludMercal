"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Cita, CitaEstado } from "@/types";
import { MOCK_CITAS } from "./citas.mocks";
import { generateId } from "@/lib/utils";

interface CitasState {
  citas: Cita[];
  isLoading: boolean;
  search: string;
  filterEstado: CitaEstado | "TODAS";
  setSearch: (search: string) => void;
  setFilterEstado: (estado: CitaEstado | "TODAS") => void;
  addCita: (data: Omit<Cita, "id" | "creadoEn">) => void;
  updateCita: (id: string, data: Partial<Cita>) => void;
  updateEstado: (id: string, estado: CitaEstado) => void;
  deleteCita: (id: string) => void;
  getCitasHoy: () => Cita[];
  getCitasByPaciente: (pacienteId: string) => Cita[];
}

export const useCitasStore = create<CitasState>()(
  persist(
    (set, get) => ({
      citas: MOCK_CITAS,
      isLoading: false,
      search: "",
      filterEstado: "TODAS",

      setSearch: (search) => set({ search }),
      setFilterEstado: (filterEstado) => set({ filterEstado }),

      addCita: (data) =>
        set((state) => ({
          citas: [
            ...state.citas,
            {
              ...data,
              id: `CIT${generateId()}`,
              creadoEn: new Date().toISOString(),
            },
          ],
        })),

      updateCita: (id, data) =>
        set((state) => ({
          citas: state.citas.map((c) =>
            c.id === id ? { ...c, ...data } : c
          ),
        })),

      updateEstado: (id, estado) =>
        set((state) => ({
          citas: state.citas.map((c) =>
            c.id === id ? { ...c, estado } : c
          ),
        })),

      deleteCita: (id) =>
        set((state) => ({
          citas: state.citas.filter((c) => c.id !== id),
        })),

      getCitasHoy: () => {
        const today = new Date().toISOString().split("T")[0];
        return get().citas.filter((c) => c.fecha === today);
      },

      getCitasByPaciente: (pacienteId: string) => {
        return get().citas.filter((c) => c.pacienteId === pacienteId);
      },
    }),
    {
      name: "saludmercal-citas",
    }
  )
);
