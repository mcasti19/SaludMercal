"use client";

import {
  ApiCatalogItem,
  ApiUser,
  CreateUserData,
  UpdateUserData,
  apiCreateUser,
  apiDeleteUser,
  apiGetLocations,
  apiGetUsers,
  apiResetUserPassword,
  apiUpdateUser,
} from "@/lib/api";
import { create } from "zustand";

interface UsuariosState {
  users: ApiUser[];
  locations: ApiCatalogItem[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  search: string;
  roleFilter: string;
  locationFilter: string;

  fetchUsers: () => Promise<void>;
  fetchLocations: () => Promise<void>;
  createUser: (data: CreateUserData) => Promise<boolean>;
  updateUser: (id: number, data: UpdateUserData) => Promise<boolean>;
  deleteUser: (id: number) => Promise<boolean>;
  resetPassword: (id: number, password: string) => Promise<boolean>;
  toggleActive: (id: number, currentStatus: boolean) => Promise<boolean>;
  setSearch: (search: string) => void;
  setRoleFilter: (role: string) => void;
  setLocationFilter: (locationId: string) => void;
  clearError: () => void;
}

export const useUsuariosStore = create<UsuariosState>((set, get) => ({
  users: [],
  locations: [],
  isLoading: false,
  isSaving: false,
  error: null,
  search: "",
  roleFilter: "",
  locationFilter: "",

  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const users = await apiGetUsers();
      set({ users: users ?? [], isLoading: false });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Error al cargar usuarios";
      set({ error: msg, isLoading: false });
    }
  },

  fetchLocations: async () => {
    try {
      const locations = await apiGetLocations();
      set({ locations: locations ?? [] });
    } catch {
      // catálogo no crítico
    }
  },

  createUser: async (data: CreateUserData): Promise<boolean> => {
    set({ isSaving: true, error: null });
    try {
      const res = await apiCreateUser(data);
      set((state) => ({
        users: [res.data, ...state.users],
        isSaving: false,
      }));
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al crear usuario";
      set({ error: msg, isSaving: false });
      return false;
    }
  },

  updateUser: async (id: number, data: UpdateUserData): Promise<boolean> => {
    set({ isSaving: true, error: null });
    try {
      const res = await apiUpdateUser(id, data);
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? res.data : u)),
        isSaving: false,
      }));
      return true;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Error al actualizar usuario";
      set({ error: msg, isSaving: false });
      return false;
    }
  },

  deleteUser: async (id: number): Promise<boolean> => {
    set({ isSaving: true, error: null });
    try {
      await apiDeleteUser(id);
      set((state) => ({
        users: state.users.filter((u) => u.id !== id),
        isSaving: false,
      }));
      return true;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Error al eliminar usuario";
      set({ error: msg, isSaving: false });
      return false;
    }
  },

  resetPassword: async (id: number, password: string): Promise<boolean> => {
    set({ isSaving: true, error: null });
    try {
      await apiResetUserPassword(id, password);
      // Actualizar el estado local para reflejar que debe cambiar contraseña
      set((state) => ({
        users: state.users.map((u) =>
          u.id === id ? { ...u, must_change_password: true } : u,
        ),
        isSaving: false,
      }));
      return true;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Error al restablecer contraseña";
      set({ error: msg, isSaving: false });
      return false;
    }
  },

  toggleActive: async (
    id: number,
    currentStatus: boolean,
  ): Promise<boolean> => {
    set({ error: null });
    try {
      const res = await apiUpdateUser(id, { is_active: !currentStatus });
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? res.data : u)),
      }));
      return true;
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Error al modificar estado de cuenta";
      set({ error: msg });
      return false;
    }
  },

  setSearch: (search: string) => set({ search }),
  setRoleFilter: (roleFilter: string) => set({ roleFilter }),
  setLocationFilter: (locationFilter: string) => set({ locationFilter }),
  clearError: () => set({ error: null }),
}));
