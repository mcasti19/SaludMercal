"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Upload, FileImage, Image as ImageIcon } from "lucide-react";
import { reposoSchema, ReposoFormValues } from "@/lib/schemas";
import { useRepososStore } from "@/modules/reposos/reposos.store";
import { useAuthStore } from "@/modules/auth/auth.store";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NuevoReposoModal({ open, onClose }: Props) {
  const { addReposo } = useRepososStore();
  const { user } = useAuthStore();
  const [adjuntoPreview, setAdjuntoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReposoFormValues>({
    resolver: zodResolver(reposoSchema),
  });

  useEffect(() => {
    if (!open) {
      reset();
      setAdjuntoPreview(null);
    }
  }, [open, reset]);

  const handleAdjuntoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setAdjuntoPreview(base64);
      setValue("adjuntoBase64", base64);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = (data: ReposoFormValues) => {
    if (!user) return;
    addReposo({
      ...data,
      empleadoId: user.id,
      empleadoNombre: `${user.nombre} ${user.apellido}`,
      adjuntoBase64: data.adjuntoBase64 || undefined,
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
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div>
            <h2 className="text-slate-900 dark:text-white font-semibold text-base">Cargar Nuevo Reposo</h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Reporte una ausencia por motivos médicos</p>
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
          <form id="nuevo-reposo-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Fechas */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Fecha Inicio *</label>
                <input type="date" {...register("fechaInicio")} className={inputCls} />
                {errors.fechaInicio && <p className={errorCls}>{errors.fechaInicio.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Fecha Fin *</label>
                <input type="date" {...register("fechaFin")} className={inputCls} />
                {errors.fechaFin && <p className={errorCls}>{errors.fechaFin.message}</p>}
              </div>
            </div>

            {/* Tipo */}
            <div>
              <label className={labelCls}>Tipo de Reposo *</label>
              <select {...register("tipo")} className={inputCls}>
                <option value="">Seleccione el tipo...</option>
                <option value="ENFERMEDAD">Enfermedad Común</option>
                <option value="LABORAL">Enfermedad Laboral</option>
                <option value="ACCIDENTE">Accidente</option>
                <option value="MATERNIDAD">Maternidad</option>
              </select>
              {errors.tipo && <p className={errorCls}>{errors.tipo.message}</p>}
            </div>

            {/* Médico */}
            <div>
              <label className={labelCls}>Médico Tratante *</label>
              <input {...register("medicoTratante")} placeholder="Dr. Juan Pérez" className={inputCls} />
              {errors.medicoTratante && <p className={errorCls}>{errors.medicoTratante.message}</p>}
            </div>

            {/* Diagnóstico */}
            <div>
              <label className={labelCls}>Diagnóstico *</label>
              <textarea
                {...register("diagnostico")}
                placeholder="Breve descripción del diagnóstico..."
                className={inputCls}
                rows={3}
              />
              {errors.diagnostico && <p className={errorCls}>{errors.diagnostico.message}</p>}
            </div>

            {/* Adjunto */}
            <div>
              <label className={labelCls}>Documento Adjunto (Opcional)</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors overflow-hidden group"
              >
                {adjuntoPreview ? (
                  adjuntoPreview.startsWith("data:image") ? (
                    <img src={adjuntoPreview} alt="Adjunto" className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="flex flex-col items-center text-emerald-500">
                      <FileImage className="w-8 h-8 mb-2" />
                      <span className="text-xs font-medium">Documento cargado</span>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center text-slate-400 dark:text-slate-500 group-hover:text-emerald-500 transition-colors">
                    <ImageIcon className="w-8 h-8 mb-2" />
                    <span className="text-sm font-medium">Clic para subir imagen o PDF</span>
                    <span className="text-xs opacity-70 mt-1">Máximo 5MB</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleAdjuntoChange}
              />
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
            form="nuevo-reposo-form"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-semibold shadow-md shadow-emerald-500/20 transition-all disabled:opacity-60"
          >
            Cargar Reposo
          </button>
        </div>
      </div>
    </div>
  );
}
