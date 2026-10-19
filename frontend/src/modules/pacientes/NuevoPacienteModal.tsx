"use client";

import { DEPARTAMENTOS } from "@/lib/constants";
import { PacienteFormValues, pacienteSchema } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { usePacientesStore } from "@/modules/pacientes/pacientes.store";
import { Beneficiario, Paciente, ParentescoBeneficiario } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Building2,
  Droplet,
  HeartPulse,
  Plus,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface NuevoPacienteModalProps {
  paciente: Paciente | null;
  onClose: () => void;
}

const BLOOD_TYPES = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"] as const;

const RELATIONSHIP_OPTIONS: { value: ParentescoBeneficiario; label: string }[] =
  [
    { value: "conyuge", label: "Cónyuge" },
    { value: "hijo", label: "Hijo" },
    { value: "hija", label: "Hija" },
    { value: "padre", label: "Padre" },
    { value: "madre", label: "Madre" },
  ];

export function NuevoPacienteModal({
  paciente,
  onClose,
}: NuevoPacienteModalProps) {
  const { addPaciente, updatePaciente, departments } = usePacientesStore();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isEditing = !!paciente;

  // Estado local para los beneficiarios (Familiares directos)
  const [beneficiaries, setBeneficiaries] = useState<Beneficiario[]>(
    paciente?.beneficiaries ?? [],
  );

  // Estado para el formulario de nuevo familiar
  const [showAddBeneficiary, setShowAddBeneficiary] = useState(false);
  const [newBForm, setNewBForm] = useState<{
    relationship: ParentescoBeneficiario;
    first_name: string;
    last_name: string;
    national_id: string;
    birth_date: string;
    gender: string;
    phone: string;
  }>({
    relationship: "hijo",
    first_name: "",
    last_name: "",
    national_id: "",
    birth_date: "",
    gender: "M",
    phone: "",
  });
  const [bFormError, setBFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PacienteFormValues>({
    resolver: zodResolver(pacienteSchema),
    defaultValues: paciente
      ? {
          cedula: paciente.cedula,
          nombre: paciente.nombre,
          apellido: paciente.apellido,
          departamento: paciente.departamento,
          cargo: paciente.cargo ?? "",
          telefono: paciente.telefono,
          email: paciente.email,
          fechaNacimiento: paciente.fechaNacimiento,
          estado: paciente.estado,
          grupoSanguineo: paciente.grupoSanguineo ?? "",
          alergias: paciente.alergias ?? "",
          contactoEmergenciaNombre: paciente.contactoEmergenciaNombre ?? "",
          contactoEmergenciaTelefono: paciente.contactoEmergenciaTelefono ?? "",
        }
      : {
          estado: "ACTIVO",
          departamento: "",
          grupoSanguineo: "O+",
        },
  });

  const watchBloodType = watch("grupoSanguineo");

  const handleAddBeneficiaryToList = () => {
    setBFormError(null);
    if (!newBForm.first_name.trim() || !newBForm.last_name.trim()) {
      setBFormError("Nombre y apellido del familiar son requeridos");
      return;
    }

    const newBeneficiary: Beneficiario = {
      first_name: newBForm.first_name.trim(),
      last_name: newBForm.last_name.trim(),
      relationship: newBForm.relationship,
      relationship_label: RELATIONSHIP_OPTIONS.find(
        (r) => r.value === newBForm.relationship,
      )?.label,
      national_id: newBForm.national_id.trim() || null,
      birth_date: newBForm.birth_date || null,
      gender: newBForm.gender || null,
      phone: newBForm.phone.trim() || null,
      is_active: true,
    };

    setBeneficiaries((prev) => [...prev, newBeneficiary]);
    setNewBForm({
      relationship: "hijo",
      first_name: "",
      last_name: "",
      national_id: "",
      birth_date: "",
      gender: "M",
      phone: "",
    });
    setShowAddBeneficiary(false);
  };

  const handleRemoveBeneficiary = (index: number) => {
    setBeneficiaries((prev) => {
      const item = prev[index];
      if (item && item.id) {
        // Marcado para eliminación en backend
        return prev.map((b, i) => (i === index ? { ...b, _delete: true } : b));
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const onSubmit = async (data: PacienteFormValues) => {
    setSubmitError(null);

    const payload = {
      ...data,
      beneficiaries: beneficiaries,
    };

    const ok =
      isEditing && paciente
        ? await updatePaciente(paciente.id, payload)
        : await addPaciente(payload as any);

    if (ok) {
      onClose();
    } else {
      setSubmitError(
        usePacientesStore.getState().error ??
          "No fue posible guardar la información del paciente.",
      );
    }
  };

  const activeBeneficiaries = beneficiaries.filter((b) => !b._delete);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* ── CABECERA ── */}
        <div className="px-6 sm:px-8 py-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-cyan-500/20 shrink-0">
              {paciente ? (
                `${paciente.nombre[0]}${paciente.apellido[0]}`
              ) : (
                <User className="w-6 h-6" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-white font-bold text-lg sm:text-xl truncate">
                {isEditing
                  ? `Editar Expediente: ${paciente.nombre} ${paciente.apellido}`
                  : "Registrar Nuevo Paciente"}
              </h2>
              <p className="text-slate-400 text-xs flex items-center gap-2 mt-0.5">
                {paciente ? (
                  <>
                    <span className="font-mono text-cyan-400">
                      {paciente.cedula}
                    </span>
                    <span>•</span>
                    <span>{paciente.departamento}</span>
                  </>
                ) : (
                  "Ficha completa de empleado, salud y grupo familiar"
                )}
              </p>
            </div>
          </div>

          <button
            id="paciente-modal-close-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── FORMULARIO SCROLLABLE ── */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          id="paciente-form"
          className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8"
        >
          {submitError && (
            <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* ── SECCIÓN 1: DATOS PERSONALES Y CONTACTO ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm uppercase tracking-wider">
              <User className="w-4 h-4" />
              <span>1. Identidad y Datos Personales</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Nombre */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Nombre <span className="text-red-400">*</span>
                </label>
                <input
                  id="paciente-nombre-input"
                  {...register("nombre")}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder:text-slate-600"
                  placeholder="Ej. Juan Carlos"
                />
                {errors.nombre && (
                  <p className="text-red-400 text-xs">
                    {errors.nombre.message}
                  </p>
                )}
              </div>

              {/* Apellido */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Apellido <span className="text-red-400">*</span>
                </label>
                <input
                  id="paciente-apellido-input"
                  {...register("apellido")}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder:text-slate-600"
                  placeholder="Ej. Pérez Gómez"
                />
                {errors.apellido && (
                  <p className="text-red-400 text-xs">
                    {errors.apellido.message}
                  </p>
                )}
              </div>

              {/* Cédula */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Cédula de Identidad <span className="text-red-400">*</span>
                </label>
                <input
                  id="paciente-cedula-input"
                  {...register("cedula")}
                  placeholder="V-18765432"
                  disabled={isEditing}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                />
                {errors.cedula && (
                  <p className="text-red-400 text-xs">
                    {errors.cedula.message}
                  </p>
                )}
              </div>

              {/* Fecha de Nacimiento */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Fecha de Nacimiento <span className="text-red-400">*</span>
                </label>
                <input
                  id="paciente-fechanacimiento-input"
                  type="date"
                  {...register("fechaNacimiento")}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
                {errors.fechaNacimiento && (
                  <p className="text-red-400 text-xs">
                    {errors.fechaNacimiento.message}
                  </p>
                )}
              </div>

              {/* Teléfono */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Teléfono <span className="text-red-400">*</span>
                </label>
                <input
                  id="paciente-telefono-input"
                  {...register("telefono")}
                  placeholder="0414-2345678"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder:text-slate-600"
                />
                {errors.telefono && (
                  <p className="text-red-400 text-xs">
                    {errors.telefono.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Correo Electrónico <span className="text-red-400">*</span>
                </label>
                <input
                  id="paciente-email-input"
                  type="email"
                  {...register("email")}
                  placeholder="empleado@mercal.gob.ve"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder:text-slate-600"
                />
                {errors.email && (
                  <p className="text-red-400 text-xs">{errors.email.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-800/80" />

          {/* ── SECCIÓN 2: ASIGNACIÓN INSTITUCIONAL ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              <span>2. Asignación Institucional</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Departamento */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Departamento <span className="text-red-400">*</span>
                </label>
                <select
                  id="paciente-departamento-select"
                  {...register("departamento")}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                >
                  <option value="">Seleccionar departamento...</option>
                  {(departments.length > 0
                    ? departments.map((d) => d.name)
                    : DEPARTAMENTOS
                  ).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                {errors.departamento && (
                  <p className="text-red-400 text-xs">
                    {errors.departamento.message}
                  </p>
                )}
              </div>

              {/* Cargo */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Cargo / Posición
                </label>
                <input
                  id="paciente-cargo-input"
                  {...register("cargo")}
                  placeholder="Ej. Analista de Operaciones"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder:text-slate-600"
                />
              </div>

              {/* Estado */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Estado del Empleado
                </label>
                <select
                  id="paciente-estado-select"
                  {...register("estado")}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                >
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                </select>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-800/80" />

          {/* ── SECCIÓN 3: FICHA MÉDICA Y DE EMERGENCIA ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm uppercase tracking-wider">
              <HeartPulse className="w-4 h-4" />
              <span>3. Ficha Médica & Contacto de Emergencia</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Tipo de Sangre */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Droplet className="w-3.5 h-3.5 text-rose-400" />
                  Grupo Sanguíneo
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {BLOOD_TYPES.map((type) => {
                    const isSelected = watchBloodType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setValue("grupoSanguineo", type)}
                        className={cn(
                          "py-2 text-xs font-bold rounded-xl border transition-all text-center",
                          isSelected
                            ? "bg-rose-500/20 border-rose-500 text-rose-300 ring-2 ring-rose-500/20"
                            : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200",
                        )}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nombre de Contacto de Emergencia */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Contacto de Emergencia (Nombre)
                </label>
                <input
                  id="paciente-emergencia-nombre-input"
                  {...register("contactoEmergenciaNombre")}
                  placeholder="Ej. Carmen Gómez (Madre)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white text-sm focus:outline-none focus:border-rose-500/80 focus:ring-2 focus:ring-rose-500/20 transition-all placeholder:text-slate-600"
                />
              </div>

              {/* Teléfono de Contacto de Emergencia */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Teléfono de Emergencia
                </label>
                <input
                  id="paciente-emergencia-telefono-input"
                  {...register("contactoEmergenciaTelefono")}
                  placeholder="Ej. 0412-9988776"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white text-sm focus:outline-none focus:border-rose-500/80 focus:ring-2 focus:ring-rose-500/20 transition-all placeholder:text-slate-600"
                />
              </div>

              {/* Alergias */}
              <div className="sm:col-span-2 lg:col-span-3 space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Alergias Conocidas y Condiciones Relevantes
                </label>
                <textarea
                  id="paciente-alergias-input"
                  {...register("alergias")}
                  rows={2}
                  placeholder="Ej. Alergia a la Penicilina, AINEs, polen, asmático..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-white text-sm focus:outline-none focus:border-rose-500/80 focus:ring-2 focus:ring-rose-500/20 transition-all placeholder:text-slate-600 resize-none"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-800/80" />

          {/* ── SECCIÓN 4: NÚCLEO FAMILIAR / BENEFICIARIOS DIRECTOS ── */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm uppercase tracking-wider">
                  <Users className="w-4 h-4" />
                  <span>4. Núcleo Familiar / Beneficiarios Directos</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300">
                    {activeBeneficiaries.length}
                  </span>
                </div>
                <p className="text-slate-400 text-xs mt-1">
                  Familiares directos con derecho a atención institucional
                  (Padres, Hijos y Cónyuge).
                </p>
              </div>

              {!showAddBeneficiary && (
                <button
                  type="button"
                  onClick={() => setShowAddBeneficiary(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 text-xs font-semibold transition-all shadow-sm shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Familiar
                </button>
              )}
            </div>

            {/* Formulario Inline para Agregar Familiar */}
            {showAddBeneficiary && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-emerald-500/30 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Nuevo Familiar Beneficiario
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddBeneficiary(false);
                      setBFormError(null);
                    }}
                    className="text-slate-500 hover:text-slate-300 text-xs"
                  >
                    ✕ Cancelar
                  </button>
                </div>

                {bFormError && (
                  <p className="text-red-400 text-xs font-medium">
                    {bFormError}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Parentesco */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-300">
                      Parentesco *
                    </label>
                    <select
                      value={newBForm.relationship}
                      onChange={(e) =>
                        setNewBForm({
                          ...newBForm,
                          relationship: e.target
                            .value as ParentescoBeneficiario,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                    >
                      {RELATIONSHIP_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Nombres */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-300">
                      Nombres *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Lucas Andrés"
                      value={newBForm.first_name}
                      onChange={(e) =>
                        setNewBForm({ ...newBForm, first_name: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Apellidos */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-300">
                      Apellidos *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Pérez Gómez"
                      value={newBForm.last_name}
                      onChange={(e) =>
                        setNewBForm({ ...newBForm, last_name: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Cédula */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-300">
                      Cédula (opcional si es menor)
                    </label>
                    <input
                      type="text"
                      placeholder="V-28123456"
                      value={newBForm.national_id}
                      onChange={(e) =>
                        setNewBForm({
                          ...newBForm,
                          national_id: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Fecha Nacimiento */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-300">
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="date"
                      value={newBForm.birth_date}
                      onChange={(e) =>
                        setNewBForm({ ...newBForm, birth_date: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Género */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-300">
                      Género
                    </label>
                    <select
                      value={newBForm.gender}
                      onChange={(e) =>
                        setNewBForm({ ...newBForm, gender: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                    </select>
                  </div>

                  {/* Teléfono */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-medium text-slate-300">
                      Teléfono (opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="0414-1234567"
                      value={newBForm.phone}
                      onChange={(e) =>
                        setNewBForm({ ...newBForm, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddBeneficiary(false)}
                    className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleAddBeneficiaryToList}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
                  >
                    Guardar Familiar
                  </button>
                </div>
              </div>
            )}

            {/* Listado de Beneficiarios Registrados */}
            {activeBeneficiaries.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-slate-800 text-center">
                <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-xs font-medium">
                  No hay familiares directos registrados aún para este paciente.
                </p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Haz clic en &quot;Agregar Familiar&quot; para registrar
                  padres, hijos o cónyuge.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {beneficiaries.map((b, index) => {
                  if (b._delete) return null;
                  const relLabel =
                    RELATIONSHIP_OPTIONS.find((r) => r.value === b.relationship)
                      ?.label ?? b.relationship;

                  const badgeColor =
                    b.relationship === "conyuge"
                      ? "bg-purple-500/10 text-purple-300 border-purple-500/20"
                      : b.relationship === "hijo" || b.relationship === "hija"
                        ? "bg-sky-500/10 text-sky-300 border-sky-500/20"
                        : "bg-amber-500/10 text-amber-300 border-amber-500/20";

                  return (
                    <div
                      key={index}
                      className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-3 group hover:border-slate-700 transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}
                          >
                            {relLabel}
                          </span>
                        </div>

                        <p className="text-white font-semibold text-sm mt-1.5 truncate">
                          {b.first_name} {b.last_name}
                        </p>

                        <div className="text-[11px] text-slate-400 space-y-0.5 mt-1 font-mono">
                          <p>
                            {b.national_id
                              ? `C.I. ${b.national_id}`
                              : "Menor de edad (S/C)"}
                          </p>
                          {b.birth_date && (
                            <p className="text-slate-500 font-sans">
                              Nac: {b.birth_date}
                            </p>
                          )}
                          {b.phone && (
                            <p className="text-slate-500 font-sans">
                              Tlf: {b.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveBeneficiary(index)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                        title="Eliminar familiar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </form>

        {/* ── PIE DE ACCIONES ── */}
        <div className="px-6 sm:px-8 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-500 hidden sm:block">
            {isEditing
              ? "Los cambios se reflejarán de inmediato en el portal del empleado"
              : "Todos los campos marcados con * son obligatorios"}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/80 text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="paciente-form"
              id="paciente-submit-btn"
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-sm font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando Expediente...
                </>
              ) : isEditing ? (
                "Guardar Cambios"
              ) : (
                "Registrar Paciente"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
