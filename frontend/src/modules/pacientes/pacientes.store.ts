"use client";

import { create } from "zustand";
import { Paciente } from "@/types";
import {
  apiGetPatients,
  apiCreatePatient,
  apiUpdatePatient,
  apiDeletePatient,
  apiGetDepartments,
  ApiPatient,
  ApiCatalogItem,
} from "@/lib/api";

export function mapApiPatient(p: ApiPatient): Paciente {
  return {
    id: String(p.id),
    cedula: p.national_id,
    nombre: p.first_name,
    apellido: p.last_name,
    departamento: p.department?.name ?? p.job_title ?? "General",
    telefono: p.phone ?? "",
    email: p.email ?? "",
    fechaNacimiento: p.birth_date,
    estado: p.is_active ? "ACTIVO" : "INACTIVO",
  };
}

interface PacientesState {
  pacientes: Paciente[];
  departments: ApiCatalogItem[];
  isLoading: boolean;
  error: string | null;
  search: string;
  setSearch: (search: string) => void;
  fetchPacientes: (searchQuery?: string) => Promise<void>;
  fetchDepartments: () => Promise<void>;
  addPaciente: (data: Omit<Paciente, "id">) => Promise<boolean>;
  updatePaciente: (id: string, data: Partial<Paciente>) => Promise<boolean>;
  deletePaciente: (id: string) => Promise<boolean>;
}

export const usePacientesStore = create<PacientesState>()((set, get) => ({
  pacientes: [],
  departments: [],
  isLoading: false,
  error: null,
  search: "",

  setSearch: (search) => {
    set({ search });
    get().fetchPacientes(search);
  },

  fetchDepartments: async () => {
    try {
      const departments = await apiGetDepartments();
      set({ departments });
    } catch {
      // Si falla, se mantiene la lista actual
    }
  },

  fetchPacientes: async (searchQuery) => {
    set({ isLoading: true, error: null });
    try {
      const query = searchQuery !== undefined ? searchQuery : get().search;
      const apiList = await apiGetPatients({ search: query || undefined });
      set({
        pacientes: apiList.map(mapApiPatient),
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cargar pacientes";
      set({ isLoading: false, error: message });
    }
  },

  addPaciente: async (data) => {
    set({ isLoading: true, error: null });
    try {
      // Buscar departamento por nombre si existe en el catálogo
      const depObj = get().departments.find(
        (d) => d.name.toLowerCase() === data.departamento.toLowerCase()
      );

      const created = await apiCreatePatient({
        national_id: data.cedula,
        first_name: data.nombre,
        last_name: data.apellido,
        birth_date: data.fechaNacimiento,
        phone: data.telefono || null,
        email: data.email || null,
        job_title: data.departamento,
        department_id: depObj?.id ?? null,
        is_active: data.estado !== "INACTIVO",
      });

      const mapped = mapApiPatient(created);
      set((state) => ({
        pacientes: [mapped, ...state.pacientes],
        isLoading: false,
      }));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al crear paciente";
      set({ isLoading: false, error: message });
      return false;
    }
  },

  updatePaciente: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const depObj = data.departamento
        ? get().departments.find(
            (d) => d.name.toLowerCase() === data.departamento!.toLowerCase()
          )
        : undefined;

      const updated = await apiUpdatePatient(id, {
        national_id: data.cedula,
        first_name: data.nombre,
        last_name: data.apellido,
        birth_date: data.fechaNacimiento,
        phone: data.telefono,
        email: data.email,
        job_title: data.departamento,
        department_id: depObj?.id,
        is_active: data.estado ? data.estado !== "INACTIVO" : undefined,
      });

      const mapped = mapApiPatient(updated);
      set((state) => ({
        pacientes: state.pacientes.map((p) => (p.id === id ? mapped : p)),
        isLoading: false,
      }));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al actualizar paciente";
      set({ isLoading: false, error: message });
      return false;
    }
  },

  deletePaciente: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiDeletePatient(id);
      set((state) => ({
        pacientes: state.pacientes.filter((p) => p.id !== id),
        isLoading: false,
      }));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al eliminar paciente";
      set({ isLoading: false, error: message });
      return false;
    }
  },
}));
