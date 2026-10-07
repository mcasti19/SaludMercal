"use client";

import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { citaSchema, CitaFormValues } from "@/lib/schemas";
import { useCitasStore } from "@/modules/citas/citas.store";
import { Paciente, Medico } from "@/types";
import { HORAS_DISPONIBLES } from "@/lib/constants";

interface NuevaCitaModalProps {
  onClose: () => void;
  pacientes: Paciente[];
  medicos: Medico[];
}

export function NuevaCitaModal({ onClose, pacientes, medicos }: NuevaCitaModalProps) {
  const { addCita } = useCitasStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CitaFormValues>({
    resolver: zodResolver(citaSchema),
    defaultValues: {
      fecha: new Date().toISOString().split("T")[0],
      estado: "PENDIENTE",
    },
  });

  const medicoId = watch("medicoId");
  const selectedMedico = medicos.find((m) => m.id === medicoId);

  const onSubmit = (data: CitaFormValues) => {
    const paciente = pacientes.find((p) => p.id === data.pacienteId);
    const medico = medicos.find((m) => m.id === data.medicoId);

    if (!paciente || !medico) return;

    addCita({
      pacienteId: paciente.id,
      pacienteNombre: `${paciente.nombre} ${paciente.apellido}`,
      pacienteCedula: paciente.cedula,
      medicoId: medico.id,
      medicoNombre: `Dr. ${medico.nombre} ${medico.apellido}`,
      especialidad: medico.especialidadNombre,
      fecha: data.fecha,
      hora: data.hora,
      estado: data.estado,
      motivo: data.motivo,
      notas: data.notas,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl shadow-black/40 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700/50">
          <h2 className="text-slate-900 dark:text-white font-semibold">Nueva Cita Médica</h2>
          <button
            id="nueva-cita-close-btn"
            onClick={onClose}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} id="nueva-cita-form" className="p-6 space-y-4">
          {/* Paciente */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
              Paciente
            </label>
            <select
              id="nueva-cita-paciente-select"
              {...register("pacienteId")}
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
            >
              <option value="">Seleccionar paciente...</option>
              {pacientes.filter(p => p.estado === "ACTIVO").map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} {p.apellido} — {p.cedula}
                </option>
              ))}
            </select>
            {errors.pacienteId && (
              <p className="text-red-400 text-xs">{errors.pacienteId.message}</p>
            )}
          </div>

          {/* Médico */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
              Médico
            </label>
            <select
              id="nueva-cita-medico-select"
              {...register("medicoId")}
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
            >
              <option value="">Seleccionar médico...</option>
              {medicos.filter(m => m.activo).map((m) => (
                <option key={m.id} value={m.id}>
                  Dr. {m.nombre} {m.apellido} — {m.especialidadNombre}
                </option>
              ))}
            </select>
            {selectedMedico && (
              <p className="text-slate-500 text-xs pl-1">
                Turno: {selectedMedico.turno === "MANANA" ? "Mañana" : selectedMedico.turno === "TARDE" ? "Tarde" : "Nocturno"} · Cubículo: {selectedMedico.cubiculo}
              </p>
            )}
            {errors.medicoId && (
              <p className="text-red-400 text-xs">{errors.medicoId.message}</p>
            )}
          </div>

          {/* Fecha & Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                Fecha
              </label>
              <input
                id="nueva-cita-fecha-input"
                type="date"
                {...register("fecha")}
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
              {errors.fecha && (
                <p className="text-red-400 text-xs">{errors.fecha.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                Hora
              </label>
              <select
                id="nueva-cita-hora-select"
                {...register("hora")}
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              >
                <option value="">Seleccionar...</option>
                {HORAS_DISPONIBLES.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              {errors.hora && (
                <p className="text-red-400 text-xs">{errors.hora.message}</p>
              )}
            </div>
          </div>

          {/* Motivo */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
              Motivo de la Consulta
            </label>
            <textarea
              id="nueva-cita-motivo-textarea"
              {...register("motivo")}
              rows={3}
              placeholder="Describa el motivo de la consulta..."
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all resize-none"
            />
            {errors.motivo && (
              <p className="text-red-400 text-xs">{errors.motivo.message}</p>
            )}
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
              Notas Adicionales <span className="text-slate-500">(opcional)</span>
            </label>
            <textarea
              id="nueva-cita-notas-textarea"
              {...register("notas")}
              rows={2}
              placeholder="Información adicional relevante..."
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all resize-none"
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
              id="nueva-cita-submit-btn"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold hover:from-blue-400 hover:to-cyan-400 transition-all disabled:opacity-60"
            >
              Registrar Cita
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
