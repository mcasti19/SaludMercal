"use client";

import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { citaSchema, CitaFormValues } from "@/lib/schemas";
import { useCitasStore } from "@/modules/citas/citas.store";
import { Cita, CitaEstado } from "@/types";
import { HORAS_DISPONIBLES, CITA_ESTADO_CONFIG } from "@/lib/constants";

interface EditarCitaModalProps {
  cita: Cita;
  onClose: () => void;
}

export function EditarCitaModal({ cita, onClose }: EditarCitaModalProps) {
  const { updateCita } = useCitasStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CitaFormValues>({
    resolver: zodResolver(citaSchema),
    defaultValues: {
      pacienteId: cita.pacienteId,
      medicoId: cita.medicoId,
      fecha: cita.fecha,
      hora: cita.hora,
      estado: cita.estado,
      motivo: cita.motivo,
      notas: cita.notas ?? "",
    },
  });

  const onSubmit = (data: CitaFormValues) => {
    updateCita(cita.id, {
      fecha: data.fecha,
      hora: data.hora,
      estado: data.estado as CitaEstado,
      motivo: data.motivo,
      notas: data.notas,
    });
    onClose();
  };

  const ESTADOS_CITA: CitaEstado[] = [
    "PENDIENTE",
    "CONFIRMADA",
    "EN_ATENCION",
    "COMPLETADA",
    "CANCELADA",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl shadow-black/40 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700/50">
          <div>
            <h2 className="text-slate-900 dark:text-white font-semibold">Editar Cita</h2>
            <p className="text-slate-500 text-xs mt-0.5">{cita.id}</p>
          </div>
          <button
            id="editar-cita-close-btn"
            onClick={onClose}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} id="editar-cita-form" className="p-6 space-y-4">
          {/* Paciente (read-only) */}
          <div className="p-3 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
            <p className="text-slate-500 dark:text-slate-400 text-xs">Paciente</p>
            <p className="text-slate-900 dark:text-white font-medium mt-0.5">{cita.pacienteNombre}</p>
            <p className="text-slate-500 text-xs">{cita.pacienteCedula}</p>
          </div>

          {/* Médico (read-only) */}
          <div className="p-3 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
            <p className="text-slate-500 dark:text-slate-400 text-xs">Médico / Especialidad</p>
            <p className="text-slate-900 dark:text-white font-medium mt-0.5">{cita.medicoNombre}</p>
            <p className="text-slate-500 text-xs">{cita.especialidad}</p>
          </div>

          {/* Fecha & Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Fecha</label>
              <input
                id="editar-cita-fecha-input"
                type="date"
                {...register("fecha")}
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
              {errors.fecha && <p className="text-red-400 text-xs">{errors.fecha.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Hora</label>
              <select
                id="editar-cita-hora-select"
                {...register("hora")}
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              >
                {HORAS_DISPONIBLES.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Estado */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Estado</label>
            <select
              id="editar-cita-estado-select"
              {...register("estado")}
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
            >
              {ESTADOS_CITA.map((e) => (
                <option key={e} value={e}>{CITA_ESTADO_CONFIG[e].label}</option>
              ))}
            </select>
          </div>

          {/* Motivo */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Motivo</label>
            <textarea
              id="editar-cita-motivo-textarea"
              {...register("motivo")}
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all resize-none"
            />
            {errors.motivo && <p className="text-red-400 text-xs">{errors.motivo.message}</p>}
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
              Notas <span className="text-slate-500">(opcional)</span>
            </label>
            <textarea
              id="editar-cita-notas-textarea"
              {...register("notas")}
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="editar-cita-submit-btn"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold hover:from-blue-400 hover:to-cyan-400 transition-all disabled:opacity-60"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
