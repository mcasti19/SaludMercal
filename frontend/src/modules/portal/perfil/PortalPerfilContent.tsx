"use client";

import { apiGetMyPatient, ApiPatient } from "@/lib/api";
import { useAuthStore } from "@/modules/auth/auth.store";
import {
  Droplet,
  HeartPulse,
  Info,
  Loader2,
  Phone,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

const RELATIONSHIP_LABELS: Record<string, string> = {
  conyuge: "Cónyuge",
  hijo: "Hijo",
  hija: "Hija",
  padre: "Padre",
  madre: "Madre",
};

export function PortalPerfilContent() {
  const { user } = useAuthStore();
  const [patientData, setPatientData] = useState<ApiPatient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    apiGetMyPatient()
      .then((data) => {
        if (isMounted) setPatientData(data);
      })
      .catch(() => {
        // En caso de que no tenga aún registro
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const beneficiaries = patientData?.beneficiaries ?? [];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-slate-900 dark:text-white text-2xl font-bold">
            Mi Perfil y Ficha Técnica
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Información laboral, médica y grupo familiar directo de Mercal
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Tarjeta de Identidad */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center shadow-sm">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-3xl flex items-center justify-center font-bold text-3xl mx-auto shadow-lg shadow-emerald-500/25 mb-4">
              {user?.nombre?.[0]}
              {user?.apellido?.[0]}
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              {user?.nombre} {user?.apellido}
            </h2>
            <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-3">
              {patientData?.job_title ??
                user?.departamento ??
                "Trabajador Mercal"}
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Titular Activo Mercal
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80 text-left space-y-3 text-xs">
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>Cédula:</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {user?.cedula || patientData?.national_id || "V-18765432"}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>Sede:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {patientData?.location?.name ?? "Sede Central Caracas"}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>Departamento:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[170px]">
                  {patientData?.department?.name ?? user?.departamento}
                </span>
              </div>
            </div>
          </div>

          {/* Ficha Médica Resumida */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-rose-500 font-bold text-sm uppercase tracking-wider">
              <HeartPulse className="w-4 h-4" />
              <span>Ficha Médica</span>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Grupo Sanguíneo
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-500 dark:text-rose-400 font-bold text-sm">
                  <Droplet className="w-3.5 h-3.5" />
                  {patientData?.blood_type || "O+"}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Alergias Conocidas
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  {patientData?.allergies || "Sin alergias registradas"}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Contacto de Emergencia
                </span>
                <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-1">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {patientData?.emergency_contact_name ||
                      "Carmen Gómez (Madre)"}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                    <Phone className="w-3 h-3" />
                    {patientData?.emergency_contact_phone || "0412-9988776"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Beneficiarios Familiares */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tarjeta de Beneficiarios (Familiares Directos) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-slate-900 dark:text-white font-bold text-lg">
                    Mi Grupo Familiar (Beneficiarios)
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                    Extensión del beneficio institucional para atención médica
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-bold self-start sm:self-auto">
                {beneficiaries.length}{" "}
                {beneficiaries.length === 1 ? "Familiar" : "Familiares"}
              </span>
            </div>

            {/* Aviso informativo */}
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs flex items-start gap-3">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="leading-relaxed">
                Este listado corresponde a sus familiares directos (Padres,
                Hijos y Cónyuge) con cobertura médica institucional. Si requiere
                incorporar o modificar beneficiarios, comuníquese con la
                Coordinación de Talento Humano o Recepción Médica de su sede.
              </p>
            </div>

            {loading ? (
              <div className="py-12 flex items-center justify-center text-slate-400 text-sm gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                Cargando grupo familiar...
              </div>
            ) : beneficiaries.length === 0 ? (
              <div className="py-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <Users className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-slate-600 dark:text-slate-400 text-sm font-semibold">
                  No hay familiares directos registrados aún
                </p>
                <p className="text-slate-400 text-xs max-w-sm mx-auto mt-1">
                  Solicite en la recepción médica de su sede el registro de sus
                  hijos, padres o cónyuge para poder agendar citas a su nombre.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {beneficiaries.map((b) => {
                  const label =
                    RELATIONSHIP_LABELS[b.relationship.toLowerCase()] ??
                    b.relationship_label ??
                    b.relationship;

                  const badgeColor =
                    b.relationship.toLowerCase() === "conyuge"
                      ? "bg-purple-500/10 text-purple-400 border-purple-500/25"
                      : b.relationship.toLowerCase() === "hijo" ||
                          b.relationship.toLowerCase() === "hija"
                        ? "bg-sky-500/10 text-sky-400 border-sky-500/25"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/25";

                  return (
                    <div
                      key={b.id}
                      className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-start gap-3.5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-sm shrink-0">
                        {b.first_name[0]}
                        {b.last_name[0]}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}
                          >
                            {label}
                          </span>
                        </div>

                        <h4 className="text-slate-900 dark:text-white font-semibold text-sm mt-1.5 truncate">
                          {b.first_name} {b.last_name}
                        </h4>

                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono space-y-0.5">
                          <p>
                            {b.national_id
                              ? `C.I. ${b.national_id}`
                              : "Menor de edad (Sin cédula)"}
                          </p>
                          {b.birth_date && (
                            <p className="font-sans text-[11px]">
                              Nacimiento: {b.birth_date}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
