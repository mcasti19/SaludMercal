/**
 * api.ts — Cliente HTTP centralizado para SaludMercal
 *
 * Usa Sanctum API Tokens (Bearer):
 *  - El token se obtiene en el login y se guarda en memoria (auth.store)
 *  - Se envía en cada petición con Authorization: Bearer <token>
 *  - El token se revoca en el logout
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** Token en memoria — se establece desde el auth.store tras el login */
let _bearerToken: string | null = null;

export function setAuthToken(token: string | null): void {
  _bearerToken = token;
}

export function getAuthToken(): string | null {
  return _bearerToken;
}

/** Wrapper sobre fetch con configuración base para la API */
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (_bearerToken) {
    headers["Authorization"] = `Bearer ${_bearerToken}`;
  }

  const res = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      body?.errors
        ? Object.values(body.errors as Record<string, string[]>)
            .flat()
            .join(" ")
        : body?.message ?? `Error ${res.status}`;
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface ApiUser {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user: ApiUser;
}

export interface MeResponse {
  user: ApiUser;
}

export async function apiLogin(
  login: string,
  password: string
): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/login", {
    method: "POST",
    body: JSON.stringify({ login, password }),
  });
}

export async function apiLogout(): Promise<void> {
  await apiFetch("/logout", { method: "POST" });
}

export async function apiMe(): Promise<MeResponse> {
  return apiFetch<MeResponse>("/me");
}
