"use client";

import {
  CalendarClock,
  Users,
  Stethoscope,
  CheckCircle2,
  Clock,
  XCircle,
  ActivitySquare,
  ArrowRight,
} from "lucide-react";
import { useCitasStore } from "@/modules/citas/citas.store";
import { usePacientesStore } from "@/modules/pacientes/pacientes.store";
import { useMedicosStore } from "@/modules/medicos/medicos.store";
import { StatCard } from "@/components/shared/StatCard";
import { CitaEstadoBadge } from "@/components/shared/CitaEstadoBadge";
import { formatDate, formatTime } from "@/lib/utils";
import Link from "next/link";

export function DashboardContent() {
  const { citas } = useCitasStore();
  const { pacientes } = usePacientesStore();

  const today = new Date().toISOString().split("T")[0];
  const citasHoy = citas.filter((c) => c.fecha === today);
  const citasPendientes = citas.filter((c) => c.estado === "PENDIENTE");
  const citasCompletadas = citas.filter((c) => c.estado === "COMPLETADA");
  const citasCanceladas = citas.filter((c) => c.estado === "CANCELADA");
  const citasEnAtencion = citas.filter((c) => c.estado === "EN_ATENCION");
  const pacientesActivos = pacientes.filter((p) => p.estado === "ACTIVO");
  const { medicos } = useMedicosStore();
  const medicosActivos = medicos.filter((m) => m.activo);

  const recentCitas = [...citas]
    .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime())
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-slate-900 dark:text-white text-2xl font-bold">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Resumen del sistema de gestión médica — {formatDate(today)}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Citas Hoy"
          value={citasHoy.length}
          icon={CalendarClock}
          change={12}
          changeType="up"
          colorClass="text-blue-400"
          bgClass="bg-blue-500/10"
        />
        <StatCard
          label="Pacientes Activos"
          value={pacientesActivos.length}
          icon={Users}
          change={3}
          changeType="up"
          colorClass="text-cyan-400"
          bgClass="bg-cyan-500/10"
        />
        <StatCard
          label="Médicos en Servicio"
          value={medicosActivos.length}
          icon={Stethoscope}
          colorClass="text-violet-400"
          bgClass="bg-violet-500/10"
        />
        <StatCard
          label="En Atención Ahora"
          value={citasEnAtencion.length}
          icon={ActivitySquare}
          colorClass="text-emerald-400"
          bgClass="bg-emerald-500/10"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs">Pendientes</p>
            <p className="text-slate-900 dark:text-white text-xl font-bold tabular-nums">{citasPendientes.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs">Completadas</p>
            <p className="text-slate-900 dark:text-white text-xl font-bold tabular-nums">{citasCompletadas.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs">Canceladas</p>
            <p className="text-slate-900 dark:text-white text-xl font-bold tabular-nums">{citasCanceladas.length}</p>
          </div>
        </div>
      </div>

      {/* Recent appointments table */}
      <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700/50">
          <h2 className="text-slate-900 dark:text-white font-semibold text-sm">Citas Recientes</h2>
          <Link
            href="/citas"
            id="dashboard-ver-citas-link"
            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors"
          >
            Ver todas
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700/50">
                <th className="px-6 py-3 text-left text-slate-500 dark:text-slate-400 font-medium text-xs uppercase tracking-wider">
                  Paciente
                </th>
                <th className="px-6 py-3 text-left text-slate-500 dark:text-slate-400 font-medium text-xs uppercase tracking-wider">
                  Médico / Especialidad
                </th>
                <th className="px-6 py-3 text-left text-slate-500 dark:text-slate-400 font-medium text-xs uppercase tracking-wider">
                  Fecha &amp; Hora
                </th>
                <th className="px-6 py-3 text-left text-slate-500 dark:text-slate-400 font-medium text-xs uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {recentCitas.map((cita) => (
                <tr
                  key={cita.id}
                  className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors"
                >
                  <td className="px-6 py-3">
                    <p className="text-slate-900 dark:text-white font-medium">{cita.pacienteNombre}</p>
                    <p className="text-slate-500 text-xs">{cita.pacienteCedula}</p>
                  </td>
                  <td className="px-6 py-3">
                    <p className="text-slate-600 dark:text-slate-300">{cita.medicoNombre}</p>
                    <p className="text-slate-500 text-xs">{cita.especialidad}</p>
                  </td>
                  <td className="px-6 py-3">
                    <p className="text-slate-600 dark:text-slate-300">{formatDate(cita.fecha)}</p>
                    <p className="text-slate-500 text-xs">{formatTime(cita.hora)}</p>
                  </td>
                  <td className="px-6 py-3">
                    <CitaEstadoBadge estado={cita.estado} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
