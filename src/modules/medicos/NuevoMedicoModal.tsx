"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Upload, UserCircle2 } from "lucide-react";
import { medicoSchema, MedicoFormValues } from "@/lib/schemas";
import { useMedicosStore } from "./medicos.store";
import { TURNOS_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";

const DIAS_SEMANA = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

const TURNO_OPTIONS = Object.entries(TURNOS_CONFIG).map(([k, v]) => ({
  value: k as "MANANA" | "TARDE" | "NOCTURNO",
  label: `${v.label} (${v.hours})`,
}));

export function NuevoMedicoModal({ open, onClose }: Props) {
  const { addMedico, especialidades } = useMedicosStore();
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MedicoFormValues>({
    resolver: zodResolver(medicoSchema),
    defaultValues: { activo: true, diasLaborables: [1, 2, 3, 4, 5] },
  });

  useEffect(() => {
    if (!open) {
      reset({ activo: true, diasLaborables: [1, 2, 3, 4, 5] });
      setFotoPreview(null);
    }
  }, [open, reset]);

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setFotoPreview(base64);
      setValue("fotoPerfil", base64);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = (data: MedicoFormValues) => {
    const especialidadObj = especialidades.find(e => e.id === data.especialidadId);
    addMedico({
      ...data,
      especialidadNombre: especialidadObj?.nombre || "",
      cedula: data.cedula || undefined,
      telefono: data.telefono || undefined,
      email: data.email || undefined,
      fotoPerfil: data.fotoPerfil || undefined,
    });
    onClose();
  };

  if (!open) return null;

  const inputCls =
    "w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all";
  const labelCls = "block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider";
  const errorCls = "text-red-500 dark:text-red-400 text-xs mt-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div>
            <h2 className="text-slate-900 dark:text-white font-semibold text-base">Registrar Médico</h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Complete los datos del nuevo médico</p>
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
          <form id="nuevo-medico-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Foto de perfil */}
            <div className="flex flex-col items-center gap-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 border-2 border-dashed border-blue-300 dark:border-blue-700 flex items-center justify-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors overflow-hidden group"
              >
                {fotoPreview ? (
                  <img src={fotoPreview} alt="Foto" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-blue-400 dark:text-blue-500 group-hover:text-blue-500">
                    <UserCircle2 className="w-8 h-8" />
                    <Upload className="w-3 h-3" />
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Clic para subir foto de perfil
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFotoChange}
              />
            </div>

            {/* Nombre + Apellido */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Nombre *</label>
                <input {...register("nombre")} placeholder="Carlos" className={inputCls} />
                {errors.nombre && <p className={errorCls}>{errors.nombre.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Apellido *</label>
                <input {...register("apellido")} placeholder="Rodríguez" className={inputCls} />
                {errors.apellido && <p className={errorCls}>{errors.apellido.message}</p>}
              </div>
            </div>

            {/* Cédula */}
            <div>
              <label className={labelCls}>Cédula</label>
              <input {...register("cedula")} placeholder="V-12345678" className={inputCls} />
              {errors.cedula && <p className={errorCls}>{errors.cedula.message}</p>}
            </div>

            {/* Especialidad */}
            <div>
              <label className={labelCls}>Especialidad *</label>
              <select {...register("especialidadId")} className={inputCls}>
                <option value="">Seleccione una especialidad...</option>
                {especialidades.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
              {errors.especialidadId && <p className={errorCls}>{errors.especialidadId.message}</p>}
            </div>

            {/* Turno */}
            <div>
              <label className={labelCls}>Turno *</label>
              <select {...register("turno")} className={inputCls}>
                <option value="">Seleccione un turno...</option>
                {TURNO_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {errors.turno && <p className={errorCls}>{errors.turno.message}</p>}
            </div>

            {/* Días Laborables */}
            <div>
              <label className={labelCls}>Días Laborables *</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {DIAS_SEMANA.map((dia) => {
                  const currentDias = watch("diasLaborables") || [];
                  const isSelected = currentDias.includes(dia.value);
                  return (
                    <button
                      key={dia.value}
                      type="button"
                      onClick={() => {
                        const newDias = isSelected
                          ? currentDias.filter((d) => d !== dia.value)
                          : [...currentDias, dia.value];
                        setValue("diasLaborables", newDias, { shouldValidate: true });
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
                        isSelected
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20"
                          : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-emerald-500/50"
                      )}
                    >
                      {dia.label}
                    </button>
                  );
                })}
              </div>
              {errors.diasLaborables && <p className={errorCls}>{errors.diasLaborables.message}</p>}
            </div>

            {/* Horario personalizado */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Hora Inicio</label>
                <input type="time" {...register("horaInicio")} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Hora Fin</label>
                <input type="time" {...register("horaFin")} className={inputCls} />
              </div>
            </div>

            {/* Cubículo */}
            <div>
              <label className={labelCls}>Cubículo / Consultorio *</label>
              <input {...register("cubiculo")} placeholder="01" className={inputCls} />
              {errors.cubiculo && <p className={errorCls}>{errors.cubiculo.message}</p>}
            </div>

            {/* Teléfono + Email */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Teléfono</label>
                <input {...register("telefono")} placeholder="0414-1234567" className={inputCls} />
                {errors.telefono && <p className={errorCls}>{errors.telefono.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input {...register("email")} type="email" placeholder="dr@mercal.gob.ve" className={inputCls} />
                {errors.email && <p className={errorCls}>{errors.email.message}</p>}
              </div>
            </div>

            {/* Estado */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <input
                id="medico-activo"
                type="checkbox"
                {...register("activo")}
                defaultChecked
                className="w-4 h-4 rounded accent-blue-500"
              />
              <label htmlFor="medico-activo" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                Médico activo (disponible para nuevas citas)
              </label>
            </div>
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
            form="nuevo-medico-form"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition-all disabled:opacity-60"
          >
            Registrar Médico
          </button>
        </div>
      </div>
    </div>
  );
}
