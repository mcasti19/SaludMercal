"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Eye, FileImage, FileText, FlaskConical, Plus, Trash2, Upload } from "lucide-react";
import { useAuthStore } from "@/modules/auth/auth.store";
import { useMedicosStore } from "@/modules/medicos/medicos.store";
import { Cita, Examen, ExamenArchivo, UserRole } from "@/types";
import { useExamenesStore } from "./examenes.store";
import { formatFileSize, groupBy } from "./examenes.utils";
import { NuevoExamenModal } from "./NuevoExamenModal";
import { ExamenViewerModal } from "./ExamenViewerModal";

const UPLOAD_ROLES: UserRole[] = ["SUPERADMIN", "ADMIN", "MEDICO", "ENFERMERIA", "RECEPCION"];
const DELETE_ROLES: UserRole[] = ["SUPERADMIN", "ADMIN"];

interface ExamenesTabProps {
  patientId: string;
  citas: Cita[];
}

export function ExamenesTab({ patientId, citas }: ExamenesTabProps) {
  const role = useAuthStore((s) => s.user?.role);
  const { examenes, error, deleteExamen } = useExamenesStore();
  const { especialidades, fetchEspecialidades } = useMedicosStore();

  const [filtroEsp, setFiltroEsp] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [viewing, setViewing] = useState<{ examen: Examen; archivo: ExamenArchivo } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const canUpload = !!role && UPLOAD_ROLES.includes(role);
  const canDelete = !!role && DELETE_ROLES.includes(role);

  useEffect(() => {
    if (especialidades.length === 0) fetchEspecialidades();
  }, [especialidades.length, fetchEspecialidades]);

  const grupos = useMemo(() => {
    const filtered = examenes
      .filter((e) => !filtroEsp || e.especialidadId === filtroEsp)
      .filter((e) => !desde || e.fecha >= desde)
      .filter((e) => !hasta || e.fecha <= hasta)
      .sort((a, b) => b.fecha.localeCompare(a.fecha));

    return groupBy(filtered, (e) => e.especialidadNombre).sort(([a], [b]) => a.localeCompare(b));
  }, [examenes, filtroEsp, desde, hasta]);

  const confirmDelete = async (id: string) => {
    await deleteExamen(id);
    setPendingDelete(null);
  };

  const inputCls =
    "px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <select
            value={filtroEsp}
            onChange={(e) => setFiltroEsp(e.target.value)}
            aria-label="Filtrar por especialidad"
            className={inputCls}
          >
            <option value="">Todas las especialidades</option>
            {especialidades.map((e) => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </select>
          <label className="text-xs text-slate-500 flex flex-col gap-1">
            Desde
            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className={inputCls} />
          </label>
          <label className="text-xs text-slate-500 flex flex-col gap-1">
            Hasta
            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className={inputCls} />
          </label>
        </div>

        {canUpload && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold hover:from-blue-400 hover:to-cyan-400 transition-all shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            Cargar examen
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {grupos.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-12 text-center max-w-lg mx-auto">
          <FlaskConical className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-slate-800 dark:text-slate-200 font-semibold text-base">
            No hay exámenes médicos registrados
          </h3>
          <p className="text-slate-500 text-sm mt-1">
            {examenes.length > 0
              ? "Ningún examen coincide con los filtros seleccionados."
              : "Los exámenes cargados aparecerán aquí, agrupados por especialidad."}
          </p>
        </div>
      ) : (
        grupos.map(([especialidad, items]) => (
          <section key={especialidad} className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
              {especialidad}
              <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                {items.length}
              </span>
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {items.map((examen) => (
                <article
                  key={examen.id}
                  className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-slate-900 dark:text-white font-semibold">{examen.titulo}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {examen.fecha}
                        {examen.subidoPor && ` · Cargado por ${examen.subidoPor}`}
                      </p>
                      {examen.notas && (
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{examen.notas}</p>
                      )}
                    </div>

                    {canDelete &&
                      (pendingDelete === examen.id ? (
                        <div className="flex items-center gap-2 text-xs">
                          <button
                            onClick={() => confirmDelete(examen.id)}
                            className="px-2.5 py-1 rounded-lg bg-red-500 text-white font-semibold"
                          >
                            Confirmar
                          </button>
                          <button onClick={() => setPendingDelete(null)} className="text-slate-500 underline">
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setPendingDelete(examen.id)}
                          aria-label={`Eliminar ${examen.titulo}`}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ))}
                  </div>

                  <ul className="mt-3 flex flex-wrap gap-2">
                    {examen.archivos.map((archivo) => {
                      const Icon = archivo.mimeType === "application/pdf" ? FileText : FileImage;
                      return (
                        <li key={archivo.id}>
                          <button
                            onClick={() => setViewing({ examen, archivo })}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 hover:border-blue-300 transition-colors"
                          >
                            <Icon className="w-3.5 h-3.5 text-blue-500" />
                            <span className="max-w-[200px] truncate">{archivo.nombre}</span>
                            <span className="text-slate-400">{formatFileSize(archivo.tamano)}</span>
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                        </li>
                      );
                    })}
                    {examen.archivos.length === 0 && (
                      <li className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                        <Upload className="w-3.5 h-3.5" /> Sin archivos
                      </li>
                    )}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        ))
      )}

      <NuevoExamenModal
        open={showModal}
        onClose={() => setShowModal(false)}
        patientId={patientId}
        especialidades={especialidades}
        citas={citas}
      />

      {viewing && (
        <ExamenViewerModal examen={viewing.examen} archivo={viewing.archivo} onClose={() => setViewing(null)} />
      )}
    </div>
  );
}

