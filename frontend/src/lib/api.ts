/**
 * api.ts — Centralized HTTP client for SaludMercal API v1
 *
 * Handles Sanctum API Tokens (Bearer) stored securely:
 *  - Token loaded from localStorage on client-side boot
 *  - Sent in each request Authorization: Bearer <token>
 *  - Automatically handled on 401 response (clears token)
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const TOKEN_STORAGE_KEY = "saludmercal_token";

let _bearerToken: string | null = null;

if (typeof window !== "undefined") {
  _bearerToken = localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAuthToken(token: string | null): void {
  _bearerToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }
}

export function getAuthToken(): string | null {
  if (!_bearerToken && typeof window !== "undefined") {
    _bearerToken = localStorage.getItem(TOKEN_STORAGE_KEY);
  }
  return _bearerToken;
}

/** Wrapper around native fetch */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string>),
  };

  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    setAuthToken(null);
    if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
      // Dispatch event to inform stores of session termination
      window.dispatchEvent(new CustomEvent("saludmercal:unauthorized"));
    }
  }

  if (res.status === 204) {
    return null as T;
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      message?: string;
      errors?: Record<string, string[]>;
    };
    const message = body.errors
      ? Object.values(body.errors).flat().join(" ")
      : body.message ?? `Error HTTP ${res.status}`;
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

// ─── Data Transfer Interfaces ────────────────────────────────────────────────

export interface ApiUser {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  must_change_password: boolean;
  password_expiration_months?: number;
  password_expires_at?: string | null;
  is_password_expired?: boolean;
  session_timeout_minutes?: number;
  national_id?: string | null;
  department?: string | null;
  patient_id?: number | null;
  location_id?: number | null;
  location?: ApiCatalogItem | null;
  last_login_at?: string | null;
  created_at?: string | null;
}

export interface LoginResponse {
  token: string;
  expires_at?: string;
  user: ApiUser;
}

export interface MeResponse {
  user: ApiUser;
}

export interface ApiCatalogItem {
  id: number;
  name: string;
  code?: string | null;
  description?: string | null;
  state?: string | null;
  phone?: string | null;
  is_headquarters?: boolean | null;
  is_active?: boolean;
}

export interface ApiPatient {
  id: number;
  user_id?: number | null;
  national_id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  birth_date: string;
  gender?: string | null;
  phone?: string | null;
  email?: string | null;
  department_id?: number | null;
  location_id?: number | null;
  department?: ApiCatalogItem | null;
  location?: ApiCatalogItem | null;
  job_title?: string | null;
  blood_type?: string | null;
  allergies?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  is_active: boolean;
  created_at?: string;
  appointments?: ApiAppointment[];
  medical_leaves?: ApiMedicalLeave[];
}

export interface ApiDoctorSchedule {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface ApiDoctor {
  id: number;
  user_id?: number | null;
  specialty_id: number;
  specialty?: ApiCatalogItem;
  specialty_ids?: number[];
  specialties?: ApiCatalogItem[];
  location_id?: number | null;
  location?: ApiCatalogItem;
  national_id?: string | null;
  license_number?: string | null;
  first_name: string;
  last_name: string;
  full_name?: string;
  phone?: string | null;
  email?: string | null;
  office?: string | null;
  photo_path?: string | null;
  slot_duration_minutes: number;
  is_active: boolean;
  schedules?: ApiDoctorSchedule[];
  time_offs?: { id: number; start_date: string; end_date: string; reason?: string | null }[];
}

export interface ApiAppointment {
  id: number;
  code: string;
  patient_id: number;
  doctor_id: number;
  specialty_id: number;
  patient?: ApiPatient;
  doctor?: ApiDoctor;
  specialty?: ApiCatalogItem;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  status: string;
  reason: string;
  notes?: string | null;
  cancellation_reason?: string | null;
  confirmed_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  created_at: string;
  history?: {
    from_status?: string | null;
    to_status: string;
    comment?: string | null;
    created_at?: string;
  }[];
}

export interface ApiMedicalLeave {
  id: number;
  patient_id: number;
  doctor_id?: number | null;
  patient?: ApiPatient;
  doctor?: ApiDoctor;
  type: string;
  start_date: string;
  end_date: string;
  days: number;
  diagnosis: string;
  status: string;
  has_attachment: boolean;
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  review_notes?: string | null;
  created_at: string;
}

export interface ApiReportSummary {
  range: { from: string; to: string };
  appointments: {
    total: number;
    completion_rate: number;
    by_status: Record<string, number>;
    today: number;
    by_specialty: { id: number; name: string; total: number }[];
    by_doctor: { id: number; first_name: string; last_name: string; total: number }[];
  };
  patients: { total: number; active: number };
  medical_leaves: { pending: number; approved_in_range: number };
}

// ─── API Functions: Auth ─────────────────────────────────────────────────────

export async function apiLogin(login: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ login, password }),
  });
}

export async function apiLogout(): Promise<void> {
  try {
    await apiFetch("/v1/auth/logout", { method: "POST" });
  } finally {
    setAuthToken(null);
  }
}

export async function apiMe(): Promise<MeResponse> {
  return apiFetch<MeResponse>("/v1/auth/me");
}

export async function apiChangePassword(payload: {
  current_password: string;
  password: string;
  password_confirmation: string;
}): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/v1/auth/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ─── API Functions: Catalogs ─────────────────────────────────────────────────

export async function apiGetDepartments(): Promise<ApiCatalogItem[]> {
  const res = await apiFetch<{ data: ApiCatalogItem[] }>("/v1/departments?per_page=100");
  return res.data;
}

export async function apiGetLocations(): Promise<ApiCatalogItem[]> {
  const res = await apiFetch<{ data: ApiCatalogItem[] }>("/v1/locations?per_page=100");
  return res.data;
}

export async function apiGetSpecialties(): Promise<ApiCatalogItem[]> {
  const res = await apiFetch<{ data: ApiCatalogItem[] }>("/v1/specialties?per_page=100");
  return res.data;
}

// ─── API Functions: Patients ─────────────────────────────────────────────────

export async function apiGetPatients(params?: {
  search?: string;
  department_id?: number;
  location_id?: number;
  is_active?: boolean;
}): Promise<ApiPatient[]> {
  const query = new URLSearchParams();
  query.set("per_page", "100");
  if (params?.search) query.set("search", params.search);
  if (params?.department_id) query.set("department_id", String(params.department_id));
  if (params?.location_id) query.set("location_id", String(params.location_id));
  if (params?.is_active !== undefined) query.set("is_active", params.is_active ? "1" : "0");

  const res = await apiFetch<{ data: ApiPatient[] }>(`/v1/patients?${query.toString()}`);
  return res.data;
}

export async function apiGetMyPatient(): Promise<ApiPatient> {
  const res = await apiFetch<{ data: ApiPatient }>("/v1/patients/me");
  return res.data;
}

export async function apiGetPatient(id: number | string): Promise<ApiPatient> {
  const res = await apiFetch<{ data: ApiPatient }>(`/v1/patients/${id}`);
  return res.data;
}

export async function apiCreatePatient(payload: {
  national_id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  gender?: string | null;
  phone?: string | null;
  email?: string | null;
  department_id?: number | null;
  location_id?: number | null;
  job_title?: string | null;
  blood_type?: string | null;
  allergies?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  is_active?: boolean;
}): Promise<ApiPatient> {
  const res = await apiFetch<{ data: ApiPatient }>("/v1/patients", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function apiUpdatePatient(
  id: number | string,
  payload: Partial<{
    national_id: string;
    first_name: string;
    last_name: string;
    birth_date: string;
    gender?: string | null;
    phone?: string | null;
    email?: string | null;
    department_id?: number | null;
    location_id?: number | null;
    job_title?: string | null;
    blood_type?: string | null;
    allergies?: string | null;
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    is_active?: boolean;
  }>
): Promise<ApiPatient> {
  const res = await apiFetch<{ data: ApiPatient }>(`/v1/patients/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function apiDeletePatient(id: number | string): Promise<void> {
  await apiFetch(`/v1/patients/${id}`, { method: "DELETE" });
}

// ─── API Functions: Doctors ──────────────────────────────────────────────────

export async function apiGetDoctors(params?: {
  search?: string;
  specialty_id?: number;
  location_id?: number;
  is_active?: boolean;
}): Promise<ApiDoctor[]> {
  const query = new URLSearchParams();
  query.set("per_page", "100");
  if (params?.search) query.set("search", params.search);
  if (params?.specialty_id) query.set("specialty_id", String(params.specialty_id));
  if (params?.location_id) query.set("location_id", String(params.location_id));
  if (params?.is_active !== undefined) query.set("is_active", params.is_active ? "1" : "0");

  const res = await apiFetch<{ data: ApiDoctor[] }>(`/v1/doctors?${query.toString()}`);
  return res.data;
}

export async function apiCreateDoctor(payload: {
  specialty_ids: number[];
  specialty_id?: number;
  first_name: string;
  last_name: string;
  national_id?: string | null;
  license_number?: string | null;
  phone?: string | null;
  email?: string | null;
  office?: string | null;
  slot_duration_minutes?: number;
  is_active?: boolean;
  schedules?: ApiDoctorSchedule[];
}): Promise<ApiDoctor> {
  const res = await apiFetch<{ data: ApiDoctor }>("/v1/doctors", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function apiUpdateDoctor(
  id: number | string,
  payload: Partial<{
    specialty_ids: number[];
    specialty_id: number;
    first_name: string;
    last_name: string;
    national_id?: string | null;
    license_number?: string | null;
    phone?: string | null;
    email?: string | null;
    office?: string | null;
    slot_duration_minutes?: number;
    is_active?: boolean;
    schedules?: ApiDoctorSchedule[];
  }>
): Promise<ApiDoctor> {
  const res = await apiFetch<{ data: ApiDoctor }>(`/v1/doctors/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function apiDeleteDoctor(id: number | string): Promise<void> {
  await apiFetch(`/v1/doctors/${id}`, { method: "DELETE" });
}

export async function apiGetDoctorAvailability(
  doctorId: number | string,
  date: string
): Promise<{ doctor_id: number; date: string; slots: string[] }> {
  return apiFetch<{ doctor_id: number; date: string; slots: string[] }>(
    `/v1/doctors/${doctorId}/availability?date=${date}`
  );
}

// ─── API Functions: Appointments ─────────────────────────────────────────────

export async function apiGetAppointments(params?: {
  status?: string;
  date?: string;
  date_from?: string;
  date_to?: string;
  doctor_id?: number;
  patient_id?: number;
  specialty_id?: number;
  search?: string;
  sort?: "asc" | "desc";
}): Promise<ApiAppointment[]> {
  const query = new URLSearchParams();
  query.set("per_page", "100");
  if (params?.status) query.set("status", params.status);
  if (params?.date) query.set("date", params.date);
  if (params?.date_from) query.set("date_from", params.date_from);
  if (params?.date_to) query.set("date_to", params.date_to);
  if (params?.doctor_id) query.set("doctor_id", String(params.doctor_id));
  if (params?.patient_id) query.set("patient_id", String(params.patient_id));
  if (params?.specialty_id) query.set("specialty_id", String(params.specialty_id));
  if (params?.search) query.set("search", params.search);
  if (params?.sort) query.set("sort", params.sort);

  const res = await apiFetch<{ data: ApiAppointment[] }>(`/v1/appointments?${query.toString()}`);
  return res.data;
}

export async function apiCreateAppointment(payload: {
  patient_id?: number | null;
  doctor_id: number;
  scheduled_date: string;
  start_time: string;
  reason: string;
  notes?: string | null;
}): Promise<ApiAppointment> {
  const res = await apiFetch<{ data: ApiAppointment }>("/v1/appointments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function apiRescheduleAppointment(
  id: number | string,
  payload: { scheduled_date: string; start_time: string }
): Promise<ApiAppointment> {
  const res = await apiFetch<{ data: ApiAppointment }>(`/v1/appointments/${id}/reschedule`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function apiTransitionAppointment(
  id: number | string,
  payload: { status: string; comment?: string }
): Promise<ApiAppointment> {
  const res = await apiFetch<{ data: ApiAppointment }>(`/v1/appointments/${id}/status`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function apiDeleteAppointment(id: number | string): Promise<void> {
  await apiFetch(`/v1/appointments/${id}`, { method: "DELETE" });
}

// ─── API Functions: Medical Leaves ───────────────────────────────────────────

export async function apiGetMedicalLeaves(params?: {
  status?: string;
  type?: string;
  patient_id?: number;
}): Promise<ApiMedicalLeave[]> {
  const query = new URLSearchParams();
  query.set("per_page", "100");
  if (params?.status) query.set("status", params.status);
  if (params?.type) query.set("type", params.type);
  if (params?.patient_id) query.set("patient_id", String(params.patient_id));

  const res = await apiFetch<{ data: ApiMedicalLeave[] }>(`/v1/medical-leaves?${query.toString()}`);
  return res.data;
}

export async function apiCreateMedicalLeave(payload: FormData | {
  patient_id?: number;
  doctor_id?: number;
  type: string;
  start_date: string;
  end_date: string;
  diagnosis: string;
}): Promise<ApiMedicalLeave> {
  const body = payload instanceof FormData ? payload : JSON.stringify(payload);
  const res = await apiFetch<{ data: ApiMedicalLeave }>("/v1/medical-leaves", {
    method: "POST",
    body,
  });
  return res.data;
}

export async function apiReviewMedicalLeave(
  id: number | string,
  payload: { status: "approved" | "rejected"; review_notes?: string }
): Promise<ApiMedicalLeave> {
  const res = await apiFetch<{ data: ApiMedicalLeave }>(`/v1/medical-leaves/${id}/review`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export function apiGetMedicalLeaveAttachmentUrl(id: number | string): string {
  return `${API_BASE}/api/v1/medical-leaves/${id}/attachment`;
}

export async function apiDownloadMedicalLeaveAttachment(id: number | string): Promise<Blob> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    Accept: "*/*",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}/api/v1/medical-leaves/${id}/attachment`, {
    headers,
  });
  if (!res.ok) {
    throw new Error(`No se pudo descargar el archivo (${res.status})`);
  }
  return res.blob();
}

export async function apiDeleteMedicalLeave(id: number | string): Promise<void> {
  await apiFetch(`/v1/medical-leaves/${id}`, { method: "DELETE" });
}

// ─── API Functions: Medical Exams ────────────────────────────────────────────

export interface ApiMedicalExamFile {
  id: number;
  original_name: string;
  mime_type: string;
  size: number;
}

export interface ApiMedicalExam {
  id: number;
  patient_id: number;
  specialty_id: number;
  specialty?: ApiCatalogItem;
  appointment_id?: number | null;
  title: string;
  exam_date: string;
  notes?: string | null;
  uploaded_by?: number | null;
  uploader_name?: string | null;
  files?: ApiMedicalExamFile[];
  created_at?: string;
}

export async function apiGetPatientMedicalExams(
  patientId: number | string,
  params?: { specialty_id?: number; from?: string; to?: string }
): Promise<ApiMedicalExam[]> {
  const query = new URLSearchParams();
  if (params?.specialty_id) query.set("specialty_id", String(params.specialty_id));
  if (params?.from) query.set("from", params.from);
  if (params?.to) query.set("to", params.to);
  const qs = query.toString();
  const res = await apiFetch<{ data: ApiMedicalExam[] }>(
    `/v1/patients/${patientId}/medical-exams${qs ? `?${qs}` : ""}`
  );
  return res.data;
}

export async function apiCreateMedicalExam(
  patientId: number | string,
  payload: FormData
): Promise<ApiMedicalExam> {
  const res = await apiFetch<{ data: ApiMedicalExam }>(`/v1/patients/${patientId}/medical-exams`, {
    method: "POST",
    body: payload,
  });
  return res.data;
}

export async function apiDeleteMedicalExam(id: number | string): Promise<void> {
  await apiFetch(`/v1/medical-exams/${id}`, { method: "DELETE" });
}

/** Fetches one exam file as a Blob. Inline views and downloads are audited separately. */
export async function apiFetchMedicalExamFile(
  examId: number | string,
  fileId: number | string,
  download: boolean
): Promise<Blob> {
  const token = getAuthToken();
  const headers: Record<string, string> = { Accept: "*/*" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(
    `${API_BASE}/api/v1/medical-exams/${examId}/files/${fileId}${download ? "?download=1" : ""}`,
    { headers }
  );
  if (!res.ok) {
    throw new Error(`No se pudo obtener el archivo (${res.status})`);
  }
  return res.blob();
}

// ─── API Functions: Reports ──────────────────────────────────────────────────

export async function apiGetReportSummary(params?: {
  date_from?: string;
  date_to?: string;
}): Promise<ApiReportSummary> {
  const query = new URLSearchParams();
  if (params?.date_from) query.set("date_from", params.date_from);
  if (params?.date_to) query.set("date_to", params.date_to);

  const res = await apiFetch<{ data: ApiReportSummary }>(
    `/v1/reports/summary${query.toString() ? `?${query.toString()}` : ""}`
  );
  return res.data;
}

export async function apiDownloadMedicalLeaveCertificate(id: number | string): Promise<Blob> {
  const token = getAuthToken();
  const headers: Record<string, string> = { Accept: "application/pdf" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api/v1/medical-leaves/${id}/certificate`, { headers });
  if (!res.ok) {
    throw new Error(`Error descargando constancia (${res.status})`);
  }
  return res.blob();
}

export async function apiDownloadAppointmentPrescription(id: number | string): Promise<Blob> {
  const token = getAuthToken();
  const headers: Record<string, string> = { Accept: "application/pdf" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api/v1/appointments/${id}/prescription`, { headers });
  if (!res.ok) {
    throw new Error(`Error descargando récipe (${res.status})`);
  }
  return res.blob();
}

export async function apiExportReports(params?: {
  format?: "csv" | "pdf";
  date_from?: string;
  date_to?: string;
}): Promise<Blob> {
  const token = getAuthToken();
  const headers: Record<string, string> = { Accept: "*/*" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const query = new URLSearchParams();
  if (params?.format) query.set("format", params.format);
  if (params?.date_from) query.set("date_from", params.date_from);
  if (params?.date_to) query.set("date_to", params.date_to);

  const res = await fetch(`${API_BASE}/api/v1/reports/export?${query.toString()}`, { headers });
  if (!res.ok) {
    throw new Error(`Error exportando reporte (${res.status})`);
  }
  return res.blob();
}

export function downloadBlobAsFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Users & IAM Management ──────────────────────────────────────────────────

export interface CreateUserData {
  name: string;
  username: string;
  email: string;
  role: string;
  location_id?: number | null;
  password?: string;
  is_active?: boolean;
  must_change_password?: boolean;
  password_expiration_months?: 3 | 6 | 12;
  session_timeout_minutes?: 5 | 20 | 30 | 60;
}

export interface UpdateUserData {
  name?: string;
  username?: string;
  email?: string;
  role?: string;
  location_id?: number | null;
  password?: string;
  is_active?: boolean;
  must_change_password?: boolean;
  password_expiration_months?: 3 | 6 | 12;
  session_timeout_minutes?: 5 | 20 | 30 | 60;
}

export async function apiGetUsers(params?: {
  search?: string;
  role?: string;
  location_id?: number;
  is_active?: boolean;
}): Promise<ApiUser[]> {
  const query = new URLSearchParams();
  query.set("per_page", "100");
  if (params?.search) query.set("search", params.search);
  if (params?.role) query.set("role", params.role);
  if (params?.location_id) query.set("location_id", String(params.location_id));
  if (params?.is_active !== undefined) query.set("is_active", params.is_active ? "1" : "0");

  const res = await apiFetch<{ data: ApiUser[] }>(`/v1/users?${query.toString()}`);
  return res.data;
}

export async function apiGetUser(id: number): Promise<{ data: ApiUser }> {
  return apiFetch<{ data: ApiUser }>(`/v1/users/${id}`);
}

export async function apiCreateUser(data: CreateUserData): Promise<{ data: ApiUser }> {
  return apiFetch<{ data: ApiUser }>("/v1/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiUpdateUser(id: number, data: UpdateUserData): Promise<{ data: ApiUser }> {
  return apiFetch<{ data: ApiUser }>(`/v1/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function apiDeleteUser(id: number): Promise<void> {
  return apiFetch<void>(`/v1/users/${id}`, {
    method: "DELETE",
  });
}

export async function apiResetUserPassword(id: number, password: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/v1/users/${id}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}
