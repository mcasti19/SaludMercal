"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, FileImage, Image as ImageIcon, Loader2, AlertCircle } from "lucide-react";
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [adjuntoPreview, setAdjuntoPreview] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ReposoFormValues>({
    resolver: zodResolver(reposoSchema),
  });

  const handleClose = () => {
    reset();
    setSelectedFile(null);
    setAdjuntoPreview(null);
    setSubmitError(null);
    setIsSubmittingForm(false);
    onClose();
  };

  const handleAdjuntoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setAdjuntoPreview(base64);
        setValue("adjuntoBase64", base64);
      };
      reader.readAsDataURL(file);
    } else {
      // PDF or other document
      setAdjuntoPreview(file.name);
      setValue("adjuntoBase64", file.name);
    }
  };

  const onSubmit = async (data: ReposoFormValues) => {
    if (!user) return;
    setIsSubmittingForm(true);
    setSubmitError(null);

    try {
      const ok = await addReposo(
        {
          ...data,
          empleadoId: user.patientId ?? user.id,
          empleadoNombre: `${user.nombre} ${user.apellido}`,
          adjuntoBase64: adjuntoPreview || undefined,
        },
        selectedFile
      );

      if (ok) {
        handleClose();
      } else {
        setSubmitError("No se pudo registrar el reposo médico. Verifique los datos e intente nuevamente.");
      }
    } catch {
      setSubmitError("Ocurrió un error inesperado al enviar el reposo.");
    } finally {
      setIsSubmittingForm(false);
    }
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
        onClick={() => !isSubmittingForm && handleClose()}
      />

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div>
            <h2 className="text-slate-900 dark:text-white font-semibold text-base">Cargar Nuevo Reposo</h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Reporte una ausencia por motivos médicos</p>
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
          <form id="nuevo-reposo-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Fechas */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Fecha Inicio *</label>
                <input
                  type="date"
                  {...register("fechaInicio")}
                  className={inputCls}
                  disabled={isSubmittingForm}
                />
                {errors.fechaInicio && <p className={errorCls}>{errors.fechaInicio.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Fecha Fin *</label>
                <input
                  type="date"
                  {...register("fechaFin")}
                  className={inputCls}
                  disabled={isSubmittingForm}
                />
                {errors.fechaFin && <p className={errorCls}>{errors.fechaFin.message}</p>}
              </div>
            </div>

            {/* Tipo */}
            <div>
              <label className={labelCls}>Tipo de Reposo *</label>
              <select {...register("tipo")} className={inputCls} disabled={isSubmittingForm}>
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
              <input
                {...register("medicoTratante")}
                placeholder="Dr. Juan Pérez"
                className={inputCls}
                disabled={isSubmittingForm}
              />
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
                disabled={isSubmittingForm}
              />
              {errors.diagnostico && <p className={errorCls}>{errors.diagnostico.message}</p>}
            </div>

            {/* Adjunto */}
            <div>
              <label className={labelCls}>Documento Adjunto (Opcional)</label>
              <div
                onClick={() => !isSubmittingForm && fileInputRef.current?.click()}
                className="w-full h-32 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors overflow-hidden group"
              >
                {adjuntoPreview ? (
                  adjuntoPreview.startsWith("data:image") ? (
                    <img src={adjuntoPreview} alt="Adjunto" className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="flex flex-col items-center text-emerald-500 px-4 text-center">
                      <FileImage className="w-8 h-8 mb-2" />
                      <span className="text-xs font-medium truncate max-w-[200px]">{selectedFile?.name ?? "Documento cargado"}</span>
                      <span className="text-[10px] text-slate-400 mt-1">Clic para cambiar</span>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center text-slate-400 dark:text-slate-500 group-hover:text-emerald-500 transition-colors">
                    <ImageIcon className="w-8 h-8 mb-2" />
                    <span className="text-sm font-medium">Clic para subir constancia o reposo</span>
                    <span className="text-xs opacity-70 mt-1">PDF, JPG o PNG (Máximo 5MB)</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleAdjuntoChange}
                disabled={isSubmittingForm}
              />
            </div>
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
            form="nuevo-reposo-form"
            disabled={isSubmittingForm}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-semibold shadow-md shadow-emerald-500/20 transition-all disabled:opacity-60 cursor-pointer"
          >
            {isSubmittingForm && <Loader2 className="w-4 h-4 animate-spin" />}
            Cargar Reposo
          </button>
        </div>
      </div>
    </div>
  );
}
