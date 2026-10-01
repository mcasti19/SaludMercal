"use client";

import { useCitasStore } from "@/modules/citas/citas.store";
import { usePacientesStore } from "@/modules/pacientes/pacientes.store";
import { useMedicosStore } from "@/modules/medicos/medicos.store";
import { CITA_ESTADO_CONFIG } from "@/lib/constants";
import { CitaEstado } from "@/types";
import { BarChart3, TrendingUp, Activity } from "lucide-react";
import { MOCK_ESPECIALIDADES } from "../medicos/medicos.mocks";

const ESTADOS: CitaEstado[] = ["PENDIENTE", "CONFIRMADA", "EN_ATENCION", "COMPLETADA", "CANCELADA"];

export function ReportesContent() {
  const { citas } = useCitasStore();
  const { pacientes } = usePacientesStore();

  const totalCitas = citas.length;
  const completadas = citas.filter((c) => c.estado === "COMPLETADA").length;
  const tasaCompletadas = totalCitas > 0 ? Math.round((completadas / totalCitas) * 100) : 0;

  // Citas por estado
  const citasPorEstado = ESTADOS.map((e) => ({
    estado: e,
    count: citas.filter((c) => c.estado === e).length,
    config: CITA_ESTADO_CONFIG[e],
  }));

  // Citas por especialidad
  const citasPorEspecialidad = MOCK_ESPECIALIDADES.map((esp) => ({
    nombre: esp.nombre,
    count: citas.filter((c) => c.especialidad === esp.nombre).length,
  })).filter((e) => e.count > 0).sort((a, b) => b.count - a.count);

  // Citas por médico
  const { medicos } = useMedicosStore();
  const citasPorMedico = medicos.map((m) => ({
    nombre: `Dr. ${m.nombre} ${m.apellido}`,
    especialidad: m.especialidadNombre,
    count: citas.filter((c) => c.medicoId === m.id).length,
  })).filter((m) => m.count > 0).sort((a, b) => b.count - a.count);

  const maxEsp = Math.max(...citasPorEspecialidad.map((e) => e.count), 1);
  const maxMed = Math.max(...citasPorMedico.map((m) => m.count), 1);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-slate-900 dark:text-white text-2xl font-bold">Reportes y Estadísticas</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Análisis del sistema de citas médicas — datos en tiempo real
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Citas", value: totalCitas, icon: BarChart3, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Completadas", value: completadas, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Tasa de Atención", value: `${tasaCompletadas}%`, icon: Activity, color: "text-cyan-400", bg: "bg-cyan-500/10" },
          { label: "Pacientes Activos", value: pacientes.filter((p) => p.estado === "ACTIVO").length, icon: Activity, color: "text-violet-400", bg: "bg-violet-500/10" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5">
            <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center mb-3`}>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <p className="text-slate-900 dark:text-white text-2xl font-bold tabular-nums">{kpi.value}</p>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por estado */}
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5">
          <h2 className="text-slate-900 dark:text-white font-semibold text-sm mb-4">Distribución por Estado</h2>
          <div className="space-y-3">
            {citasPorEstado.map(({ estado, count, config }) => {
              const pct = totalCitas > 0 ? Math.round((count / totalCitas) * 100) : 0;
              return (
                <div key={estado}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className={config.color}>{config.label}</span>
                    <span className="text-slate-500 dark:text-slate-400">{count} citas ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${estado === "COMPLETADA" ? "bg-emerald-500" :
                          estado === "PENDIENTE" ? "bg-amber-500" :
                            estado === "CONFIRMADA" ? "bg-blue-500" :
                              estado === "EN_ATENCION" ? "bg-violet-500" : "bg-red-500"
                        }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Citas por Especialidad */}
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5">
          <h2 className="text-slate-900 dark:text-white font-semibold text-sm mb-4">Citas por Especialidad</h2>
          {citasPorEspecialidad.length === 0 ? (
            <p className="text-slate-500 text-sm">No hay datos disponibles</p>
          ) : (
            <div className="space-y-3">
              {citasPorEspecialidad.map(({ nombre, count }) => {
                const pct = Math.round((count / maxEsp) * 100);
                return (
                  <div key={nombre}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600 dark:text-slate-300 truncate max-w-[70%]">{nombre}</span>
                      <span className="text-slate-500 dark:text-slate-400">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top médicos */}
      <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5">
        <h2 className="text-slate-900 dark:text-white font-semibold text-sm mb-4">Médicos con más Citas Atendidas</h2>
        {citasPorMedico.length === 0 ? (
          <p className="text-slate-500 text-sm">No hay datos disponibles</p>
        ) : (
          <div className="space-y-3">
            {citasPorMedico.map(({ nombre, especialidad, count }) => {
              const pct = Math.round((count / maxMed) * 100);
              return (
                <div key={nombre} className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-300 text-xs font-bold shrink-0">
                    {nombre.split(" ").slice(1).map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-slate-600 dark:text-slate-300 text-xs font-medium truncate">{nombre}</p>
                      <span className="text-slate-500 dark:text-slate-400 text-xs shrink-0 ml-2">{count} citas</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-slate-600 text-xs mt-0.5">{especialidad}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
