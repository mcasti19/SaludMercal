"use client";

import { useState } from "react";
import { useAuthStore } from "@/modules/auth/auth.store";
import { useCitasStore } from "@/modules/citas/citas.store";
import { useMedicosStore } from "@/modules/medicos/medicos.store";
import { SolicitarCitaModal } from "./SolicitarCitaModal";
import { CitaEstadoBadge } from "@/components/shared/CitaEstadoBadge";
import { CalendarDays, Plus, Clock, FileText, XCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Cita } from "@/types";

export function PortalCitasContent() {
  const { user } = useAuthStore();
  const { citas, updateEstado } = useCitasStore();
  const { medicos } = useMedicosStore();
  
  const [showNuevaModal, setShowNuevaModal] = useState(false);

  // Filter only user's appointments
  const misCitas = citas.filter((c) => c.pacienteId === user?.id).sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  const handleCancelarCita = (cita: Cita) => {
    if (confirm("¿Estás seguro de que deseas cancelar esta cita?")) {
      updateEstado(cita.id, "CANCELADA");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-slate-900 dark:text-white text-2xl font-bold">Mis Citas Médicas</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Gestione sus citas con nuestros especialistas
          </p>
        </div>
        <button
          onClick={() => setShowNuevaModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Solicitar Cita
        </button>
      </div>

      {/* List */}
      {misCitas.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="w-8 h-8" />
          </div>
          <h3 className="text-slate-900 dark:text-white font-semibold mb-1">No tienes citas agendadas</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
            Puedes solicitar una nueva cita médica en cualquier momento para ser atendido.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {misCitas.map((cita) => {
            const medico = medicos.find(m => m.id === cita.medicoId);
            const isPendingOrConfirmed = cita.estado === "PENDIENTE" || cita.estado === "CONFIRMADA";

            return (
              <div
                key={cita.id}
                className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <CitaEstadoBadge estado={cita.estado} />
                    {isPendingOrConfirmed && (
                      <button 
                        onClick={() => handleCancelarCita(cita)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Cancelar cita"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <h3 className="text-slate-900 dark:text-white font-semibold text-lg leading-tight mb-1">
                    Dr. {medico ? `${medico.nombre} ${medico.apellido}` : cita.medicoNombre}
                  </h3>
                  <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-4">
                    {medico?.especialidadNombre || "Especialidad"}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
                      <CalendarDays className="w-4 h-4 text-slate-400" />
                      <span>{formatDate(cita.fecha)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{cita.hora}</span>
                    </div>
                    <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300 text-sm">
                      <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{cita.motivo}</span>
                    </div>
                  </div>
                </div>

                {cita.estado === "PENDIENTE" && (
                  <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200/50 dark:border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 flex items-center justify-center font-medium">
                    Esperando confirmación de recepción
                  </div>
                )}
                
                {cita.estado === "COMPLETADA" && cita.notas && (
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200/50 dark:border-blue-500/20 text-xs text-blue-700 dark:text-blue-400">
                    <strong>Nota del médico:</strong> {cita.notas}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <SolicitarCitaModal open={showNuevaModal} onClose={() => setShowNuevaModal(false)} />
    </div>
  );
}
