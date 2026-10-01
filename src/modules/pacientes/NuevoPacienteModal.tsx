"use client";

import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { pacienteSchema, PacienteFormValues } from "@/lib/schemas";
import { usePacientesStore } from "@/modules/pacientes/pacientes.store";
import { Paciente } from "@/types";
import { DEPARTAMENTOS } from "@/lib/constants";

interface NuevoPacienteModalProps {
  paciente: Paciente | null;
  onClose: () => void;
}

export function NuevoPacienteModal({ paciente, onClose }: NuevoPacienteModalProps) {
  const { addPaciente, updatePaciente } = usePacientesStore();
  const isEditing = !!paciente;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PacienteFormValues>({
    resolver: zodResolver(pacienteSchema),
    defaultValues: paciente
      ? {
          cedula: paciente.cedula,
          nombre: paciente.nombre,
          apellido: paciente.apellido,
          departamento: paciente.departamento,
          telefono: paciente.telefono,
          email: paciente.email,
          fechaNacimiento: paciente.fechaNacimiento,
          estado: paciente.estado,
        }
      : { estado: "ACTIVO" },
  });

  const onSubmit = (data: PacienteFormValues) => {
    if (isEditing && paciente) {
      updatePaciente(paciente.id, data);
    } else {
      addPaciente(data);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl shadow-black/40 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700/50">
          <h2 className="text-slate-900 dark:text-white font-semibold">
            {isEditing ? "Editar Paciente" : "Nuevo Paciente"}
          </h2>
          <button id="paciente-modal-close-btn" onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} id="paciente-form" className="p-6 space-y-4">
          {/* Nombre & Apellido */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Nombre</label>
              <input
                id="paciente-nombre-input"
                {...register("nombre")}
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                placeholder="Juan"
              />
              {errors.nombre && <p className="text-red-400 text-xs">{errors.nombre.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Apellido</label>
              <input
                id="paciente-apellido-input"
                {...register("apellido")}
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                placeholder="García"
              />
              {errors.apellido && <p className="text-red-400 text-xs">{errors.apellido.message}</p>}
            </div>
          </div>

          {/* Cédula */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Cédula de Identidad</label>
            <input
              id="paciente-cedula-input"
              {...register("cedula")}
              placeholder="V-12345678"
              disabled={isEditing}
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all disabled:opacity-50"
            />
            {errors.cedula && <p className="text-red-400 text-xs">{errors.cedula.message}</p>}
          </div>

          {/* Departamento & Estado */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Departamento</label>
              <select
                id="paciente-departamento-select"
                {...register("departamento")}
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              >
                <option value="">Seleccionar...</option>
                {DEPARTAMENTOS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {errors.departamento && <p className="text-red-400 text-xs">{errors.departamento.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Estado</label>
              <select
                id="paciente-estado-select"
                {...register("estado")}
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              >
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
              </select>
            </div>
          </div>

          {/* Teléfono */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Teléfono</label>
            <input
              id="paciente-telefono-input"
              {...register("telefono")}
              placeholder="0414-1234567"
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
            />
            {errors.telefono && <p className="text-red-400 text-xs">{errors.telefono.message}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Email</label>
            <input
              id="paciente-email-input"
              type="email"
              {...register("email")}
              placeholder="nombre@mercal.gob.ve"
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
            />
            {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
          </div>

          {/* Fecha de Nacimiento */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Fecha de Nacimiento</label>
            <input
              id="paciente-fechanacimiento-input"
              type="date"
              {...register("fechaNacimiento")}
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
            />
            {errors.fechaNacimiento && <p className="text-red-400 text-xs">{errors.fechaNacimiento.message}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="paciente-submit-btn"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold hover:from-blue-400 hover:to-cyan-400 transition-all disabled:opacity-60"
            >
              {isEditing ? "Guardar Cambios" : "Registrar Paciente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
