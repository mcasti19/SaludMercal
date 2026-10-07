"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthUser } from "@/types";
import { apiLogin, apiLogout, apiMe, setAuthToken, getAuthToken } from "@/lib/api";

/** Roles con acceso al panel de administración */
export const ADMIN_ROLES = ["ADMIN", "RECEPCION", "MEDICO", "ENFERMERIA"] as const;

/** Retorna la ruta de inicio según el rol del usuario */
export function getRedirectPath(role: AuthUser["role"]): string {
  return (ADMIN_ROLES as readonly string[]).includes(role) ? "/" : "/portal";
}

/** Mapea el rol a una etiqueta legible */
function toRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    ADMIN:      "Administrador",
    RECEPCION:  "Recepción",
    MEDICO:     "Médico",
    ENFERMERIA: "Enfermería",
    EMPLEADO:   "Empleado",
  };
  return labels[role] ?? role;
}

function mapApiUser(apiUser: { id: number; name: string; username: string; email: string; role: string }): AuthUser {
  return {
    id:          String(apiUser.id),
    cedula:      "",
    nombre:      apiUser.name.split(" ")[0] ?? apiUser.name,
    apellido:    apiUser.name.split(" ").slice(1).join(" ") ?? "",
    email:       apiUser.email,
    role:        apiUser.role as AuthUser["role"],
    roleLabel:   toRoleLabel(apiUser.role),
    departamento: "",
  };
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (loginInput: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      /**
       * login — acepta email o username.
       * El token se guarda en memoria (api.ts) para no exponerlo en localStorage.
       */
      login: async (loginInput: string, password: string): Promise<boolean> => {
        set({ isLoading: true, error: null });
        try {
          const { token, user } = await apiLogin(loginInput, password);

          // Guardar token en memoria (NO en localStorage)
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

      /**
       * logout — revoca el token en el servidor y limpia estado local.
       */
      logout: async () => {
        try {
          await apiLogout();
        } catch {
          // Siempre limpiamos el estado local aunque falle la petición
        }
        setAuthToken(null);
        set({ user: null, isAuthenticated: false, error: null });
      },

      /**
       * hydrate — verifica sesión existente al recargar la página.
       * Solo funciona si el token sigue en memoria (misma pestaña).
       */
      hydrate: async () => {
        if (!getAuthToken()) {
          set({ user: null, isAuthenticated: false });
          return;
        }
        try {
          const { user } = await apiMe();
          set({ user: mapApiUser(user), isAuthenticated: true });
        } catch {
          setAuthToken(null);
          set({ user: null, isAuthenticated: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "saludmercal-auth",
      // Solo persistimos el usuario (no el token — stays in memory only)
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
