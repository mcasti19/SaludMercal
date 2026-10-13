"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthUser } from "@/types";
import { apiLogin, apiLogout, apiMe, setAuthToken, getAuthToken, ApiUser } from "@/lib/api";

/** Roles con acceso al panel de administración */
export const ADMIN_ROLES = ["SUPERADMIN", "ADMIN", "RECEPCION", "MEDICO", "ENFERMERIA"] as const;

/** Retorna la ruta de inicio según el rol del usuario */
export function getRedirectPath(role: AuthUser["role"]): string {
  return (ADMIN_ROLES as readonly string[]).includes(role) ? "/" : "/portal";
}

/** Mapea el rol a una etiqueta legible */
function toRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    SUPERADMIN: "Super Administrador",
    ADMIN:      "Administrador de Sede",
    RECEPCION:  "Recepción",
    MEDICO:     "Médico",
    ENFERMERIA: "Enfermería",
    EMPLEADO:   "Empleado",
  };
  return labels[role] ?? role;
}

/** API role (backend enum value) → UI role identifier */
const API_ROLE_MAP: Record<string, AuthUser["role"]> = {
  super_admin:  "SUPERADMIN",
  admin:        "ADMIN",
  receptionist: "RECEPCION",
  doctor:       "MEDICO",
  nurse:        "ENFERMERIA",
  employee:     "EMPLEADO",
};

function mapApiUser(apiUser: ApiUser): AuthUser {
  const role = API_ROLE_MAP[apiUser.role] ?? "EMPLEADO";
  const nameParts = apiUser.name.trim().split(" ");
  return {
    id:          String(apiUser.id),
    cedula:      apiUser.national_id ?? "",
    nombre:      nameParts[0] ?? apiUser.name,
    apellido:    nameParts.slice(1).join(" "),
    email:       apiUser.email,
    role,
    roleLabel:   toRoleLabel(role),
    departamento: apiUser.department ?? "",
    patientId:   apiUser.patient_id ? String(apiUser.patient_id) : undefined,
    locationId:  apiUser.location_id ?? undefined,
    locationName: apiUser.location?.name ?? undefined,
    locationState: apiUser.location?.state ?? undefined,
    isHeadquarters: apiUser.location?.is_headquarters ?? false,
  };
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;
  login: (loginInput: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isHydrated: false,
      error: null,

      login: async (loginInput: string, password: string): Promise<boolean> => {
        set({ isLoading: true, error: null });
        try {
          const { token, user } = await apiLogin(loginInput, password);
          setAuthToken(token);

          set({
            user: mapApiUser(user),
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return true;
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "Error de conexión. Verifique que el servidor esté activo.";
          set({ isLoading: false, error: message });
          return false;
        }
      },

      logout: async () => {
        try {
          await apiLogout();
        } catch {
          // Limpieza garantizada aunque falle la red
        }
        setAuthToken(null);
        set({ user: null, isAuthenticated: false, error: null });
      },

      hydrate: async () => {
        const token = getAuthToken();
        if (!token) {
          set({ user: null, isAuthenticated: false, isHydrated: true });
          return;
        }

        try {
          const { user } = await apiMe();
          set({ user: mapApiUser(user), isAuthenticated: true, isHydrated: true });
        } catch {
          setAuthToken(null);
          set({ user: null, isAuthenticated: false, isHydrated: true });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "saludmercal-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Verificación de fondo al hidratar desde storage
          state.hydrate();
        } else {
          useAuthStore.setState({ isHydrated: true });
        }
      },
    }
  )
);

// Escuchar eventos globales de desautenticación emitidos por apiFetch (401)
if (typeof window !== "undefined") {
  window.addEventListener("saludmercal:unauthorized", () => {
    useAuthStore.getState().logout();
  });
}
