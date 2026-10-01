"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { citaSchema, CitaFormValues } from "@/lib/schemas";
import { useCitasStore } from "@/modules/citas/citas.store";
import { useMedicosStore } from "@/modules/medicos/medicos.store";
import { useAuthStore } from "@/modules/auth/auth.store";
import { HORAS_DISPONIBLES } from "@/lib/constants";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SolicitarCitaModal({ open, onClose }: Props) {
  const { addCita } = useCitasStore();
  const { medicos, especialidades } = useMedicosStore();
  const { user } = useAuthStore();
  
  const [selectedEspecialidad, setSelectedEspecialidad] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CitaFormValues>({
    resolver: zodResolver(citaSchema),
    defaultValues: {
      estado: "PENDIENTE",
      pacienteId: user?.id ?? "", // Empleados no escogen paciente, son ellos mismos
    },
  });

  const watchEspecialidad = watch("especialidad", selectedEspecialidad);

  useEffect(() => {
    if (!open) {
      reset({ estado: "PENDIENTE", pacienteId: user?.id ?? "" });
      setSelectedEspecialidad("");
    }
  }, [open, reset, user]);

  const onSubmit = (data: CitaFormValues) => {
    if (!user) return;
    
    // El empleado SIEMPRE se pide a sí mismo, pero debemos buscar si ya está en pacientes?
    // Para simplificar, crearemos la cita con sus datos de AuthUser
    // The backend would handle creating the patient if it doesn't exist
    
    addCita({
      pacienteId: user.id,
      pacienteNombre: `${user.nombre} ${user.apellido}`,
      pacienteCedula: user.cedula,
      medicoId: data.medicoId,
      fecha: data.fecha,
      hora: data.hora,
      motivo: data.motivo,
      estado: "PENDIENTE", // Require confirmación administrativa
    });
    
    onClose();
  };

  if (!open) return null;

  const medicosDisponibles = medicos.filter(
    (m) => m.activo && m.especialidadId === selectedEspecialidad
  );

  const inputCls =
    "w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all";
  const labelCls = "block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider";
  const errorCls = "text-red-500 dark:text-red-400 text-xs mt-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div>
            <h2 className="text-slate-900 dark:text-white font-semibold text-base">Solicitar Cita</h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">La cita quedará sujeta a confirmación</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <form id="solicitar-cita-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Especialidad */}
            <div>
              <label className={labelCls}>Especialidad requerida *</label>
              <select
                className={inputCls}
                value={selectedEspecialidad}
                onChange={(e) => {
                  setSelectedEspecialidad(e.target.value);
                  // clear medico selection
                }}
              >
                <option value="">Seleccione una especialidad...</option>
                {especialidades.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </div>

            {/* Medico */}
            <div>
              <label className={labelCls}>Médico *</label>
              <select
                {...register("medicoId")}
                className={inputCls}
                disabled={!selectedEspecialidad}
              >
                <option value="">Seleccione un médico...</option>
                {medicosDisponibles.map((m) => (
                  <option key={m.id} value={m.id}>
                    Dr. {m.nombre} {m.apellido} - Turno {m.turno.toLowerCase()}
                  </option>
                ))}
              </select>
              {errors.medicoId && <p className={errorCls}>{errors.medicoId.message}</p>}
            </div>

            {/* Fecha y Hora */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Fecha *</label>
                <input
                  type="date"
                  {...register("fecha")}
                  min={new Date().toISOString().split("T")[0]}
                  className={inputCls}
                />
                {errors.fecha && <p className={errorCls}>{errors.fecha.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Hora *</label>
                <select {...register("hora")} className={inputCls}>
                  <option value="">Hora...</option>
                  {HORAS_DISPONIBLES.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                {errors.hora && <p className={errorCls}>{errors.hora.message}</p>}
              </div>
            </div>

            {/* Motivo */}
            <div>
              <label className={labelCls}>Motivo de la consulta *</label>
              <textarea
                {...register("motivo")}
                placeholder="Describa sus síntomas o razón de la cita..."
                className={inputCls}
                rows={3}
              />
              {errors.motivo && <p className={errorCls}>{errors.motivo.message}</p>}
            </div>
            
            {/* Ocultamos pacienteId ya que es autoasignado */}
            <input type="hidden" {...register("pacienteId")} value={user?.id} />

          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-700 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="solicitar-cita-form"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-semibold shadow-md shadow-emerald-500/20 transition-all disabled:opacity-60"
          >
            Enviar Solicitud
          </button>
        </div>
      </div>
    </div>
  );
}
