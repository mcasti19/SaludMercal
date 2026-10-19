"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  Clock,
  Loader2,
  User,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import {
  ApiBeneficiary,
  apiGetDoctorAvailability,
  apiGetMyPatient,
} from "@/lib/api";
import { generarSlotsDisponibles } from "@/lib/date-utils";
import { CitaFormValues, citaSchema } from "@/lib/schemas";
import { useAuthStore } from "@/modules/auth/auth.store";
import { useCitasStore } from "@/modules/citas/citas.store";
import { useMedicosStore } from "@/modules/medicos/medicos.store";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const RELATIONSHIP_LABELS: Record<string, string> = {
  conyuge: "Cónyuge",
  hijo: "Hijo",
  hija: "Hija",
  padre: "Padre",
  madre: "Madre",
};

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
  const [serverSlots, setServerSlots] = useState<string[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  // Beneficiarios para agendar
  const [appointmentFor, setAppointmentFor] = useState<"titular" | "familiar">(
    "titular",
  );
  const [beneficiaries, setBeneficiaries] = useState<ApiBeneficiary[]>([]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CitaFormValues>({
    resolver: zodResolver(citaSchema),
    defaultValues: {
      estado: "PENDIENTE",
      pacienteId: user?.patientId ?? user?.id ?? "",
    },
  });

  const watchMedicoId = watch("medicoId");
  const watchFecha = watch("fecha"); // Store as "yyyy-MM-dd"
  const watchHora = watch("hora");

  // Computed properties
  const medicosDisponibles = medicos.filter(
    (m) => m.activo && m.especialidadId === selectedEspecialidad,
  );

  const selectedMedico = medicos.find((m) => m.id === watchMedicoId);
  const selectedDateObj = watchFecha
    ? new Date(`${watchFecha}T00:00:00`)
    : undefined;

  // Local fallback slots
  const fallbackSlots = useMemo(() => {
    if (!selectedMedico || !selectedDateObj) return [];
    return generarSlotsDisponibles(selectedMedico, selectedDateObj, citas);
  }, [selectedMedico, selectedDateObj, citas]);

  const availableSlots = serverSlots !== null ? serverSlots : fallbackSlots;

  // Fetch real slots from backend whenever doctor or date changes
  useEffect(() => {
    setValue("hora", "");
    setServerSlots(null);

    if (!watchMedicoId || !watchFecha) {
      return;
    }

    let isMounted = true;
    setLoadingSlots(true);

    apiGetDoctorAvailability(watchMedicoId, watchFecha)
      .then((res) => {
        if (!isMounted) return;
        if (res.slots && Array.isArray(res.slots)) {
          setServerSlots(res.slots);
        } else {
          setServerSlots(null);
        }
      })
      .catch(() => {
        if (isMounted) setServerSlots(null);
      })
      .finally(() => {
        if (isMounted) setLoadingSlots(false);
      });

    return () => {
      isMounted = false;
    };
  }, [watchMedicoId, watchFecha, setValue]);

  // Cargar beneficiarios del paciente al abrir el modal
  useEffect(() => {
    if (open) {
      apiGetMyPatient()
        .then((p) => {
          setBeneficiaries(p.beneficiaries ?? []);
        })
        .catch(() => {});
    }
  }, [open]);

  const handleClose = useCallback(() => {
    reset({
      estado: "PENDIENTE",
      pacienteId: user?.patientId ?? user?.id ?? "",
      fecha: "",
      hora: "",
    });
    setSelectedEspecialidad("");
    setServerSlots(null);
    setSubmitError(null);
    setIsSubmittingForm(false);
    onClose();
  }, [reset, user, onClose]);

  const onSubmit = async (data: CitaFormValues) => {
    if (!user) return;
    setIsSubmittingForm(true);
    setSubmitError(null);

    const selectedEspecialidadObj = especialidades.find(
      (e) => e.id === selectedEspecialidad,
    );

    try {
      const ok = await addCita({
        pacienteId: user.patientId ?? user.id,
        beneficiaryId:
          appointmentFor === "familiar" ? data.beneficiaryId : undefined,
        pacienteNombre: `${user.nombre} ${user.apellido}`,
        pacienteCedula: user.cedula,
        medicoId: data.medicoId,
        medicoNombre: selectedMedico
          ? `Dr. ${selectedMedico.nombre} ${selectedMedico.apellido}`
          : "",
        especialidad:
          selectedEspecialidadObj?.nombre ||
          selectedMedico?.especialidadNombre ||
          "",
        fecha: data.fecha,
        hora: data.hora,
        motivo: data.motivo,
        estado: "PENDIENTE",
      });

      if (ok) {
        handleClose();
      } else {
        setSubmitError(
          "No se pudo agendar la cita. Verifique la disponibilidad del horario e intente de nuevo.",
        );
      }
    } catch {
      setSubmitError("Ocurrió un error inesperado al procesar la cita.");
    } finally {
      setIsSubmittingForm(false);
    }
  };

  if (!open) return null;

  const inputCls =
    "w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all";
  const labelCls =
    "block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider";
  const errorCls = "text-red-500 dark:text-red-400 text-xs mt-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={() => !isSubmittingForm && handleClose()}
      />

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div>
            <h2 className="text-slate-900 dark:text-white font-semibold text-base">
              Solicitar Cita
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              La cita quedará sujeta a confirmación médica
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmittingForm}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {submitError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <form
            id="solicitar-cita-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            {/* Selector: ¿Para quién es la cita? */}
            <div className="space-y-2">
              <label className={labelCls}>
                ¿Para quién es la consulta médica? *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAppointmentFor("titular");
                    setValue("beneficiaryId", undefined);
                  }}
                  className={cn(
                    "flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer",
                    appointmentFor === "titular"
                      ? "bg-emerald-500/15 border-emerald-500 text-emerald-400 font-semibold ring-1 ring-emerald-500/30"
                      : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600",
                  )}
                >
                  <User className="w-4 h-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs truncate font-semibold">
                      Para mí (Titular)
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {user?.nombre} {user?.apellido}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAppointmentFor("familiar");
                    if (beneficiaries.length > 0) {
                      setValue("beneficiaryId", String(beneficiaries[0].id));
                    }
                  }}
                  className={cn(
                    "flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer",
                    appointmentFor === "familiar"
                      ? "bg-emerald-500/15 border-emerald-500 text-emerald-400 font-semibold ring-1 ring-emerald-500/30"
                      : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600",
                  )}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs truncate font-semibold">
                      Para un Familiar
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      Hijo/a, Cónyuge o Padres
                    </p>
                  </div>
                </button>
              </div>

              {/* Selector de familiar beneficiario */}
              {appointmentFor === "familiar" && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-150">
                  {beneficiaries.length === 0 ? (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>
                        No tienes familiares registrados. Solicita su inclusión
                        en la recepción médica de tu sede.
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-400">
                        Seleccione el familiar beneficiario *
                      </label>
                      <select
                        className={inputCls}
                        value={
                          watch("beneficiaryId") ??
                          (beneficiaries[0] ? String(beneficiaries[0].id) : "")
                        }
                        onChange={(e) =>
                          setValue("beneficiaryId", e.target.value)
                        }
                      >
                        {beneficiaries.map((b) => (
                          <option key={b.id} value={String(b.id)}>
                            {b.first_name} {b.last_name} (
                            {RELATIONSHIP_LABELS[
                              b.relationship.toLowerCase()
                            ] ?? b.relationship}
                            ) {b.national_id ? `— C.I. ${b.national_id}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>

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
                  disabled={isSubmittingForm}
                >
                  <option value="">Seleccione...</option>
                  {especialidades.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Médico *</label>
                <select
                  {...register("medicoId")}
                  className={inputCls}
                  disabled={!selectedEspecialidad || isSubmittingForm}
                >
                  <option value="">Seleccione un médico...</option>
                  {medicosDisponibles.map((m) => (
                    <option key={m.id} value={m.id}>
                      Dr. {m.nombre} {m.apellido} - Turno{" "}
                      {m.turno.toLowerCase()}
                    </option>
                  ))}
                </select>
                {errors.medicoId && (
                  <p className={errorCls}>{errors.medicoId.message}</p>
                )}
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
                          disabled={!watchMedicoId || isSubmittingForm}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2.5 rounded-xl border bg-white dark:bg-slate-900 text-sm transition-all text-left font-normal",
                            !watchMedicoId
                              ? "opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-700 text-slate-400"
                              : "border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:border-emerald-500/50 hover:ring-2 hover:ring-emerald-500/10",
                            errors.fecha && "border-red-500",
                          )}
                        >
                          <span>
                            {field.value
                              ? format(
                                  new Date(`${field.value}T00:00:00`),
                                  "EEEE, d 'de' MMMM yyyy",
                                  { locale: es },
                                )
                              : "Seleccione un día del calendario..."}
                          </span>
                          <CalendarIcon className="w-4 h-4 text-emerald-500 opacity-70" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            field.value
                              ? new Date(`${field.value}T00:00:00`)
                              : undefined
                          }
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
                              if (
                                !selectedMedico.diasLaborables.includes(
                                  dayOfWeek,
                                )
                              ) {
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
                {errors.fecha && (
                  <p className={errorCls}>{errors.fecha.message}</p>
                )}
                {!watchMedicoId && (
                  <p className="text-xs text-slate-500 mt-1.5">
                    Debe seleccionar un médico primero para ver disponibilidad.
                  </p>
                )}
              </div>

              {watchFecha && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <label className={labelCls}>Bloques Disponibles *</label>
                    {loadingSlots && (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                        <Loader2 className="w-3 h-3 animate-spin" /> Consultando
                        agenda...
                      </span>
                    )}
                  </div>
                  {availableSlots.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          disabled={isSubmittingForm}
                          onClick={() =>
                            setValue("hora", slot, { shouldValidate: true })
                          }
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer",
                            watchHora === slot
                              ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/10",
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
                        {loadingSlots
                          ? "Cargando horarios disponibles..."
                          : "No hay horas disponibles para este día. Por favor, seleccione otra fecha."}
                      </p>
                    </div>
                  )}
                  {errors.hora && (
                    <p className={errorCls}>{errors.hora.message}</p>
                  )}
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
                disabled={isSubmittingForm}
              />
              {errors.motivo && (
                <p className={errorCls}>{errors.motivo.message}</p>
              )}
            </div>

            {/* Ocultamos pacienteId ya que es autoasignado */}
            <input
              type="hidden"
              {...register("pacienteId")}
              value={user?.patientId ?? user?.id}
            />
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-700 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmittingForm}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="solicitar-cita-form"
            disabled={isSubmittingForm || !watchHora}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-semibold shadow-md shadow-emerald-500/20 transition-all disabled:opacity-60 cursor-pointer"
          >
            {isSubmittingForm && <Loader2 className="w-4 h-4 animate-spin" />}
            Enviar Solicitud
          </button>
        </div>
      </div>
    </div>
  );
}
