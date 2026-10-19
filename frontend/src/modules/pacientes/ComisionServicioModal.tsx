"use client";

import { useState } from "react";
import { Plane } from "lucide-react";
import { apiRegisterServiceCommission, type ApiServiceCommission } from "@/lib/api";
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
  onRegistered: () => void;
}

/** Reception of the destination sede registers an employee of another sede on service commission. */
export function ComisionServicioModal({ onClose, onRegistered }: Props) {
  const [cedula, setCedula] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<ApiServiceCommission | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const commission = await apiRegisterServiceCommission({
        national_id: cedula.trim(),
        reason: reason.trim() || undefined,
      });
      setDone(commission);
      onRegistered();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la comisión.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="w-4 h-4" /> Comisión de servicio
          </DialogTitle>
          <DialogDescription>
            Permite atender en esta sede a un trabajador de otra sede. Seguirá perteneciendo a su sede de origen, que podrá ver toda su atención.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="space-y-3 text-sm">
            <p className="text-emerald-600 dark:text-emerald-400 font-medium">
              {done.patient.first_name} {done.patient.last_name} ({done.patient.national_id}) quedó registrado en comisión.
            </p>
            <p className="text-slate-500">Sede de origen: {done.origin_location.name ?? "—"}</p>
            <Button type="button" onClick={onClose}>Cerrar</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              placeholder="Cédula del trabajador (V-12345678)"
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent p-2 text-sm"
            />
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Motivo de la comisión (opcional)"
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent p-2 text-sm"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="button" disabled={busy || cedula.trim().length < 6} onClick={() => void submit()}>
              Registrar comisión
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
