"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, FileText, Paperclip, X } from "lucide-react";
import { examenSchema, ExamenFormValues } from "@/lib/schemas";
import { Cita, Especialidad } from "@/types";
import { useExamenesStore } from "./examenes.store";
import { formatFileSize, validateExamFiles } from "./examenes.utils";

interface NuevoExamenModalProps {
  open: boolean;
  onClose: () => void;
  patientId: string;
  especialidades: Especialidad[];
  citas: Cita[];
}

const today = () => new Date().toISOString().slice(0, 10);

export function NuevoExamenModal({ open, onClose, patientId, especialidades, citas }: NuevoExamenModalProps) {
  const addExamen = useExamenesStore((s) => s.addExamen);
  const [archivos, setArchivos] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExamenFormValues>({
    resolver: zodResolver(examenSchema),
    defaultValues: { fecha: today() },
  });

  useEffect(() => {
    if (!open) {
      reset({ fecha: today() });
      setArchivos([]);
      setFileError(null);
      setSubmitError(null);
    }
  }, [open, reset]);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const next = [...archivos, ...selected];
    setArchivos(next);
    setFileError(validateExamFiles(next));
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    const next = archivos.filter((_, i) => i !== index);
    setArchivos(next);
    setFileError(next.length ? validateExamFiles(next) : null);
  };

  const onSubmit = async (data: ExamenFormValues) => {
    setSubmitError(null);
    const error = validateExamFiles(archivos);
    if (error) {
      setFileError(error);
      return;
    }

    const ok = await addExamen(patientId, {
      ...data,
      citaId: data.citaId || undefined,
      notas: data.notas || undefined,
      archivos,
    });
    if (ok) {
      onClose();
    } else {
      setSubmitError(useExamenesStore.getState().error ?? "No se pudo cargar el examen.");
    }
  };

  if (!open) return null;

  const inputCls =
    "w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all";
  const labelCls = "block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider";
  const errorCls = "text-red-500 dark:text-red-400 text-xs mt-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div>
            <h2 className="text-slate-900 dark:text-white font-semibold text-base">Cargar Examen Médico</h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              Se agregará al expediente del paciente
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5">
          <form id="nuevo-examen-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Especialidad *</label>
                <select {...register("especialidadId")} className={inputCls}>
                  <option value="">Seleccione...</option>
                  {especialidades.map((e) => (
                    <option key={e.id} value={e.id}>{e.nombre}</option>
                  ))}
                </select>
                {errors.especialidadId && <p className={errorCls}>{errors.especialidadId.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Fecha del examen *</label>
                <input type="date" max={today()} {...register("fecha")} className={inputCls} />
                {errors.fecha && <p className={errorCls}>{errors.fecha.message}</p>}
              </div>
            </div>

            <div>
              <label className={labelCls}>Título *</label>
              <input {...register("titulo")} placeholder="Ej: Hematología completa" className={inputCls} />
              {errors.titulo && <p className={errorCls}>{errors.titulo.message}</p>}
            </div>

            <div>
              <label className={labelCls}>Vincular a una cita (opcional)</label>
              <select {...register("citaId")} className={inputCls}>
                <option value="">Sin vincular</option>
                {citas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fecha} · {c.especialidad} — {c.motivo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Observaciones</label>
              <textarea {...register("notas")} rows={2} className={inputCls} />
              {errors.notas && <p className={errorCls}>{errors.notas.message}</p>}
            </div>

            <div>
              <label className={labelCls}>Archivos * (PDF, JPG o PNG · máx. 10 MB c/u)</label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="application/pdf,image/jpeg,image/png"
                onChange={handleFiles}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                <Paperclip className="w-4 h-4" />
                Seleccionar archivos
              </button>
              {archivos.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {archivos.map((f, i) => (
                    <li
                      key={`${f.name}-${i}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 text-sm"
                    >
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="flex-1 truncate text-slate-700 dark:text-slate-200">{f.name}</span>
                      <span className="text-xs text-slate-400">{formatFileSize(f.size)}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        aria-label={`Quitar ${f.name}`}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {fileError && <p className={errorCls}>{fileError}</p>}
            </div>

            {submitError && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}
          </form>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-700 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="nuevo-examen-form"
            disabled={isSubmitting || !!fileError}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold hover:from-blue-400 hover:to-cyan-400 disabled:opacity-60 transition-all"
          >
            {isSubmitting ? "Cargando..." : "Cargar examen"}
          </button>
        </div>
      </div>
    </div>
  );
}

