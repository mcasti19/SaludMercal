"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Calendar as CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { citaSchema, CitaFormValues } from "@/lib/schemas";
import { useCitasStore } from "@/modules/citas/citas.store";
import { useMedicosStore } from "@/modules/medicos/medicos.store";
import { useAuthStore } from "@/modules/auth/auth.store";
import { generarSlotsDisponibles } from "@/lib/date-utils";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SolicitarCitaModal({ open, onClose }: Props) {
  const { citas, addCita } = useCitasStore();
  const { medicos, especialidades } = useMedicosStore();
  const { user } = useAuthStore();
  
  const [selectedEspecialidad, setSelectedEspecialidad] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CitaFormValues>({
    resolver: zodResolver(citaSchema),
    defaultValues: {
      estado: "PENDIENTE",
      pacienteId: user?.id ?? "",
    },
  });

  const watchMedicoId = watch("medicoId");
  const watchFecha = watch("fecha"); // Store as "yyyy-MM-dd"
  const watchHora = watch("hora");

  // Computed properties
  const medicosDisponibles = medicos.filter(
    (m) => m.activo && m.especialidadId === selectedEspecialidad
  );
  
  const selectedMedico = medicos.find(m => m.id === watchMedicoId);
  const selectedDateObj = watchFecha ? new Date(`${watchFecha}T00:00:00`) : undefined;

  // Calculamos los slots dinámicos basados en la fecha y el médico
  const availableSlots = useMemo(() => {
    if (!selectedMedico || !selectedDateObj) return [];
    return generarSlotsDisponibles(selectedMedico, selectedDateObj, citas);
  }, [selectedMedico, selectedDateObj, citas]);

  // Si cambia el médico o la fecha, resetear la hora
  useEffect(() => {
    setValue("hora", "");
  }, [watchMedicoId, watchFecha, setValue]);

  useEffect(() => {
    if (!open) {
      reset({ estado: "PENDIENTE", pacienteId: user?.id ?? "", fecha: "", hora: "" });
      setSelectedEspecialidad("");
    }
  }, [open, reset, user]);

  const onSubmit = (data: CitaFormValues) => {
    if (!user) return;
    
    const selectedEspecialidadObj = especialidades.find(e => e.id === selectedEspecialidad);

    addCita({
      pacienteId: user.id,
      pacienteNombre: `${user.nombre} ${user.apellido}`,
      pacienteCedula: user.cedula,
      medicoId: data.medicoId,
      medicoNombre: selectedMedico ? `${selectedMedico.nombre} ${selectedMedico.apellido}` : "",
      especialidad: selectedEspecialidadObj?.nombre || "",
      fecha: data.fecha,
      hora: data.hora,
      motivo: data.motivo,
      estado: "PENDIENTE",
    });
    
    onClose();
  };

  if (!open) return null;

  const inputCls =
    "w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all";
  const labelCls = "block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider";
  const errorCls = "text-red-500 dark:text-red-400 text-xs mt-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
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
          <form id="solicitar-cita-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Especialidad & Medico */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Especialidad requerida *</label>
                <select
                  className={inputCls}
                  value={selectedEspecialidad}
                  onChange={(e) => {
                    setSelectedEspecialidad(e.target.value);
                    setValue("medicoId", "");
                  }}
                >
                  <option value="">Seleccione...</option>
                  {especialidades.map((e) => (
                    <option key={e.id} value={e.id}>{e.nombre}</option>
                  ))}
                </select>
              </div>

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
            </div>

            {/* Fecha y Hora Interactivas */}
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-4">
              <div>
                <label className={labelCls}>Fecha de la Cita *</label>
                <Controller
                  control={control}
                  name="fecha"
                  render={({ field }) => (
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          disabled={!watchMedicoId}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2.5 rounded-xl border bg-white dark:bg-slate-900 text-sm transition-all text-left font-normal",
                            !watchMedicoId ? "opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-700 text-slate-400" : "border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:border-emerald-500/50 hover:ring-2 hover:ring-emerald-500/10",
                            errors.fecha && "border-red-500"
                          )}
                        >
                          <span>
                            {field.value 
                              ? format(new Date(`${field.value}T00:00:00`), "EEEE, d 'de' MMMM yyyy", { locale: es })
                              : "Seleccione un día del calendario..."}
                          </span>
                          <CalendarIcon className="w-4 h-4 text-emerald-500 opacity-70" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(`${field.value}T00:00:00`) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              field.onChange(format(date, "yyyy-MM-dd"));
                              setCalendarOpen(false);
                            }
                          }}
                          disabled={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            
                            // Deshabilitar si es en el pasado
                            if (date < today) return true;

                            // Deshabilitar si el día de la semana no está en los diasLaborables del medico
                            if (selectedMedico?.diasLaborables) {
                              const dayOfWeek = date.getDay(); // 0=Dom, 1=Lun, etc
                              if (!selectedMedico.diasLaborables.includes(dayOfWeek)) {
                                return true;
                              }
                            }
                            
                            // Por defecto no permitir domingos (0) si el médico no tiene configurado
                            return !selectedMedico && date.getDay() === 0;
                          }}
                          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xl p-3"
                          classNames={{
                            day: "hover:bg-emerald-50 dark:hover:bg-emerald-500/20 rounded-md transition-colors",
                            today: "bg-slate-100 dark:bg-slate-800 font-bold",
                          }}
                          locale={es}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.fecha && <p className={errorCls}>{errors.fecha.message}</p>}
                {!watchMedicoId && (
                  <p className="text-xs text-slate-500 mt-1.5">Debe seleccionar un médico primero para ver disponibilidad.</p>
                )}
              </div>

              {watchFecha && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/50">
                  <label className={labelCls}>Bloques Disponibles *</label>
                  {availableSlots.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setValue("hora", slot, { shouldValidate: true })}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5",
                            watchHora === slot
                              ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                          )}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          {slot}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-center">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        No hay horas disponibles para este día. Por favor, seleccione otra fecha.
                      </p>
                    </div>
                  )}
                  {errors.hora && <p className={errorCls}>{errors.hora.message}</p>}
                </div>
              )}
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
            disabled={isSubmitting || !watchHora}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-semibold shadow-md shadow-emerald-500/20 transition-all disabled:opacity-60"
          >
            Enviar Solicitud
          </button>
        </div>
      </div>
    </div>
  );
}
