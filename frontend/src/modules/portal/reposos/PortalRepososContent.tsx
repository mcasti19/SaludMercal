"use client";

import { useState } from "react";
import { useAuthStore } from "@/modules/auth/auth.store";
import { useRepososStore } from "@/modules/reposos/reposos.store";
import { NuevoReposoModal } from "./NuevoReposoModal";
import { FileBox, Plus, Calendar, Clock, CheckCircle2, XCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { ReposoEstado } from "@/types";

export function PortalRepososContent() {
  const { user } = useAuthStore();
  const { reposos } = useRepososStore();
  const [showNuevo, setShowNuevo] = useState(false);

  // Filter reposos for the current employee
  const misReposos = reposos.filter((r) => r.empleadoId === user?.id);

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-slate-900 dark:text-white text-2xl font-bold">Mis Reposos Médicos</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Gestione sus reposos y constancias médicas
          </p>
        </div>
        <button
          onClick={() => setShowNuevo(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Cargar Reposo
        </button>
      </div>

      {/* List */}
      {misReposos.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileBox className="w-8 h-8" />
          </div>
          <h3 className="text-slate-900 dark:text-white font-semibold mb-1">No hay reposos cargados</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
            Cuando tengas un reposo médico, puedes cargarlo aquí para su validación por el departamento médico.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {misReposos.map((reposo) => (
            <div
              key={reposo.id}
              className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 flex flex-col md:flex-row gap-5 transition-all hover:shadow-md"
            >
              {/* Preview Imagen */}
              <div className="w-full md:w-32 h-32 rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                {reposo.adjuntoBase64 ? (
                  <img src={reposo.adjuntoBase64} alt="Reposo" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity cursor-pointer" />
                ) : (
                  <FileBox className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-slate-900 dark:text-white font-semibold text-lg leading-tight">
                      {reposo.tipo}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                      Dr. {reposo.medicoTratante}
                    </p>
                  </div>
                  <div className="shrink-0">{getEstadoBadge(reposo.estado)}</div>
                </div>

                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">{formatDate(reposo.fechaInicio)}</span>
                    <span className="text-slate-400">al</span>
                    <span className="font-medium">{formatDate(reposo.fechaFin)}</span>
                  </div>
                  <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                    {reposo.dias} días
                  </div>
                </div>

                <div className="text-sm text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-900 dark:text-white mr-1">Diagnóstico:</span>
                  {reposo.diagnostico}
                </div>

                {reposo.notasAdmin && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50 text-sm text-blue-800 dark:text-blue-200">
                    <span className="font-semibold mr-1">Nota de la empresa:</span>
                    {reposo.notasAdmin}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <NuevoReposoModal open={showNuevo} onClose={() => setShowNuevo(false)} />
    </div>
  );
}
