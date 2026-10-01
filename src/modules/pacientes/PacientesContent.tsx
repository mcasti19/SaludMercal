"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Users, RefreshCw, Pencil, Trash2 } from "lucide-react";
import { usePacientesStore } from "@/modules/pacientes/pacientes.store";
import { Paciente } from "@/types";
import { calcularEdad, formatDate } from "@/lib/utils";
import { NuevoPacienteModal } from "./NuevoPacienteModal";

export function PacientesContent() {
  const { pacientes, search, setSearch, deletePaciente } = usePacientesStore();
  const [showModal, setShowModal] = useState(false);
  const [pacienteToEdit, setPacienteToEdit] = useState<Paciente | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return pacientes.filter(
      (p) =>
        !q ||
        p.nombre.toLowerCase().includes(q) ||
        p.apellido.toLowerCase().includes(q) ||
        p.cedula.toLowerCase().includes(q) ||
        p.departamento.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q)
    );
  }, [pacientes, search]);

  const activos = pacientes.filter((p) => p.estado === "ACTIVO").length;
  const inactivos = pacientes.filter((p) => p.estado === "INACTIVO").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-slate-900 dark:text-white text-2xl font-bold">Pacientes</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {pacientes.length} pacientes registrados · {activos} activos · {inactivos} inactivos
          </p>
        </div>
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
            placeholder="Buscar por nombre, cédula, departamento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
          />
        </div>
        <button
          id="pacientes-reset-btn"
          onClick={() => setSearch("")}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
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
                  {["Paciente", "Cédula", "Departamento", "Contacto", "Edad", "Estado", "Acciones"].map(
                    (h) => (
                      <th key={h} className="px-5 py-3 text-left text-slate-500 dark:text-slate-400 font-medium text-xs uppercase tracking-wider">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/30 to-cyan-500/30 flex items-center justify-center text-blue-300 text-xs font-bold shrink-0">
                          {p.nombre[0]}{p.apellido[0]}
                        </div>
                        <div>
                          <p className="text-slate-900 dark:text-white font-medium">{p.nombre} {p.apellido}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{p.cedula}</td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{p.departamento}</td>
                    <td className="px-5 py-3.5">
                      <p className="text-slate-600 dark:text-slate-300 text-xs">{p.telefono}</p>
                      <p className="text-slate-500 text-xs">{p.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                      {calcularEdad(p.fechaNacimiento)} años
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        p.estado === "ACTIVO"
                          ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                          : "text-slate-500 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${p.estado === "ACTIVO" ? "bg-emerald-500" : "bg-slate-500"}`} />
                        {p.estado === "ACTIVO" ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setPacienteToEdit(p); setShowModal(true); }}
                          className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar a ${p.nombre} ${p.apellido}?`)) {
                              deletePaciente(p.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {filtered.length > 0 && (
        <p className="text-slate-500 text-xs text-right">
          Mostrando {filtered.length} de {pacientes.length} pacientes
        </p>
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
