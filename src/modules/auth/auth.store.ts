"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthUser } from "@/types";
import { MOCK_USERS, ADMIN_ROLES } from "./auth.mocks";

/** Returns the home path for a given role */
export function getRedirectPath(role: AuthUser["role"]): string {
  return (ADMIN_ROLES as readonly string[]).includes(role) ? "/" : "/portal";
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (cedula: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (cedula: string, password: string): Promise<boolean> => {
        set({ isLoading: true, error: null });

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Mock authentication — any password "mercal2024" works for any mock user
        if (password !== "mercal2024") {
          set({
            isLoading: false,
            error: "Credenciales incorrectas. Verifique su cédula y contraseña.",
          });
          return false;
        }

        const foundUser = MOCK_USERS.find((u) => u.cedula === cedula);

        if (!foundUser) {
          set({
            isLoading: false,
            error: "Cédula no registrada en el sistema.",
          });
          return false;
        }

        set({
          user: foundUser,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return true;
      },

      logout: () => {
        set({ user: null, isAuthenticated: false, error: null });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "saludmercal-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
