"use client";

import {
  ApiCatalogItem,
  ApiUser,
  CreateUserData,
  UpdateUserData,
} from "@/lib/api";
import { useAuthStore } from "@/modules/auth/auth.store";
import {
  AlertCircle,
  CalendarDays,
  Clock,
  KeyRound,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

interface UsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateUserData | UpdateUserData) => Promise<boolean>;
  userToEdit: ApiUser | null;
  locations: ApiCatalogItem[];
  isSaving: boolean;
}

export function UsuarioModal({
  isOpen,
  onClose,
  onSave,
  userToEdit,
  locations,
  isSaving,
}: UsuarioModalProps) {
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === "SUPERADMIN";
  const isLogicalSecurity = currentUser?.role === "SEGURIDAD_LOGICA";
  const hasNationalScope = isSuperAdmin || isLogicalSecurity;

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("employee");
  const [locationId, setLocationId] = useState<string>("");
  const [password, setPassword] = useState("");
  const [passwordExpirationMonths, setPasswordExpirationMonths] = useState<
    3 | 6 | 12
  >(3);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState<
    5 | 20 | 30 | 60
  >(30);
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (userToEdit) {
      setName(userToEdit.name);
      setUsername(userToEdit.username);
      setEmail(userToEdit.email);
      setRole(userToEdit.role);
      setLocationId(
        userToEdit.location_id ? String(userToEdit.location_id) : "",
      );
      setPassword(""); // Blank on edit unless changing
      setPasswordExpirationMonths(
        (userToEdit.password_expiration_months as 3 | 6 | 12) ?? 3,
      );
      setSessionTimeoutMinutes(
        (userToEdit.session_timeout_minutes as 5 | 20 | 30 | 60) ?? 30,
      );
      setMustChangePassword(userToEdit.must_change_password);
      setIsActive(userToEdit.is_active);
    } else {
      setName("");
      setUsername("");
      setEmail("");
      setRole("employee");
      // Default location to current user's location if not national scope
      setLocationId(
        currentUser?.locationId ? String(currentUser.locationId) : "",
      );
      setPassword("");
      setPasswordExpirationMonths(3);
      setSessionTimeoutMinutes(30);
      setMustChangePassword(true);
      setIsActive(true);
    }
    setFormError(null);
  }, [userToEdit, isOpen, currentUser]);

  if (!isOpen) return null;

  const generateSecurePassword = () => {
    const charset =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";
    let gen = "";
    // Ensure at least one uppercase, lowercase, number, symbol
    gen += "ABCDEFGHJKLMNPQRSTUVWXYZ"[Math.floor(Math.random() * 24)];
    gen += "abcdefghijkmnopqrstuvwxyz"[Math.floor(Math.random() * 24)];
    gen += "23456789"[Math.floor(Math.random() * 8)];
    gen += "!@#$%&*"[Math.floor(Math.random() * 7)];
    for (let i = 0; i < 8; i++) {
      gen += charset[Math.floor(Math.random() * charset.length)];
    }
    setPassword(gen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !username.trim() || !email.trim()) {
      setFormError("Por favor complete los campos obligatorios.");
      return;
    }

    if (!userToEdit && !password.trim()) {
      setFormError("Debe asignar una contraseña inicial para la nueva cuenta.");
      return;
    }

    if (password && password.length < 8) {
      setFormError("La contraseña debe tener un mínimo de 8 caracteres.");
      return;
    }

    const payload: CreateUserData | UpdateUserData = {
      name: name.trim(),
      username: username.trim(),
      email: email.trim(),
      role,
      location_id: locationId ? Number(locationId) : null,
      password_expiration_months: passwordExpirationMonths,
      session_timeout_minutes: sessionTimeoutMinutes,
      must_change_password: mustChangePassword,
      is_active: isActive,
      ...(password.trim() ? { password: password.trim() } : {}),
    };

    const ok = await onSave(payload);
    if (ok) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {userToEdit
                  ? "Editar Usuario y Credenciales"
                  : "Nuevo Usuario del Sistema"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {userToEdit
                  ? `Configuración de acceso para ${userToEdit.username}`
                  : "Crear una nueva cuenta con políticas de seguridad"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5 overflow-y-auto flex-1"
        >
          {formError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Datos Personales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nombre Completo *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Ing. Carlos Alvarado"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nombre de Usuario (Login) *
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().trim())
                }
                placeholder="Ej. calvarado o carlos.alvarado"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Correo Electrónico Institucional *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
                placeholder="calvarado@mercal.gob.ve"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>

          {/* Rol y Sede */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Rol / Nivel de Acceso *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
              >
                {isSuperAdmin && (
                  <option value="super_admin">
                    Super Administrador (Nacional Total)
                  </option>
                )}
                {(isSuperAdmin || isLogicalSecurity) && (
                  <option value="logical_security">
                    Seguridad Lógica (OTIC / Gestión Nacional de Usuarios)
                  </option>
                )}
                <option value="admin">Administrador de Sede</option>
                <option value="receptionist">Recepción y Admisión</option>
                <option value="doctor">Médico Especialista</option>
                <option value="nurse">Enfermería / Triage</option>
                <option value="employee">
                  Empleado (Acceso Paciente / Portal)
                </option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Sede / Dependencia</span>
                {!hasNationalScope && (
                  <span className="text-[10px] text-slate-400">
                    Fijada a su Sede
                  </span>
                )}
              </label>
              <select
                value={locationId}
                disabled={!hasNationalScope}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 disabled:opacity-60"
              >
                <option value="">Seleccione Sede...</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}{" "}
                    {loc.is_headquarters
                      ? "★ (Sede Central)"
                      : `— ${loc.state ?? ""}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Políticas de Ciclo de Vida: Expiración Contraseña y Token */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              <CalendarDays className="w-4 h-4 text-blue-500" />
              <span>Políticas de Seguridad y Vigencia de Credenciales</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Vencimiento de Contraseña
                </label>
                <select
                  value={passwordExpirationMonths}
                  onChange={(e) =>
                    setPasswordExpirationMonths(
                      Number(e.target.value) as 3 | 6 | 12,
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value={3}>
                    3 meses (Alta Seguridad recomendada)
                  </option>
                  <option value={6}>6 meses (Estándar administrativo)</option>
                  <option value={12}>12 meses (Anual)</option>
                </select>
                <p className="text-[11px] text-slate-500">
                  El sistema bloqueará el acceso al vencer hasta que se cambie
                  la clave.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  <span>Expiración de Token / Sesión</span>
                </label>
                <select
                  value={sessionTimeoutMinutes}
                  onChange={(e) =>
                    setSessionTimeoutMinutes(
                      Number(e.target.value) as 5 | 20 | 30 | 60,
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value={5}>
                    5 minutos (Kioscos / Máxima Privacidad)
                  </option>
                  <option value={20}>20 minutos (Seguridad Lógica OTIC)</option>
                  <option value={30}>30 minutos (Estándar)</option>
                  <option value={60}>60 minutos (Jornada Continua)</option>
                </select>
                <p className="text-[11px] text-slate-500">
                  Caducidad del token de autenticación por inactividad.
                </p>
              </div>
            </div>
          </div>

          {/* Contraseña Inicial / Cambio */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  {userToEdit
                    ? "Nueva Contraseña (Dejar en blanco para mantener la actual)"
                    : "Contraseña Temporal Inicial *"}
                </span>
              </label>
              <button
                type="button"
                onClick={generateSecurePassword}
                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 font-medium"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generar Segura</span>
              </button>
            </div>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={
                userToEdit
                  ? "•••••••••••• (sin cambios)"
                  : "Mínimo 8 caracteres, mayúsculas y números"
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          {/* Checkboxes de Control */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={mustChangePassword}
                onChange={(e) => setMustChangePassword(e.target.checked)}
                className="mt-0.5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300 leading-tight">
                <strong>Exigir cambio de contraseña</strong> en el próximo
                inicio de sesión
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="mt-0.5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300 leading-tight">
                <strong>Cuenta Activa</strong> (si se desmarca, se revocan todas
                las sesiones activas)
              </span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              {isSaving
                ? "Guardando..."
                : userToEdit
                  ? "Guardar Cambios"
                  : "Crear Usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
