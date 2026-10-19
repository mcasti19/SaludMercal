"use client";

import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import {
  apiCloseEmergencyAccess,
  apiGetEmergencyAccess,
  apiOpenEmergencyAccess,
  type EmergencyAccessStatus,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MIN_REASON_LENGTH = 20;

/** Break-glass control for the developer role: clinical data is readable only inside a justified, audited window. */
export function EmergencyAccessButton() {
  const [status, setStatus] = useState<EmergencyAccessStatus>({ active: false, expires_at: null });
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const refresh = () =>
      apiGetEmergencyAccess()
        .then(setStatus)
        .catch(() => setStatus({ active: false, expires_at: null }));

    refresh();
    const timer = setInterval(refresh, 60_000);
    return () => clearInterval(timer);
  }, []);

  const run = async (action: () => Promise<EmergencyAccessStatus>) => {
    setBusy(true);
    setError(null);
    try {
      setStatus(await action());
      setOpen(false);
      setReason("");
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo completar la operación.");
    } finally {
      setBusy(false);
    }
  };

  const until = status.expires_at
    ? new Date(status.expires_at).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant={status.active ? "destructive" : "outline"}
        onClick={() => (status.active ? void run(apiCloseEmergencyAccess) : setOpen(true))}
        disabled={busy}
        className="gap-1.5"
      >
        <ShieldAlert className="w-4 h-4" />
        {status.active ? `Cerrar acceso de emergencia (hasta ${until})` : "Acceso de emergencia"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acceso de emergencia a datos clínicos</DialogTitle>
            <DialogDescription>
              Solo lectura, 30 minutos. El motivo y cada consulta que realices quedan registrados en la bitácora de auditoría.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Motivo / número de incidencia (mínimo 20 caracteres)"
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent p-2 text-sm"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button
            type="button"
            disabled={busy || reason.trim().length < MIN_REASON_LENGTH}
            onClick={() => void run(() => apiOpenEmergencyAccess(reason.trim()))}
          >
            Abrir acceso
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
