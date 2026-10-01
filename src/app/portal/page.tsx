"use client";

import { useAuthStore } from "@/modules/auth/auth.store";
import { useCitasStore } from "@/modules/citas/citas.store";
import { useRepososStore } from "@/modules/reposos/reposos.store";
import { HeartPulse, CalendarDays, FileBox } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";

export default function PortalDashboard() {
  const { user } = useAuthStore();
  const { citas } = useCitasStore();
  const { reposos } = useRepososStore();

  const misCitas = citas.filter((c) => c.pacienteId === user?.id);
  const misReposos = reposos.filter((r) => r.empleadoId === user?.id);

  const proximasCitas = misCitas.filter(
    (c) => c.estado === "PENDIENTE" || c.estado === "CONFIRMADA"
  ).length;

  const repososActivos = misReposos.filter(
    (r) => r.estado === "PENDIENTE" || r.estado === "APROBADO"
  ).length;

  const consultasPrevias = misCitas.filter((c) => c.estado === "COMPLETADA").length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-slate-900 dark:text-white text-2xl font-bold">
          ¡Hola, {user?.nombre}! 👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Bienvenido a MiSaludMercal. Aquí puedes gestionar tus citas y reposos médicos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Próximas Citas"
          value={proximasCitas}
          icon={CalendarDays}
          colorClass="text-emerald-500"
          bgClass="bg-emerald-50 dark:bg-emerald-500/10"
        />
        <StatCard
          label="Reposos (Pendiente/Activo)"
          value={repososActivos}
          icon={FileBox}
          colorClass="text-amber-500"
          bgClass="bg-amber-50 dark:bg-amber-500/10"
        />
        <StatCard
          label="Consultas Previas"
          value={consultasPrevias}
          icon={HeartPulse}
          colorClass="text-blue-500"
          bgClass="bg-blue-50 dark:bg-blue-500/10"
        />
      </div>

      <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-8 text-center mt-8">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <HeartPulse className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          Portal del Empleado
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-lg mx-auto">
          Ya puedes navegar por el menú lateral para gestionar tus propias citas médicas y cargar reposos para que el equipo administrativo los verifique.
        </p>
      </div>
    </div>
  );
}
