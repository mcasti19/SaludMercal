"use client";

import { ApiUser } from "@/lib/api";
import { AlertTriangle, KeyRound, Sparkles, X } from "lucide-react";
import { useState } from "react";

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (userId: number, newPassword: string) => Promise<boolean>;
  user: ApiUser | null;
  isSaving: boolean;
}

export function ResetPasswordModal({
  isOpen,
  onClose,
  onConfirm,
  user,
  isSaving,
}: ResetPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const generateSecurePassword = () => {
    const charset =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";
    let gen = "";
    gen += "ABCDEFGHJKLMNPQRSTUVWXYZ"[Math.floor(Math.random() * 24)];
    gen += "abcdefghijkmnopqrstuvwxyz"[Math.floor(Math.random() * 24)];
    gen += "23456789"[Math.floor(Math.random() * 8)];
    gen += "!@#$%&*"[Math.floor(Math.random() * 7)];
    for (let i = 0; i < 8; i++) {
      gen += charset[Math.floor(Math.random() * charset.length)];
    }
    setPassword(gen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password.trim() || password.length < 8) {
      setError("La nueva contraseña debe tener un mínimo de 8 caracteres.");
      return;
    }

    const ok = await onConfirm(user.id, password.trim());
    if (ok) {
      setPassword("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Restablecer Contraseña
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Usuario:{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {user.username}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
              {error}
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Aviso de Seguridad de Acceso</span>
            </div>
            <p className="text-[11px] leading-relaxed opacity-90">
              Al restablecer la contraseña, se revocarán de inmediato todas las
              sesiones activas en cualquier dispositivo y el usuario será
              obligado a ingresar una contraseña personal nueva al iniciar
              sesión.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nueva Contraseña Temporal *
              </label>
              <button
                type="button"
                onClick={generateSecurePassword}
                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 font-medium"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generar Clave</span>
              </button>
            </div>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {isSaving ? "Restableciendo..." : "Restablecer y Forzar Cambio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
