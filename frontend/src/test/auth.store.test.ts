import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuthStore, getRedirectPath } from "@/modules/auth/auth.store";
import * as api from "@/lib/api";

vi.mock("@/lib/api", () => ({
  apiLogin: vi.fn(),
  apiLogout: vi.fn(),
  apiMe: vi.fn(),
  setAuthToken: vi.fn(),
  getAuthToken: vi.fn(),
}));

describe("Auth Store & Redirection (src/modules/auth/auth.store.ts)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isHydrated: true,
      error: null,
    });
  });

  describe("getRedirectPath", () => {
    it("redirects administrative roles to dashboard ('/')", () => {
      expect(getRedirectPath("SUPERADMIN")).toBe("/");
      expect(getRedirectPath("ADMIN")).toBe("/");
      expect(getRedirectPath("RECEPCION")).toBe("/");
      expect(getRedirectPath("MEDICO")).toBe("/");
      expect(getRedirectPath("ENFERMERIA")).toBe("/");
    });

    it("redirects employees to self-service portal ('/portal')", () => {
      expect(getRedirectPath("EMPLEADO")).toBe("/portal");
    });
  });

  describe("login action", () => {
    it("successfully logs in, saves user info and sets isAuthenticated to true", async () => {
      vi.mocked(api.apiLogin).mockResolvedValueOnce({
        token: "fake-jwt-token",
        user: {
          id: 1,
          username: "house",
          name: "Dr. Gregory House",
          email: "house@saludmercal.gob.ve",
          role: "doctor",
          department: "Diagnóstico",
          national_id: "V-12345678",
          is_active: true,
          must_change_password: false,
        },
      });

      const success = await useAuthStore.getState().login("house@saludmercal.gob.ve", "secret123");

      expect(success).toBe(true);
      expect(api.setAuthToken).toHaveBeenCalledWith("fake-jwt-token");
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.role).toBe("MEDICO");
      expect(state.user?.nombre).toBe("Dr.");
      expect(state.error).toBeNull();
    });

    it("handles login failure and records human-readable error", async () => {
      vi.mocked(api.apiLogin).mockRejectedValueOnce(new Error("Credenciales inválidas"));

      const success = await useAuthStore.getState().login("wrong@user.com", "wrongpass");

      expect(success).toBe(false);
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.error).toBe("Credenciales inválidas");
    });
  });

  describe("logout action", () => {
    it("clears user and authentication state", async () => {
      useAuthStore.setState({
        user: {
          id: "1",
          cedula: "V-12345678",
          nombre: "Admin",
          apellido: "User",
          email: "admin@mercal.gob.ve",
          role: "ADMIN",
          roleLabel: "Administrador",
          departamento: "Tecnología",
        },
        isAuthenticated: true,
      });

      vi.mocked(api.apiLogout).mockResolvedValueOnce();

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(api.setAuthToken).toHaveBeenCalledWith(null);
    });
  });
});
