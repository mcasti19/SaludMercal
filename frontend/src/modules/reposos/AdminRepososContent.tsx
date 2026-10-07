"use client";

import { useState } from "react";
import { useRepososStore } from "@/modules/reposos/reposos.store";
import { formatDate } from "@/lib/utils";
import { Reposo, ReposoEstado } from "@/types";
import { CheckCircle2, XCircle, Clock, Search, FileBox, Eye } from "lucide-react";

export function AdminRepososContent() {
  const { reposos, updateEstado } = useRepososStore();
  const [filterEstado, setFilterEstado] = useState<ReposoEstado | "TODOS">("TODOS");
  const [search, setSearch] = useState("");
  const [reposoToReview, setReposoToReview] = useState<Reposo | null>(null);
  const [notasAdmin, setNotasAdmin] = useState("");

  const repososFiltrados = reposos.filter((r) => {
    const matchEstado = filterEstado === "TODOS" || r.estado === filterEstado;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.empleadoNombre.toLowerCase().includes(q) ||
      r.diagnostico.toLowerCase().includes(q);
    return matchEstado && matchSearch;
  });

  const getEstadoBadge = (estado: ReposoEstado) => {
    switch (estado) {
      case "APROBADO":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-200 dark:border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Aprobado
          </span>
        );
      case "RECHAZADO":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium border border-red-200 dark:border-red-500/20">
            <XCircle className="w-3.5 h-3.5" />
            Rechazado
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium border border-amber-200 dark:border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            Pendiente
          </span>
        );
    }
  };

  const handleReview = (estado: ReposoEstado) => {
    if (reposoToReview) {
      updateEstado(reposoToReview.id, estado, notasAdmin);
      setReposoToReview(null);
      setNotasAdmin("");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-slate-900 dark:text-white text-2xl font-bold">Revisión de Reposos Médicos</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Gestione y audite los reposos cargados por los empleados.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por empleado o diagnóstico..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all text-slate-900 dark:text-white"
          />
        </div>
        <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0">
          {(["TODOS", "PENDIENTE", "APROBADO", "RECHAZADO"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterEstado(f)}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                filterEstado === f
                  ? "bg-blue-500 text-white"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              {f === "TODOS" ? "Todos" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden">
        {repososFiltrados.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500">
            <FileBox className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No se encontraron reposos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700/50 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Empleado</th>
                  <th className="px-6 py-4 font-medium">Tipo / Días</th>
                  <th className="px-6 py-4 font-medium">Fechas</th>
                  <th className="px-6 py-4 font-medium">Estado</th>
                  <th className="px-6 py-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300">
                {repososFiltrados.map((reposo) => (
                  <tr key={reposo.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900 dark:text-white">{reposo.empleadoNombre}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">ID: {reposo.empleadoId}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{reposo.tipo}</p>
                      <p className="text-xs text-blue-500 dark:text-blue-400">{reposo.dias} días</p>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {formatDate(reposo.fechaInicio)} al {formatDate(reposo.fechaFin)}
                    </td>
                    <td className="px-6 py-4">
                      {getEstadoBadge(reposo.estado)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setReposoToReview(reposo);
                          setNotasAdmin(reposo.notasAdmin || "");
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-medium transition-colors border border-blue-200 dark:border-blue-500/20"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Revisar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reposoToReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setReposoToReview(null)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Auditar Reposo</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Empleado: {reposoToReview.empleadoNombre}</p>
              </div>
              {getEstadoBadge(reposoToReview.estado)}
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 flex flex-col md:flex-row gap-6">
              {/* Document View */}
              <div className="flex-1 bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden min-h-[300px] flex items-center justify-center">
                {reposoToReview.adjuntoBase64 ? (
                  <img src={reposoToReview.adjuntoBase64} alt="Documento" className="max-w-full max-h-[400px] object-contain" />
                ) : (
                  <p className="text-slate-400 text-sm">Sin documento adjunto</p>
                )}
              </div>
              
              {/* Data & Actions */}
              <div className="w-full md:w-64 shrink-0 space-y-4">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Diagnóstico</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{reposoToReview.diagnostico}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Médico Tratante</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Dr. {reposoToReview.medicoTratante}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-2">Nota / Observación</p>
                  <textarea
                    value={notasAdmin}
                    onChange={(e) => setNotasAdmin(e.target.value)}
                    placeholder="Observaciones de RRHH o médico auditor..."
                    className="w-full bg-transparent border-0 p-0 text-sm focus:ring-0 resize-none text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
                    rows={4}
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 flex items-center justify-end gap-3">
              <button
                onClick={() => setReposoToReview(null)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 text-sm font-medium transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => handleReview("RECHAZADO")}
                className="px-4 py-2 rounded-xl bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30 text-sm font-medium transition-colors border border-red-200 dark:border-red-500/30"
              >
                Rechazar
              </button>
              <button
                onClick={() => handleReview("APROBADO")}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors shadow-lg shadow-emerald-500/20"
              >
                Aprobar Reposo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
