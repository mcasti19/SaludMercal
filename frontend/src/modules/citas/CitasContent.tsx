"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  CalendarClock,
  Filter,
  RefreshCw,
} from "lucide-react";
import { useCitasStore } from "@/modules/citas/citas.store";
import { usePacientesStore } from "@/modules/pacientes/pacientes.store";
import { useMedicosStore } from "@/modules/medicos/medicos.store";
import { CitaEstadoBadge } from "@/components/shared/CitaEstadoBadge";
import { CitaEstado, Cita } from "@/types";
import { formatDate, formatTime } from "@/lib/utils";
import { CITA_ESTADO_CONFIG } from "@/lib/constants";
import { NuevaCitaModal } from "./NuevaCitaModal";
import { EditarCitaModal } from "./EditarCitaModal";

const ESTADOS: Array<CitaEstado | "TODAS"> = [
  "TODAS",
  "PENDIENTE",
  "CONFIRMADA",
  "EN_ATENCION",
  "COMPLETADA",
  "CANCELADA",
];

export function CitasContent() {
  const { citas, search, setSearch, filterEstado, setFilterEstado, updateEstado } =
    useCitasStore();
  const { medicos } = useMedicosStore();
  const [showNuevaModal, setShowNuevaModal] = useState(false);
  const [citaToEdit, setCitaToEdit] = useState<Cita | null>(null);

  const filtered = useMemo(() => {
    let result = citas;
    if (filterEstado !== "TODAS") {
      result = result.filter((c) => c.estado === filterEstado);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.pacienteNombre.toLowerCase().includes(q) ||
          c.pacienteCedula.toLowerCase().includes(q) ||
          c.medicoNombre.toLowerCase().includes(q) ||
          c.especialidad.toLowerCase().includes(q) ||
          c.motivo.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => {
      const da = new Date(`${a.fecha}T${a.hora}`).getTime();
      const db = new Date(`${b.fecha}T${b.hora}`).getTime();
      return db - da;
    });
  }, [citas, search, filterEstado]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-slate-900 dark:text-white text-2xl font-bold">Citas Médicas</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Gestión y seguimiento de citas — {citas.length} registros totales
          </p>
        </div>
        <button
          id="citas-nueva-btn"
          onClick={() => setShowNuevaModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold hover:from-blue-400 hover:to-cyan-400 transition-all shadow-lg shadow-blue-500/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nueva Cita
        </button>
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            id="citas-search-input"
            type="text"
            placeholder="Buscar por paciente, médico, especialidad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
          />
        </div>

        {/* Estado filter */}
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            id="citas-estado-filter"
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value as CitaEstado | "TODAS")}
            className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
          >
            {ESTADOS.map((estado) => (
              <option key={estado} value={estado}>
                {estado === "TODAS" ? "Todos los estados" : CITA_ESTADO_CONFIG[estado].label}
              </option>
            ))}
          </select>
        </div>

        {/* Reset */}
        <button
          id="citas-reset-filter-btn"
          onClick={() => { setSearch(""); setFilterEstado("TODAS"); }}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white text-sm transition-colors shrink-0"
          title="Limpiar filtros"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Status chips */}
      <div className="flex flex-wrap gap-2">
        {ESTADOS.map((estado) => {
          const count =
            estado === "TODAS"
              ? citas.length
              : citas.filter((c) => c.estado === estado).length;
          const isActive = filterEstado === estado;
          return (
            <button
              key={estado}
              id={`citas-chip-${estado}`}
              onClick={() => setFilterEstado(estado)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                isActive
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-600 hover:text-slate-600 dark:text-slate-300"
              }`}
            >
              {estado === "TODAS" ? "Todas" : CITA_ESTADO_CONFIG[estado].label}
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${isActive ? "bg-blue-500/30" : "bg-slate-700"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarClock className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No se encontraron citas</p>
            <p className="text-slate-600 text-sm mt-1">
              {search || filterEstado !== "TODAS"
                ? "Intente ajustar los filtros de búsqueda"
                : "Registre una nueva cita para comenzar"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30">
                  <th className="px-5 py-3 text-left text-slate-500 dark:text-slate-400 font-medium text-xs uppercase tracking-wider">
                    Paciente
                  </th>
                  <th className="px-5 py-3 text-left text-slate-500 dark:text-slate-400 font-medium text-xs uppercase tracking-wider">
                    Médico / Especialidad
                  </th>
                  <th className="px-5 py-3 text-left text-slate-500 dark:text-slate-400 font-medium text-xs uppercase tracking-wider">
                    Fecha &amp; Hora
                  </th>
                  <th className="px-5 py-3 text-left text-slate-500 dark:text-slate-400 font-medium text-xs uppercase tracking-wider">
                    Motivo
                  </th>
                  <th className="px-5 py-3 text-left text-slate-500 dark:text-slate-400 font-medium text-xs uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-5 py-3 text-right text-slate-500 dark:text-slate-400 font-medium text-xs uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((cita) => (
                  <tr
                    key={cita.id}
                    className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors group"
                  >
                    <td className="px-5 py-3.5">
                      <p className="text-slate-900 dark:text-white font-medium">{cita.pacienteNombre}</p>
                      <p className="text-slate-500 text-xs">{cita.pacienteCedula}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-slate-600 dark:text-slate-300">{cita.medicoNombre}</p>
                      <p className="text-slate-500 text-xs">{cita.especialidad}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-slate-600 dark:text-slate-300">{formatDate(cita.fecha)}</p>
                      <p className="text-slate-500 text-xs">{formatTime(cita.hora)}</p>
                    </td>
                    <td className="px-5 py-3.5 max-w-[180px]">
                      <p className="text-slate-600 dark:text-slate-300 text-xs truncate">{cita.motivo}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <CitaEstadoBadge estado={cita.estado} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {cita.estado === "PENDIENTE" && (
                          <button
                            onClick={() => updateEstado(cita.id, "CONFIRMADA")}
                            className="px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-medium transition-colors"
                          >
                            Confirmar
                          </button>
                        )}
                        {cita.estado === "CONFIRMADA" && (
                          <button
                            onClick={() => updateEstado(cita.id, "EN_ATENCION")}
                            className="px-2 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 text-xs font-medium transition-colors"
                          >
                            Atender
                          </button>
                        )}
                        {cita.estado === "EN_ATENCION" && (
                          <button
                            onClick={() => updateEstado(cita.id, "COMPLETADA")}
                            className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium transition-colors"
                          >
                            Completar
                          </button>
                        )}
                        <button
                          onClick={() => setCitaToEdit(cita)}
                          className="px-2 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
                        >
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Count info */}
      {filtered.length > 0 && (
        <p className="text-slate-500 text-xs text-right">
          Mostrando {filtered.length} de {citas.length} citas
        </p>
      )}

      {/* Modals */}
      {showNuevaModal && (
        <NuevaCitaModal
          onClose={() => setShowNuevaModal(false)}
          pacientes={usePacientesStore.getState().pacientes}
          medicos={medicos}
        />
      )}
      {citaToEdit && (
        <EditarCitaModal
          cita={citaToEdit}
          onClose={() => setCitaToEdit(null)}
        />
      )}
    </div>
  );
}
