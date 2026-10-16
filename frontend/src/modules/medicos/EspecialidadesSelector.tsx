"use client";

import { Check } from "lucide-react";
import { Especialidad } from "@/types";

interface EspecialidadesSelectorProps {
  especialidades: Especialidad[];
  value: string[];
  onChange: (ids: string[]) => void;
}

/**
 * Multi-select of catalog specialties. The first selected one is the doctor's
 * primary specialty (used when booking appointments).
 */
export function EspecialidadesSelector({ especialidades, value, onChange }: EspecialidadesSelectorProps) {
  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  if (especialidades.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        No hay especialidades cargadas en el catálogo.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {especialidades.map((e) => {
        const selected = value.includes(e.id);
        const isPrimary = selected && value[0] === e.id;
        return (
          <button
            key={e.id}
            type="button"
            onClick={() => toggle(e.id)}
            aria-pressed={selected}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm transition-colors ${
              selected
                ? "bg-blue-500/10 dark:bg-blue-500/20 border-blue-300 dark:border-blue-500/40 text-blue-700 dark:text-blue-300"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-300"
            }`}
          >
            {selected && <Check className="w-3.5 h-3.5" />}
            {e.nombre}
            {isPrimary && value.length > 1 && (
              <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">Principal</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

