"use client";

import { useState } from "react";
import { Search, UserPlus, AlertTriangle } from "lucide-react";
import {
  apiCreatePatientFromDirectory,
  apiLookupEmployee,
  type DirectoryLookupResult,
} from "@/lib/api";
import { mapApiPatient } from "@/modules/pacientes/pacientes.store";
import type { Paciente } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  onClose: () => void;
  /** Expediente creado (o ya existente): se abre para completar la ficha médica. */
  onOpenPaciente: (paciente: Paciente) => void;
  /** Excepción: alta manual de alguien que no está en la nómina (solo administradores). */
  onManual?: () => void;
}

/** Paso previo a «Nuevo Paciente»: todo paciente es empleado, así que se busca en la nómina corporativa por cédula. */
export function BuscarEmpleadoModal({ onClose, onOpenPaciente, onManual }: Props) {
  const [cedula, setCedula] = useState("");
  const [result, setResult] = useState<DirectoryLookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const search = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setResult(await apiLookupEmployee(cedula.trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo consultar la nómina.");
    } finally {
      setBusy(false);
    }
  };

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      onOpenPaciente(mapApiPatient(await apiCreatePatientFromDirectory(cedula.trim())));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el expediente.");
      setBusy(false);
    }
  };

  const employee = result?.employee;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buscar empleado por cédula</DialogTitle>
          <DialogDescription>
            Los pacientes son trabajadores de Mercal: sus datos de identidad y sede vienen de la nómina corporativa.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void search();
          }}
        >
          <input
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            placeholder="V-12345678"
            autoFocus
            className="flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent p-2 text-sm font-mono"
          />
          <Button type="submit" disabled={busy || cedula.trim().length < 6} className="gap-1.5">
            <Search className="w-4 h-4" /> Buscar
          </Button>
        </form>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {result && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3 text-sm">
            {employee && (
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {employee.first_name} {employee.last_name} · {employee.national_id}
                </p>
                <p className="text-slate-500">
                  {[employee.job_title, employee.department].filter(Boolean).join(" · ") || "—"}
                </p>
                <p className="text-slate-500">Sede: {employee.sede ?? "—"}</p>
                {!employee.is_active && (
                  <p className="mt-1 flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-4 h-4" /> Empleado egresado / inactivo en la nómina
                  </p>
                )}
              </div>
            )}

            {result.status === "available" && (
              <Button type="button" disabled={busy} onClick={() => void create()} className="gap-1.5">
                <UserPlus className="w-4 h-4" /> Crear expediente
              </Button>
            )}

            {result.status === "has_record" && result.patient && (
              <>
                <p className="text-slate-600 dark:text-slate-300">
                  {result.patient.first_name} {result.patient.last_name} ya tiene expediente.
                </p>
                <Button type="button" onClick={() => onOpenPaciente(mapApiPatient(result.patient!))}>
                  Abrir expediente
                </Button>
              </>
            )}

            {(result.status === "other_sede" || result.status === "sede_not_mapped") && (
              <p className="text-amber-600 dark:text-amber-400">
                {result.message}
                {result.origin_sede ? ` (Sede: ${result.origin_sede})` : ""}
              </p>
            )}
          </div>
        )}

        {onManual && (
          <button
            type="button"
            onClick={onManual}
            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline self-start"
          >
            No figura en la nómina: registrar manualmente (excepción)
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}
