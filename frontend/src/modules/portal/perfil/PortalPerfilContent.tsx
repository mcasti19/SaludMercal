"use client";

import { useState } from "react";
import { useAuthStore } from "@/modules/auth/auth.store";
import { User, Mail, Phone, MapPin, Briefcase, KeyRound, ShieldCheck, CreditCard } from "lucide-react";

export function PortalPerfilContent() {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);

  // Simulated extra data for MVP aesthetics
  const extraData = {
    telefono: "+58 412-1234567",
    direccion: "Av. Universidad, Edificio Centro Valores, Caracas, Distrito Capital",
    fechaIngreso: "15/03/2018",
    cargo: "Analista de Operaciones",
    tipoSangre: "O+",
    contactoEmergencia: "María Pérez (Madre) - 0414-9876543",
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-slate-900 dark:text-white text-2xl font-bold">Mi Perfil</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Gestione su información personal y de contacto
          </p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            isEditing
              ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
          }`}
        >
          {isEditing ? "Cancelar Edición" : "Editar Información"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Basic Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-full flex items-center justify-center font-bold text-3xl mx-auto shadow-lg shadow-emerald-500/30 mb-4 ring-4 ring-emerald-50 dark:ring-emerald-900/30">
              {user?.nombre?.[0]}{user?.apellido?.[0]}
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              {user?.nombre} {user?.apellido}
            </h2>
            <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-4">
              {extraData.cargo}
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Cuenta Verificada
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4">
            <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Cambiar Contraseña</span>
              </div>
            </button>
            <div className="h-px bg-slate-100 dark:bg-slate-700/50 my-1 mx-2" />
            <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-500">
                  <CreditCard className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Credencial Digital</span>
              </div>
            </button>
          </div>
        </div>

        {/* Right Column: Detailed Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Datos Personales */}
          <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-500" />
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Información Personal</h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Cédula de Identidad
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.cedula}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm opacity-80 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    disabled={!isEditing}
                    defaultValue={user?.email}
                    className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm transition-colors ${
                      isEditing
                        ? "bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-500/30 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20"
                        : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 opacity-80"
                    }`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    disabled={!isEditing}
                    defaultValue={extraData.telefono}
                    className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm transition-colors ${
                      isEditing
                        ? "bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-500/30 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20"
                        : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 opacity-80"
                    }`}
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Dirección de Habitación
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <textarea
                    disabled={!isEditing}
                    defaultValue={extraData.direccion}
                    rows={2}
                    className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm transition-colors resize-none ${
                      isEditing
                        ? "bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-500/30 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20"
                        : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 opacity-80"
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Datos Laborales & Médicos */}
          <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-500" />
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Datos Institucionales & Médicos</h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Departamento
                </label>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.departamento}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Fecha de Ingreso
                </label>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{extraData.fechaIngreso}</p>
              </div>
              <div className="h-px bg-slate-100 dark:bg-slate-700/50 sm:col-span-2 my-1" />
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Tipo de Sangre
                </label>
                <p className="text-sm font-bold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 w-max px-2.5 py-0.5 rounded-md border border-red-100 dark:border-red-500/20">
                  {extraData.tipoSangre}
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Contacto de Emergencia
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  defaultValue={extraData.contactoEmergencia}
                  className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors ${
                    isEditing
                      ? "bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-500/30 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20"
                      : "bg-transparent border-transparent text-slate-900 dark:text-white font-medium p-0"
                  }`}
                />
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsEditing(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  // Simulate save
                  setIsEditing(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-semibold shadow-md shadow-emerald-500/20 transition-all"
              >
                Guardar Cambios
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
