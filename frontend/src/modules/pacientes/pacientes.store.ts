"use client";

import { create } from "zustand";
import { Paciente } from "@/types";
import {
  apiGetPatients,
  apiGetPatient,
  apiCreatePatient,
  apiUpdatePatient,
  apiDeletePatient,
  apiGetDepartments,
  ApiPatient,
  ApiCatalogItem,
} from "@/lib/api";
import { mapApiAppointment } from "@/modules/citas/citas.store";
import { mapApiMedicalLeave } from "@/modules/reposos/reposos.store";

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
    location: p.location ? {
      id: String(p.location.id),
      name: p.location.name,
      state: p.location.state ?? undefined,
      is_headquarters: Boolean(p.location.is_headquarters),
    } : undefined,
    sede: p.location?.name ?? (p.location_id ? `Sede #${p.location_id}` : undefined),
    isHeadquarters: Boolean(p.location?.is_headquarters),
    cargo: p.job_title ?? undefined,
    grupoSanguineo: p.blood_type ?? undefined,
    alergias: p.allergies ?? undefined,
    contactoEmergenciaNombre: p.emergency_contact_name ?? undefined,
    contactoEmergenciaTelefono: p.emergency_contact_phone ?? undefined,
    appointments: p.appointments?.map(mapApiAppointment),
    medical_leaves: p.medical_leaves?.map(mapApiMedicalLeave),
  };
}

interface PacientesState {
  pacientes: Paciente[];
  currentPaciente: Paciente | null;
  departments: ApiCatalogItem[];
  isLoading: boolean;
  error: string | null;
  search: string;
  setSearch: (search: string) => void;
  fetchPacientes: (searchQuery?: string) => Promise<void>;
  fetchPacienteById: (id: string) => Promise<Paciente | null>;
  fetchDepartments: () => Promise<void>;
  addPaciente: (data: Omit<Paciente, "id">) => Promise<boolean>;
  updatePaciente: (id: string, data: Partial<Paciente>) => Promise<boolean>;
  deletePaciente: (id: string) => Promise<boolean>;
}

export const usePacientesStore = create<PacientesState>()((set, get) => ({
  pacientes: [],
  currentPaciente: null,
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

  fetchPacienteById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const apiItem = await apiGetPatient(id);
      const mapped = mapApiPatient(apiItem);
      set({ currentPaciente: mapped, isLoading: false, error: null });
      return mapped;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cargar datos del paciente";
      set({ isLoading: false, error: message, currentPaciente: null });
      return null;
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
