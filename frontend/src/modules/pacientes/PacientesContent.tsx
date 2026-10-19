"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Plane, Search, Users, RefreshCw, Pencil, Trash2, AlertCircle, Building2, ChevronRight } from "lucide-react";
import { usePacientesStore } from "@/modules/pacientes/pacientes.store";
import { Paciente } from "@/types";
import { calcularEdad } from "@/lib/utils";
import { NuevoPacienteModal } from "./NuevoPacienteModal";
import { ComisionServicioModal } from "./ComisionServicioModal";
import { useAuthStore } from "@/modules/auth/auth.store";

export function PacientesContent() {
  const router = useRouter();
  const {
    pacientes,
    search,
    setSearch,
    deletePaciente,
    fetchPacientes,
    fetchDepartments,
    isLoading,
    error,
  } = usePacientesStore();
  const role = useAuthStore((s) => s.user?.role);
  const canRegisterCommission = role === "RECEPCION" || role === "ADMIN";
  const [showCommission, setShowCommission] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pacienteToEdit, setPacienteToEdit] = useState<Paciente | null>(null);

  useEffect(() => {
    fetchPacientes();
    fetchDepartments();
  }, [fetchPacientes, fetchDepartments]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return pacientes.filter(
      (p) =>
        !q ||
        p.nombre.toLowerCase().includes(q) ||
        p.apellido.toLowerCase().includes(q) ||
        p.cedula.toLowerCase().includes(q) ||
        p.departamento.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.sede && p.sede.toLowerCase().includes(q)) ||
        (p.location?.state && p.location.state.toLowerCase().includes(q))
    );
  }, [pacientes, search]);

  const activos = pacientes.filter((p) => p.estado === "ACTIVO").length;
  const inactivos = pacientes.filter((p) => p.estado === "INACTIVO").length;

  return (
    <div className="p-6 space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-slate-900 dark:text-white text-2xl font-bold">Pacientes</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {pacientes.length} pacientes registrados en red nacional · {activos} activos · {inactivos} inactivos
          </p>
        </div>
        {canRegisterCommission && (
          <button
            id="pacientes-comision-btn"
            onClick={() => setShowCommission(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all shrink-0"
          >
            <Plane className="w-4 h-4" />
            Comisión de servicio
          </button>
        )}
        <button
          id="pacientes-nuevo-btn"
          onClick={() => { setPacienteToEdit(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold hover:from-blue-400 hover:to-cyan-400 transition-all shadow-lg shadow-blue-500/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nuevo Paciente
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            id="pacientes-search-input"
            type="text"
            placeholder="Buscar por nombre, cédula, departamento, sede o estado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
          />
        </div>
        <button
          id="pacientes-reset-btn"
          onClick={() => { setSearch(""); fetchPacientes(""); }}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white text-sm transition-colors"
          title="Recargar pacientes"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-500" : ""}`} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-sm">
        {isLoading && pacientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Cargando pacientes desde el servidor...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No se encontraron pacientes</p>
            <p className="text-slate-600 text-sm mt-1">
              {search ? "Intente con otros términos de búsqueda" : "Registre un nuevo paciente para comenzar"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30">
                  {["Paciente", "Cédula", "Departamento", "Sede / Estado", "Contacto", "Edad", "Estado", "Acciones"].map(
                    (h) => (
                      <th key={h} className="px-5 py-3 text-left text-slate-500 dark:text-slate-400 font-medium text-xs uppercase tracking-wider">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/pacientes/${p.id}`)}
                    className="hover:bg-blue-50/40 dark:hover:bg-slate-700/30 cursor-pointer transition-colors group"
                    title="Haz clic para ver el historial y expediente del paciente"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-cyan-400 flex items-center justify-center text-xs font-bold shrink-0 border border-blue-500/10">
                          {p.nombre[0]}{p.apellido[0]}
                        </div>
                        <div>
                          <p className="text-slate-900 dark:text-white font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                            {p.nombre} {p.apellido}
                            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                          </p>
                          {p.cargo && <p className="text-slate-500 text-xs">{p.cargo}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 font-mono text-xs font-semibold">{p.cedula}</td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{p.departamento}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col">
                        <span className="text-slate-800 dark:text-slate-200 font-medium text-xs flex items-center gap-1.5">
                          {p.isHeadquarters ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              <Building2 className="w-3 h-3 text-blue-500" />
                              Sede Central
                            </span>
                          ) : (
                            <span>{p.sede ?? "Nacional"}</span>
                          )}
                        </span>
                        {p.enComision && (
                          <span className="mt-1 inline-flex w-fit items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Plane className="w-3 h-3" />
                            Visitante · sede de origen
                          </span>
                        )}
                        {p.location?.state && !p.isHeadquarters && (
                          <span className="text-slate-500 text-[11px] mt-0.5">{p.location.state}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-slate-600 dark:text-slate-300 text-xs">{p.telefono || "—"}</p>
                      <p className="text-slate-500 text-xs">{p.email || "—"}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                      {calcularEdad(p.fechaNacimiento)} años
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        p.estado === "ACTIVO"
                          ? "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-800"
                          : "text-slate-500 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${p.estado === "ACTIVO" ? "bg-emerald-500" : "bg-slate-500"}`} />
                        {p.estado === "ACTIVO" ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {p.enComision ? (
                          <span className="text-xs text-slate-500">Solo lectura</span>
                        ) : (<>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPacienteToEdit(p);
                            setShowModal(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`¿Eliminar a ${p.nombre} ${p.apellido}?`)) {
                              deletePaciente(p.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        </>)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-slate-500 text-xs text-right">
          Mostrando {filtered.length} de {pacientes.length} pacientes
        </p>
      )}

      {showCommission && (
        <ComisionServicioModal
          onClose={() => setShowCommission(false)}
          onRegistered={() => fetchPacientes()}
        />
      )}

      {showModal && (
        <NuevoPacienteModal
          paciente={pacienteToEdit}
          onClose={() => { setShowModal(false); setPacienteToEdit(null); }}
        />
      )}
    </div>
  );
}
