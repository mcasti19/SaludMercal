"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/modules/auth/auth.store";
import { useCitasStore } from "@/modules/citas/citas.store";
import { useMedicosStore } from "@/modules/medicos/medicos.store";
import { SolicitarCitaModal } from "./SolicitarCitaModal";
import { CitaEstadoBadge } from "@/components/shared/CitaEstadoBadge";
import { CalendarDays, Plus, Clock, FileText, XCircle, Loader2, AlertCircle, Download } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Cita } from "@/types";
import { apiDownloadAppointmentPrescription, downloadBlobAsFile } from "@/lib/api";

export function PortalCitasContent() {
  const { user } = useAuthStore();
  const { citas, isLoading, error, fetchCitas, updateEstado } = useCitasStore();
  const { medicos, fetchMedicos } = useMedicosStore();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [downloadingPrescriptionId, setDownloadingPrescriptionId] = useState<string | null>(null);
  
  const [showNuevaModal, setShowNuevaModal] = useState(false);

  const handleDownloadPrescription = async (cita: Cita) => {
    try {
      setDownloadingPrescriptionId(cita.id);
      const blob = await apiDownloadAppointmentPrescription(cita.id);
      downloadBlobAsFile(blob, `recipe-cita-${cita.id}.pdf`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al descargar récipe médico");
    } finally {
      setDownloadingPrescriptionId(null);
    }
  };

  useEffect(() => {
    fetchCitas();
    fetchMedicos();
  }, [fetchCitas, fetchMedicos]);

  // For employee role, backend already scopes to the authenticated patient's records
  const misCitas = (
    user?.role === "EMPLEADO"
      ? citas
      : citas.filter(
          (c) =>
            c.pacienteId === user?.patientId ||
            c.pacienteId === user?.id
        )
  ).sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  const handleCancelarCita = async (cita: Cita) => {
    if (confirm("¿Estás seguro de que deseas cancelar esta cita?")) {
      setCancellingId(cita.id);
      try {
        await updateEstado(cita.id, "CANCELADA");
      } finally {
        setCancellingId(null);
      }
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
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Solicitar Cita
        </button>
      </div>

      {/* Error alert banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="flex-1 font-medium">{error}</p>
          <button
            onClick={() => fetchCitas()}
            className="text-xs font-semibold underline hover:text-red-700"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* List */}
      {isLoading && citas.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
          <p className="font-medium text-sm text-slate-500 dark:text-slate-400">
            Cargando sus citas médicas...
          </p>
        </div>
      ) : misCitas.length === 0 ? (
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
            const medico = medicos.find((m) => m.id === cita.medicoId);
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
                        disabled={cancellingId === cita.id}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Cancelar cita"
                      >
                        {cancellingId === cita.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                  
                  <h3 className="text-slate-900 dark:text-white font-semibold text-lg leading-tight mb-1">
                    {medico ? `Dr. ${medico.nombre} ${medico.apellido}` : cita.medicoNombre}
                  </h3>
                  <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-4">
                    {medico?.especialidadNombre || cita.especialidad || "Especialidad"}
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
                
                {cita.estado === "COMPLETADA" && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex justify-end">
                    <button
                      onClick={() => handleDownloadPrescription(cita)}
                      disabled={downloadingPrescriptionId === cita.id}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold transition-colors border border-emerald-200 dark:border-emerald-500/20 disabled:opacity-50"
                    >
                      {downloadingPrescriptionId === cita.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      Descargar Récipe / Indicaciones (PDF)
                    </button>
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
