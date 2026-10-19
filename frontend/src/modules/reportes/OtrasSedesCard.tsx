"use client";

import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { apiGetReportSummary, type ApiReportSummary } from "@/lib/api";

/** "Citas atendidas de otras sedes": completed appointments held here for patients of another sede. */
export function OtrasSedesCard({ from, to }: { from?: string; to?: string }) {
  const [data, setData] = useState<ApiReportSummary["appointments"]["from_other_sedes"] | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGetReportSummary({ date_from: from, date_to: to })
      .then((s) => !cancelled && setData(s.appointments.from_other_sedes))
      .catch(() => !cancelled && setData(null));
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  if (!data) return null;

  return (
    <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <p className="text-slate-900 dark:text-white text-2xl font-bold tabular-nums">{data.total}</p>
          <p className="text-slate-500 dark:text-slate-400 text-xs">Citas atendidas de otras sedes</p>
        </div>
      </div>
      {data.by_origin.length === 0 ? (
        <p className="text-slate-500 text-sm">Sin atenciones a trabajadores de otras sedes en el período.</p>
      ) : (
        <ul className="space-y-2">
          {data.by_origin.map((o) => (
            <li key={o.id ?? o.name} className="flex items-center justify-between text-sm">
              <span className="text-slate-700 dark:text-slate-300">{o.name}</span>
              <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{o.total}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
