"use client";

import { useAuthStore } from "@/modules/auth/auth.store";
import { useCitasStore } from "@/modules/citas/citas.store";
import { useMedicosStore } from "@/modules/medicos/medicos.store";
import { useRepososStore } from "@/modules/reposos/reposos.store";
import { formatDate } from "@/lib/utils";
import { Activity, CalendarDays, CheckCircle2, FileBox, FileText, Pill, Stethoscope } from "lucide-react";

export function PortalExpedienteContent() {
  const { user } = useAuthStore();
  const { citas } = useCitasStore();
  const { reposos } = useRepososStore();
  const { medicos } = useMedicosStore();

  // Historial Médico Consolidado
  const historialCitas = citas
    .filter((c) => c.pacienteId === user?.id && c.estado === "COMPLETADA")
    .map((c) => ({
      type: "CITA" as const,
      date: new Date(`${c.fecha}T${c.hora}`),
      data: c,
    }));

  const historialReposos = reposos
    .filter((r) => r.empleadoId === user?.id && r.estado === "APROBADO")
    .map((r) => ({
      type: "REPOSO" as const,
      date: new Date(r.creadoEn),
      data: r,
    }));

  const timeline = [...historialCitas, ...historialReposos].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-slate-900 dark:text-white text-2xl font-bold">Mi Expediente Médico</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Historial clínico, consultas y diagnósticos aprobados.
        </p>
      </div>

      {/* Patient Summary Card */}
      <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center font-bold text-2xl shrink-0">
          {user?.nombre?.[0]}{user?.apellido?.[0]}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {user?.nombre} {user?.apellido}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Cédula</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{user?.cedula}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Departamento</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{user?.departamento}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Consultas</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{historialCitas.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Reposos</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{historialReposos.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-8">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-500" /> Línea de Tiempo Clínica
        </h3>

        {timeline.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-500 font-medium">Su expediente está vacío</p>
            <p className="text-slate-400 text-sm mt-1">Aún no hay registros de consultas o reposos aprobados.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-6 space-y-8">
            {timeline.map((item, index) => {
              if (item.type === "CITA") {
                const cita = item.data;
                const medico = medicos.find(m => m.id === cita.medicoId);
                return (
                  <div key={`cita-${cita.id}`} className="relative">
                    <div className="absolute -left-[35px] top-1 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-500/20 border-2 border-white dark:border-slate-950 flex items-center justify-center">
                      <Stethoscope className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-500/20">
                            Consulta Médica
                          </span>
                          <h4 className="font-semibold text-slate-900 dark:text-white mt-3">
                            Dr. {medico ? `${medico.nombre} ${medico.apellido}` : cita.medicoNombre}
                          </h4>
                          <p className="text-slate-500 dark:text-slate-400 text-sm">
                            {medico?.especialidadNombre || cita.especialidad}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatDate(cita.fecha)}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{cita.hora}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 space-y-3">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-semibold">Motivo</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{cita.motivo}</p>
                        </div>
                        {cita.notas && (
                          <div>
                            <p className="text-xs text-blue-500 dark:text-blue-400 uppercase tracking-wider mb-1 font-semibold flex items-center gap-1">
                              <Pill className="w-3.5 h-3.5" /> Indicaciones Médicas
                            </p>
                            <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                              {cita.notas}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              if (item.type === "REPOSO") {
                const reposo = item.data;
                return (
                  <div key={`reposo-${reposo.id}`} className="relative">
                    <div className="absolute -left-[35px] top-1 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 border-2 border-white dark:border-slate-950 flex items-center justify-center">
                      <FileBox className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="bg-white dark:bg-slate-800/50 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1.5 w-max">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Reposo Validado
                          </span>
                          <h4 className="font-semibold text-slate-900 dark:text-white mt-3">
                            {reposo.tipo} ({reposo.dias} días)
                          </h4>
                          <p className="text-slate-500 dark:text-slate-400 text-sm">
                            Dr. {reposo.medicoTratante}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {formatDate(reposo.fechaInicio)} al {formatDate(reposo.fechaFin)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-semibold">Diagnóstico Reportado</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{reposo.diagnostico}</p>
                      </div>

                      {reposo.notasAdmin && (
                        <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800/50 text-sm text-emerald-800 dark:text-emerald-200">
                          <span className="font-semibold mr-1">Observación:</span>
                          {reposo.notasAdmin}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
