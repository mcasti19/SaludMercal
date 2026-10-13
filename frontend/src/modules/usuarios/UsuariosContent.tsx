"use client";

import { ApiUser, CreateUserData, UpdateUserData } from "@/lib/api";
import { useAuthStore } from "@/modules/auth/auth.store";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  KeyRound,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ResetPasswordModal } from "./ResetPasswordModal";
import { UsuarioModal } from "./UsuarioModal";
import { useUsuariosStore } from "./usuarios.store";

const ROLE_BADGES: Record<string, { label: string; color: string }> = {
  super_admin: {
    label: "Super Administrador",
    color:
      "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  logical_security: {
    label: "Seguridad Lógica (OTIC)",
    color:
      "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  },
  admin: {
    label: "Admin de Sede",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  receptionist: {
    label: "Recepción",
    color:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  doctor: {
    label: "Médico",
    color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  },
  nurse: {
    label: "Enfermería",
    color: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
  },
  employee: {
    label: "Empleado",
    color:
      "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  },
};

export function UsuariosContent() {
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === "SUPERADMIN";
  const isLogicalSecurity = currentUser?.role === "SEGURIDAD_LOGICA";
  const hasNationalScope = isSuperAdmin || isLogicalSecurity;

  const {
    users,
    locations,
    isLoading,
    isSaving,
    error,
    search,
    roleFilter,
    locationFilter,
    fetchUsers,
    fetchLocations,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    toggleActive,
    setSearch,
    setRoleFilter,
    setLocationFilter,
    clearError,
  } = useUsuariosStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<ApiUser | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [userToReset, setUserToReset] = useState<ApiUser | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchLocations();
  }, [fetchUsers, fetchLocations]);

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim();
    return users.filter((u) => {
      const matchSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.location?.name && u.location.name.toLowerCase().includes(q));

      const matchRole = !roleFilter || u.role === roleFilter;
      const matchLocation =
        !locationFilter ||
        (u.location_id && String(u.location_id) === locationFilter);

      return matchSearch && matchRole && matchLocation;
    });
  }, [users, search, roleFilter, locationFilter]);

  // Statistics
  const totalCount = users.length;
  const activeCount = users.filter((u) => u.is_active).length;
  const securityCount = users.filter(
    (u) => u.role === "logical_security" || u.role === "super_admin",
  ).length;
  const expiredCount = users.filter(
    (u) => u.is_password_expired || u.must_change_password,
  ).length;

  const handleOpenCreate = () => {
    setUserToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (user: ApiUser) => {
    setUserToEdit(user);
    setModalOpen(true);
  };

  const handleOpenReset = (user: ApiUser) => {
    setUserToReset(user);
    setResetModalOpen(true);
  };

  const handleSaveUser = async (data: CreateUserData | UpdateUserData) => {
    let ok = false;
    if (userToEdit) {
      ok = await updateUser(userToEdit.id, data);
      if (ok) {
        setSuccessNotice(
          `Usuario ${userToEdit.username} actualizado exitosamente.`,
        );
      }
    } else {
      ok = await createUser(data as CreateUserData);
      if (ok) {
        setSuccessNotice(`Usuario ${data.username} creado exitosamente.`);
      }
    }
    if (ok) {
      setTimeout(() => setSuccessNotice(null), 4000);
    }
    return ok;
  };

  const handleConfirmReset = async (userId: number, pass: string) => {
    const ok = await resetPassword(userId, pass);
    if (ok) {
      setSuccessNotice(
        "Contraseña restablecida correctamente. Se obligará al cambio en el próximo inicio de sesión.",
      );
      setTimeout(() => setSuccessNotice(null), 4000);
    }
    return ok;
  };

  const handleDeleteUser = async (user: ApiUser) => {
    if (String(user.id) === currentUser?.id) {
      alert("No puede eliminar su propia cuenta activa.");
      return;
    }
    if (user.role === "super_admin" && !isSuperAdmin) {
      alert("No tiene permisos para eliminar una cuenta Super Administrador.");
      return;
    }
    if (
      confirm(
        `¿Está seguro de eliminar al usuario ${user.name} (${user.username})?`,
      )
    ) {
      const ok = await deleteUser(user.id);
      if (ok) {
        setSuccessNotice(`Usuario ${user.username} eliminado.`);
        setTimeout(() => setSuccessNotice(null), 4000);
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Notifications */}
      {error && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={clearError} className="text-xs hover:underline">
            Cerrar
          </button>
        </div>
      )}

      {successNotice && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-slate-900 dark:text-white text-2xl font-bold tracking-tight">
              Gestión de Usuarios y Accesos
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              Seguridad Lógica / OTIC
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Administración centralizada de identidades, roles, políticas de
            expiración y tokens para Sede Central y las 24 sedes regionales.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchUsers()}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Refrescar usuarios"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
          <button
            id="nuevo-usuario-btn"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/20 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      {/* Stat KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Usuarios
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {totalCount}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Seguridad / SuperAdmin
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {securityCount}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Cuentas Activas
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {activeCount}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Requiere Cambio / Vencidas
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {expiredCount}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, usuario, correo o sede..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="">Todos los Roles</option>
            <option value="super_admin">Super Administrador</option>
            <option value="logical_security">Seguridad Lógica (OTIC)</option>
            <option value="admin">Administrador de Sede</option>
            <option value="receptionist">Recepción</option>
            <option value="doctor">Médico</option>
            <option value="nurse">Enfermería</option>
            <option value="employee">Empleado</option>
          </select>

          {hasNationalScope && (
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="">Todas las Sedes</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} {loc.is_headquarters ? "★ (Central)" : ""}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Rol / Nivel</th>
                <th className="px-6 py-4">Sede Asignada</th>
                <th className="px-6 py-4">Políticas & Credenciales</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                        <span>Cargando directorio de usuarios...</span>
                      </div>
                    ) : (
                      "No se encontraron usuarios coincidentes con los filtros."
                    )}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleBadge = ROLE_BADGES[u.role] ?? {
                    label: u.role,
                    color: "bg-slate-100 text-slate-700",
                  };
                  const isUserSelf = String(u.id) === currentUser?.id;
                  const isTargetSuper = u.role === "super_admin";

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Usuario */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {u.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white truncate">
                              {u.name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                              <span className="font-mono">@{u.username}</span>
                              <span>·</span>
                              <span className="truncate">{u.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Rol */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${roleBadge.color}`}
                        >
                          {roleBadge.label}
                        </span>
                      </td>

                      {/* Sede */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {u.location?.name ??
                              "Sede Central (Torre Principal)"}
                          </span>
                          {u.location?.is_headquarters && (
                            <span className="text-[10px] text-amber-500 font-bold">
                              ★ Sede Central
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Políticas & Credenciales */}
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">
                              Vigencia clave:
                            </span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {u.password_expiration_months ?? 3} meses
                            </span>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-500">Sesión:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {u.session_timeout_minutes ?? 30}m
                            </span>
                          </div>
                          <div>
                            {u.is_password_expired ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-500">
                                <Lock className="w-3 h-3" /> Clave Vencida
                              </span>
                            ) : u.must_change_password ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500">
                                <KeyRound className="w-3 h-3" /> Cambio
                                Obligatorio
                              </span>
                            ) : (
                              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                Credencial Vigente
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleActive(u.id, u.is_active)}
                          disabled={isUserSelf}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                            u.is_active
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                              : "bg-slate-200 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700 hover:bg-slate-300"
                          } ${isUserSelf ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                          title={
                            isUserSelf
                              ? "No puede desactivar su propia cuenta"
                              : "Click para cambiar estado"
                          }
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${u.is_active ? "bg-emerald-500" : "bg-slate-400"}`}
                          />
                          <span>{u.is_active ? "Activa" : "Inactiva"}</span>
                        </button>
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenReset(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                            title="Restablecer Contraseña"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                            title="Editar Usuario"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={
                              isUserSelf || (isTargetSuper && !isSuperAdmin)
                            }
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title={
                              isUserSelf
                                ? "No puede eliminar su propia cuenta"
                                : "Eliminar Usuario"
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <UsuarioModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveUser}
        userToEdit={userToEdit}
        locations={locations}
        isSaving={isSaving}
      />

      <ResetPasswordModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={handleConfirmReset}
        user={userToReset}
        isSaving={isSaving}
      />
    </div>
  );
}
