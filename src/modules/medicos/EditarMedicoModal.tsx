"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Upload, UserCircle2 } from "lucide-react";
import { medicoSchema, MedicoFormValues } from "@/lib/schemas";
import { useMedicosStore } from "./medicos.store";
import { Medico } from "@/types";
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
  medico: Medico;
  open: boolean;
  onClose: () => void;
}

const TURNO_OPTIONS = Object.entries(TURNOS_CONFIG).map(([k, v]) => ({
  value: k as "MANANA" | "TARDE" | "NOCTURNO",
  label: `${v.label} (${v.hours})`,
}));

export function EditarMedicoModal({ medico, open, onClose }: Props) {
  const { updateMedico, especialidades } = useMedicosStore();
  const [fotoPreview, setFotoPreview] = useState<string | null>(medico.fotoPerfil ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MedicoFormValues>({
    resolver: zodResolver(medicoSchema),
    defaultValues: {
      cedula: medico.cedula ?? "",
      nombre: medico.nombre,
      apellido: medico.apellido,
      especialidadId: medico.especialidadId,
      turno: medico.turno,
      horaInicio: medico.horaInicio ?? "",
      horaFin: medico.horaFin ?? "",
      cubiculo: medico.cubiculo,
      telefono: medico.telefono ?? "",
      email: medico.email ?? "",
      activo: medico.activo,
      fotoPerfil: medico.fotoPerfil ?? "",
      diasLaborables: medico.diasLaborables ?? [1, 2, 3, 4, 5],
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        cedula: medico.cedula ?? "",
        nombre: medico.nombre,
        apellido: medico.apellido,
        especialidadId: medico.especialidadId,
        turno: medico.turno,
        horaInicio: medico.horaInicio ?? "",
        horaFin: medico.horaFin ?? "",
        cubiculo: medico.cubiculo,
        telefono: medico.telefono ?? "",
        email: medico.email ?? "",
        activo: medico.activo,
        fotoPerfil: medico.fotoPerfil ?? "",
        diasLaborables: medico.diasLaborables ?? [1, 2, 3, 4, 5],
      });
      setFotoPreview(medico.fotoPerfil ?? null);
    }
  }, [open, medico, reset]);

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
    updateMedico(medico.id, {
      ...data,
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
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div>
            <h2 className="text-slate-900 dark:text-white font-semibold text-base">
              Editar Médico
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              Dr. {medico.nombre} {medico.apellido}
            </p>
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
          <form id="editar-medico-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Foto */}
            <div className="flex flex-col items-center gap-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 border-2 border-dashed border-blue-300 dark:border-blue-700 flex items-center justify-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors overflow-hidden group"
              >
                {fotoPreview ? (
                  <img src={fotoPreview} alt="Foto" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-blue-400 dark:text-blue-500">
                    <UserCircle2 className="w-8 h-8" />
                    <Upload className="w-3 h-3" />
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Cambiar foto de perfil</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFotoChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Nombre *</label>
                <input {...register("nombre")} className={inputCls} />
                {errors.nombre && <p className={errorCls}>{errors.nombre.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Apellido *</label>
                <input {...register("apellido")} className={inputCls} />
                {errors.apellido && <p className={errorCls}>{errors.apellido.message}</p>}
              </div>
            </div>

            <div>
              <label className={labelCls}>Cédula</label>
              <input {...register("cedula")} placeholder="V-12345678" className={inputCls} />
              {errors.cedula && <p className={errorCls}>{errors.cedula.message}</p>}
            </div>

            <div>
              <label className={labelCls}>Especialidad *</label>
              <select {...register("especialidadId")} className={inputCls}>
                {especialidades.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
              {errors.especialidadId && <p className={errorCls}>{errors.especialidadId.message}</p>}
            </div>

            <div>
              <label className={labelCls}>Turno *</label>
              <select {...register("turno")} className={inputCls}>
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

            <div>
              <label className={labelCls}>Cubículo *</label>
              <input {...register("cubiculo")} className={inputCls} />
              {errors.cubiculo && <p className={errorCls}>{errors.cubiculo.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Teléfono</label>
                <input {...register("telefono")} placeholder="0414-1234567" className={inputCls} />
                {errors.telefono && <p className={errorCls}>{errors.telefono.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input {...register("email")} type="email" className={inputCls} />
                {errors.email && <p className={errorCls}>{errors.email.message}</p>}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <input
                id="editar-medico-activo"
                type="checkbox"
                {...register("activo")}
                className="w-4 h-4 rounded accent-blue-500"
              />
              <label htmlFor="editar-medico-activo" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
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
            form="editar-medico-form"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition-all disabled:opacity-60"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}
