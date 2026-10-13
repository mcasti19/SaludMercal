import { describe, it, expect, vi, beforeEach } from "vitest";
import { useUsuariosStore } from "@/modules/usuarios/usuarios.store";
import * as api from "@/lib/api";

vi.mock("@/lib/api", () => ({
  apiGetUsers: vi.fn(),
  apiGetLocations: vi.fn(),
  apiCreateUser: vi.fn(),
  apiUpdateUser: vi.fn(),
  apiDeleteUser: vi.fn(),
  apiResetUserPassword: vi.fn(),
}));

describe("Usuarios Store (src/modules/usuarios/usuarios.store.ts)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUsuariosStore.setState({
      users: [],
      locations: [],
      isLoading: false,
      isSaving: false,
      error: null,
      search: "",
      roleFilter: "",
      locationFilter: "",
    });
  });

  it("fetches users list and populates state", async () => {
    const mockUsers: api.ApiUser[] = [
      {
        id: 1,
        name: "Seguridad Lógica OTIC",
        username: "seguridad.logica",
        email: "seguridad.logica@mercal.gob.ve",
        role: "logical_security",
        is_active: true,
        must_change_password: false,
        password_expiration_months: 3,
        session_timeout_minutes: 20,
      },
    ];

    vi.mocked(api.apiGetUsers).mockResolvedValueOnce(mockUsers);

    await useUsuariosStore.getState().fetchUsers();

    const state = useUsuariosStore.getState();
    expect(state.users).toHaveLength(1);
    expect(state.users[0].username).toBe("seguridad.logica");
    expect(state.users[0].password_expiration_months).toBe(3);
    expect(state.users[0].session_timeout_minutes).toBe(20);
    expect(state.isLoading).toBe(false);
  });

  it("creates a new user with password lifecycle configs", async () => {
    const newUser: api.ApiUser = {
      id: 2,
      name: "Juan Perez",
      username: "jperez",
      email: "jperez@mercal.gob.ve",
      role: "receptionist",
      is_active: true,
      must_change_password: true,
      password_expiration_months: 6,
      session_timeout_minutes: 30,
    };

    vi.mocked(api.apiCreateUser).mockResolvedValueOnce({ data: newUser });

    const ok = await useUsuariosStore.getState().createUser({
      name: "Juan Perez",
      username: "jperez",
      email: "jperez@mercal.gob.ve",
      role: "receptionist",
      password: "Password123*",
      password_expiration_months: 6,
      session_timeout_minutes: 30,
    });

    expect(ok).toBe(true);
    expect(useUsuariosStore.getState().users).toContainEqual(newUser);
  });

  it("resets user password and updates local must_change_password status", async () => {
    useUsuariosStore.setState({
      users: [
        {
          id: 5,
          name: "Test User",
          username: "testuser",
          email: "test@mercal.gob.ve",
          role: "employee",
          is_active: true,
          must_change_password: false,
        },
      ],
    });

    vi.mocked(api.apiResetUserPassword).mockResolvedValueOnce({ message: "Password reset" });

    const ok = await useUsuariosStore.getState().resetPassword(5, "NewSecret123*");

    expect(ok).toBe(true);
    expect(api.apiResetUserPassword).toHaveBeenCalledWith(5, "NewSecret123*");
    const updated = useUsuariosStore.getState().users.find((u) => u.id === 5);
    expect(updated?.must_change_password).toBe(true);
  });
});
