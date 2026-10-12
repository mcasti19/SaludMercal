"use client";

import { create } from "zustand";
import { Medico, Especialidad } from "@/types";
import {
  apiGetDoctors,
  apiGetSpecialties,
  apiCreateDoctor,
  apiUpdateDoctor,
  apiDeleteDoctor,
  ApiDoctor,
  ApiCatalogItem,
  ApiDoctorSchedule,
} from "@/lib/api";

export function mapApiDoctor(d: ApiDoctor): Medico {
  const schedules = d.schedules ?? [];
  const days = schedules.map((s) => s.day_of_week);
  const startTime = schedules[0]?.start_time ? schedules[0].start_time.slice(0, 5) : "08:00";
  const endTime = schedules[0]?.end_time ? schedules[0].end_time.slice(0, 5) : "12:00";
  const startHour = parseInt(startTime.split(":")[0], 10);
  const turno = startHour < 12 ? "MANANA" : startHour < 18 ? "TARDE" : "NOCTURNO";

  return {
    id: String(d.id),
    cedula: d.national_id ?? undefined,
    nombre: d.first_name,
    apellido: d.last_name,
    especialidadId: String(d.specialty_id),
    especialidadNombre: d.specialty?.name ?? "",
    diasLaborables: days.length > 0 ? days : [1, 2, 3, 4, 5],
    turno,
    horaInicio: startTime,
    horaFin: endTime,
    cubiculo: d.office ?? "01",
    telefono: d.phone ?? undefined,
    email: d.email ?? undefined,
    activo: d.is_active,
    fotoPerfil: d.photo_path ?? undefined,
    creadoEn: d.id ? new Date().toISOString() : undefined,
  };
}

export function mapApiSpecialty(s: ApiCatalogItem): Especialidad {
  return {
    id: String(s.id),
    nombre: s.name,
    descripcion: s.description ?? undefined,
  };
}

interface MedicosState {
  medicos: Medico[];
  especialidades: Especialidad[];
  isLoading: boolean;
  error: string | null;
  fetchMedicos: () => Promise<void>;
  fetchEspecialidades: () => Promise<void>;
  addMedico: (medico: Omit<Medico, "id" | "creadoEn">) => Promise<boolean>;
  updateMedico: (id: string, data: Partial<Omit<Medico, "id">>) => Promise<boolean>;
  toggleActivo: (id: string) => Promise<boolean>;
  deleteMedico: (id: string) => Promise<boolean>;
}

export const useMedicosStore = create<MedicosState>()((set, get) => ({
  medicos: [],
  especialidades: [],
  isLoading: false,
  error: null,

  fetchEspecialidades: async () => {
    try {
      const apiSpecialties = await apiGetSpecialties();
      set({ especialidades: apiSpecialties.map(mapApiSpecialty) });
    } catch {
      // Ignorar fallo de red puntual
    }
  },

  fetchMedicos: async () => {
    set({ isLoading: true, error: null });
    try {
      // Garantizar que las especialidades estén cargadas
      if (get().especialidades.length === 0) {
        await get().fetchEspecialidades();
      }

      const apiList = await apiGetDoctors();
      set({
        medicos: apiList.map(mapApiDoctor),
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cargar médicos";
      set({ isLoading: false, error: message });
    }
  },

  addMedico: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const specialtyId = parseInt(data.especialidadId, 10);
      const schedules: ApiDoctorSchedule[] = (data.diasLaborables || [1, 2, 3, 4, 5]).map(
        (day) => ({
          day_of_week: day,
          start_time: data.horaInicio || "08:00",
          end_time: data.horaFin || "12:00",
        })
      );

      const created = await apiCreateDoctor({
        specialty_id: isNaN(specialtyId) ? 1 : specialtyId,
        first_name: data.nombre,
        last_name: data.apellido,
        national_id: data.cedula || null,
        phone: data.telefono || null,
        email: data.email || null,
        office: data.cubiculo || "01",
        is_active: data.activo,
        slot_duration_minutes: 30,
        schedules,
      });

      const mapped = mapApiDoctor(created);
      set((state) => ({
        medicos: [mapped, ...state.medicos],
        isLoading: false,
      }));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al registrar médico";
      set({ isLoading: false, error: message });
      return false;
    }
  },

  updateMedico: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const specialtyId = data.especialidadId ? parseInt(data.especialidadId, 10) : undefined;
      const schedules = data.diasLaborables
        ? data.diasLaborables.map((day) => ({
            day_of_week: day,
            start_time: data.horaInicio || "08:00",
            end_time: data.horaFin || "12:00",
          }))
        : undefined;

      const updated = await apiUpdateDoctor(id, {
        specialty_id: specialtyId,
        first_name: data.nombre,
        last_name: data.apellido,
        national_id: data.cedula,
        phone: data.telefono,
        email: data.email,
        office: data.cubiculo,
        is_active: data.activo,
        schedules,
      });

      const mapped = mapApiDoctor(updated);
      set((state) => ({
        medicos: state.medicos.map((m) => (m.id === id ? mapped : m)),
        isLoading: false,
      }));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al actualizar médico";
      set({ isLoading: false, error: message });
      return false;
    }
  },

  toggleActivo: async (id) => {
    const medico = get().medicos.find((m) => m.id === id);
    if (!medico) return false;
    return get().updateMedico(id, { activo: !medico.activo });
  },

  deleteMedico: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiDeleteDoctor(id);
      set((state) => ({
        medicos: state.medicos.filter((m) => m.id !== id),
        isLoading: false,
      }));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al eliminar médico";
      set({ isLoading: false, error: message });
      return false;
    }
  },
}));
