"use client";

import { useState } from "react";
import { useMedicosStore } from "./medicos.store";
import { Stethoscope, Clock, Building2, Plus, Pencil, PowerOff, Trash2, UserCircle2, Search, Mail, Phone } from "lucide-react";
import { TURNOS_CONFIG } from "@/lib/constants";
import { NuevoMedicoModal } from "./NuevoMedicoModal";
import { EditarMedicoModal } from "./EditarMedicoModal";
import { Medico } from "@/types";

export function MedicosContent() {
  const { medicos, especialidades, toggleActivo, deleteMedico } = useMedicosStore();
  const [showNuevo, setShowNuevo] = useState(false);
  const [medicoToEdit, setMedicoToEdit] = useState<Medico | null>(null);
  const [filtroEsp, setFiltroEsp] = useState<string>("TODAS");
  const [filtroEstado, setFiltroEstado] = useState<"TODOS" | "ACTIVOS" | "INACTIVOS">("TODOS");
  const [busqueda, setBusqueda] = useState("");

  const medicosActivos = medicos.filter((m) => m.activo);
  const medicosInactivos = medicos.filter((m) => !m.activo);

  const medicosFiltrados = medicos.filter((m) => {
    const matchEsp = filtroEsp === "TODAS" || m.especialidadId === filtroEsp;
    const matchEstado =
      filtroEstado === "TODOS" ||
      (filtroEstado === "ACTIVOS" && m.activo) ||
      (filtroEstado === "INACTIVOS" && !m.activo);
    const query = busqueda.toLowerCase();
    const matchBusqueda =
      !query ||
      m.nombre.toLowerCase().includes(query) ||
      m.apellido.toLowerCase().includes(query) ||
      m.especialidadNombre.toLowerCase().includes(query) ||
      (m.email ?? "").toLowerCase().includes(query);
    return matchEsp && matchEstado && matchBusqueda;
  });

  const handleDelete = (m: Medico) => {
    if (confirm(`¿Eliminar al Dr. ${m.nombre} ${m.apellido}? Esta acción no se puede deshacer.`)) {
      deleteMedico(m.id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-slate-900 dark:text-white text-2xl font-bold">Médicos y Especialidades</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {medicos.length} médicos registrados · {medicosActivos.length} activos · {medicosInactivos.length} inactivos
          </p>
        </div>
        <button
          id="nuevo-medico-btn"
          onClick={() => setShowNuevo(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Nuevo Médico
        </button>
      </div>

      {/* Especialidades pills */}
      <div>
        <h2 className="text-slate-600 dark:text-slate-300 font-semibold text-xs mb-3 uppercase tracking-wider">
          Especialidades Disponibles
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFiltroEsp("TODAS")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm transition-colors ${
              filtroEsp === "TODAS"
                ? "bg-blue-500/10 dark:bg-blue-500/20 border-blue-300 dark:border-blue-500/30 text-blue-600 dark:text-blue-300"
                : "bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-300 dark:hover:border-slate-600"
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            Todas
            <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-300 text-xs">
              {medicos.filter((m) => m.activo).length}
            </span>
          </button>
          {especialidades.map((esp) => {
            const count = medicos.filter((m) => m.especialidadId === esp.id && m.activo).length;
            return (
              <button
                key={esp.id}
                onClick={() => setFiltroEsp(filtroEsp === esp.id ? "TODAS" : esp.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm transition-colors ${
                  filtroEsp === esp.id
                    ? "bg-blue-500/10 dark:bg-blue-500/20 border-blue-300 dark:border-blue-500/30 text-blue-600 dark:text-blue-300"
                    : "bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-300 dark:hover:border-slate-600"
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>{esp.nombre}</span>
                <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-300 text-xs">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, especialidad, email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
          />
        </div>
        <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0">
          {(["TODOS", "ACTIVOS", "INACTIVOS"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltroEstado(f)}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                filtroEstado === f
                  ? "bg-blue-500 text-white"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              {f === "TODOS" ? "Todos" : f === "ACTIVOS" ? "Activos" : "Inactivos"}
            </button>
          ))}
        </div>
      </div>

      {/* Medicos grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {medicosFiltrados.map((medico) => {
          const turnoConfig = TURNOS_CONFIG[medico.turno];
          return (
            <div
              key={medico.id}
              className={`bg-white dark:bg-slate-800/50 border rounded-2xl p-5 transition-all duration-200 hover:shadow-md dark:hover:border-slate-600/50 group ${
                medico.activo
                  ? "border-slate-200 dark:border-slate-700/50"
                  : "border-slate-200 dark:border-slate-800 opacity-60"
              }`}
            >
              {/* Avatar & Name */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                  {medico.fotoPerfil ? (
                    <img src={medico.fotoPerfil} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
                      {medico.nombre[0]}{medico.apellido[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-900 dark:text-white font-semibold leading-tight truncate">
                    Dr. {medico.nombre} {medico.apellido}
                  </p>
                  <p className="text-blue-500 dark:text-blue-400 text-xs mt-0.5">{medico.especialidadNombre}</p>
                  {medico.cedula && (
                    <p className="text-slate-400 dark:text-slate-500 text-xs">{medico.cedula}</p>
                  )}
                </div>
                <span
                  className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium border ${
                    medico.activo
                      ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20"
                      : "text-slate-500 bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                  }`}
                >
                  {medico.activo ? "Activo" : "Inactivo"}
                </span>
              </div>

              {/* Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {turnoConfig.label} · {medico.horaInicio && medico.horaFin
                      ? `${medico.horaInicio} - ${medico.horaFin}`
                      : turnoConfig.hours}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Cubículo {medico.cubiculo}</span>
                </div>
                {medico.telefono && (
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{medico.telefono}</span>
                  </div>
                )}
                {medico.email && (
                  <div className="flex items-center gap-2 text-xs">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-500 dark:text-slate-400 truncate">{medico.email}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                <button
                  onClick={() => setMedicoToEdit(medico)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-medium transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Editar
                </button>
                <button
                  onClick={() => toggleActivo(medico.id)}
                  title={medico.activo ? "Desactivar" : "Activar"}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    medico.activo
                      ? "bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400"
                      : "bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  <PowerOff className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(medico)}
                  title="Eliminar"
                  className="p-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {medicosFiltrados.length === 0 && (
        <div className="text-center py-12 text-slate-400 dark:text-slate-500">
          <UserCircle2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No se encontraron médicos</p>
          <p className="text-sm mt-1">Intente con otros filtros o registre un nuevo médico</p>
        </div>
      )}

      {/* Modales */}
      <NuevoMedicoModal open={showNuevo} onClose={() => setShowNuevo(false)} />
      {medicoToEdit && (
        <EditarMedicoModal
          medico={medicoToEdit}
          open={!!medicoToEdit}
          onClose={() => setMedicoToEdit(null)}
        />
      )}
    </div>
  );
}
