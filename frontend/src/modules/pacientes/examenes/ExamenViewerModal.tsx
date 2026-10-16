"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Download, X } from "lucide-react";
import { apiFetchMedicalExamFile, downloadBlobAsFile } from "@/lib/api";
import { Examen, ExamenArchivo } from "@/types";

interface ExamenViewerModalProps {
  examen: Examen;
  archivo: ExamenArchivo;
  onClose: () => void;
}

/** Inline preview of an exam file (audited as "viewed"); the download button is audited as "downloaded". */
export function ExamenViewerModal({ examen, archivo, onClose }: ExamenViewerModalProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    apiFetchMedicalExamFile(examen.id, archivo.id, false)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "No se pudo abrir el archivo");
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [examen.id, archivo.id]);

  const handleDownload = async () => {
    try {
      const blob = await apiFetchMedicalExamFile(examen.id, archivo.id, true);
      downloadBlobAsFile(blob, archivo.nombre);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo descargar el archivo");
    }
  };

  const isPdf = archivo.mimeType === "application/pdf";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl h-[85vh] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div className="min-w-0">
            <h3 className="text-slate-900 dark:text-white font-semibold text-sm truncate">{examen.titulo}</h3>
            <p className="text-xs text-slate-500 truncate">{archivo.nombre}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar
            </button>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
          {error ? (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          ) : !url ? (
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          ) : isPdf ? (
            <iframe src={url} title={archivo.nombre} className="w-full h-full" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={archivo.nombre} className="max-w-full max-h-full object-contain" />
          )}
        </div>
      </div>
    </div>
  );
}

