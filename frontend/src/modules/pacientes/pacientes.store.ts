"use client";

import {
  ApiCatalogItem,
  apiCreatePatient,
  apiDeletePatient,
  apiGetDepartments,
  apiGetPatient,
  apiGetPatients,
  ApiPatient,
  apiUpdatePatient,
} from "@/lib/api";
import { mapApiAppointment } from "@/modules/citas/citas.store";
import { mapApiMedicalLeave } from "@/modules/reposos/reposos.store";
import { Paciente } from "@/types";
import { create } from "zustand";

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
    location: p.location
      ? {
          id: String(p.location.id),
          name: p.location.name,
          state: p.location.state ?? undefined,
          is_headquarters: Boolean(p.location.is_headquarters),
        }
      : undefined,
    sede:
      p.location?.name ??
      (p.location_id ? `Sede #${p.location_id}` : undefined),
    isHeadquarters: Boolean(p.location?.is_headquarters),
    enComision: Boolean(p.is_visiting),
    fuente: p.source,
    empleoActivo: p.employment_active ?? null,
    cargo: p.job_title ?? undefined,
    grupoSanguineo: p.blood_type ?? undefined,
    alergias: p.allergies ?? undefined,
    contactoEmergenciaNombre: p.emergency_contact_name ?? undefined,
    contactoEmergenciaTelefono: p.emergency_contact_phone ?? undefined,
    beneficiaries:
      p.beneficiaries?.map((b) => ({
        id: b.id,
        patient_id: b.patient_id,
        first_name: b.first_name,
        last_name: b.last_name,
        full_name: b.full_name,
        relationship:
          b.relationship as import("@/types").ParentescoBeneficiario,
        relationship_label: b.relationship_label,
        national_id: b.national_id,
        birth_date: b.birth_date,
        gender: b.gender,
        phone: b.phone,
        is_active: b.is_active,
      })) ?? [],
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
      const message =
        err instanceof Error ? err.message : "Error al cargar pacientes";
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
      const message =
        err instanceof Error
          ? err.message
          : "Error al cargar datos del paciente";
      set({ isLoading: false, error: message, currentPaciente: null });
      return null;
    }
  },

  addPaciente: async (data) => {
    set({ isLoading: true, error: null });
    try {
      // Buscar departamento por nombre si existe en el catálogo
      const depObj = get().departments.find(
        (d) => d.name.toLowerCase() === data.departamento.toLowerCase(),
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
      const message =
        err instanceof Error ? err.message : "Error al crear paciente";
      set({ isLoading: false, error: message });
      return false;
    }
  },

  updatePaciente: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const depObj = data.departamento
        ? get().departments.find(
            (d) => d.name.toLowerCase() === data.departamento!.toLowerCase(),
          )
        : undefined;

      const updated = await apiUpdatePatient(id, {
        national_id: data.cedula,
        first_name: data.nombre,
        last_name: data.apellido,
        birth_date: data.fechaNacimiento,
        phone: data.telefono,
        email: data.email,
        job_title: data.cargo ?? data.departamento,
        department_id: depObj?.id,
        is_active: data.estado ? data.estado !== "INACTIVO" : undefined,
        blood_type: data.grupoSanguineo,
        allergies: data.alergias,
        emergency_contact_name: data.contactoEmergenciaNombre,
        emergency_contact_phone: data.contactoEmergenciaTelefono,
        beneficiaries: data.beneficiaries?.map((b) => ({
          id:
            typeof b.id === "number"
              ? b.id
              : typeof b.id === "string" && !isNaN(Number(b.id))
                ? Number(b.id)
                : undefined,
          first_name: b.first_name,
          last_name: b.last_name,
          relationship: b.relationship,
          national_id: b.national_id || null,
          birth_date: b.birth_date || null,
          gender: b.gender || null,
          phone: b.phone || null,
          is_active: b.is_active !== false,
          _delete: b._delete,
        })),
      });

      const mapped = mapApiPatient(updated);
      set((state) => ({
        pacientes: state.pacientes.map((p) => (p.id === id ? mapped : p)),
        currentPaciente:
          state.currentPaciente?.id === id ? mapped : state.currentPaciente,
        isLoading: false,
      }));
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al actualizar paciente";
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
      const message =
        err instanceof Error ? err.message : "Error al eliminar paciente";
      set({ isLoading: false, error: message });
      return false;
    }
  },
}));
