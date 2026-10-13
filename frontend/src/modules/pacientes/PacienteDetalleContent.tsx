"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  FileCheck2,
  HeartPulse,
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  AlertTriangle,
  Download,
  Plus,
  RefreshCw,
  Pencil,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock3,
  Stethoscope,
  ShieldAlert,
  Droplet,
  ExternalLink,
} from "lucide-react";
import { usePacientesStore } from "./pacientes.store";
import { useMedicosStore } from "@/modules/medicos/medicos.store";
import { Paciente, Cita, Reposo } from "@/types";
import { calcularEdad } from "@/lib/utils";
import {
  apiDownloadAppointmentPrescription,
  apiDownloadMedicalLeaveCertificate,
  downloadBlobAsFile,
} from "@/lib/api";
import { NuevoPacienteModal } from "./NuevoPacienteModal";
import { NuevaCitaModal } from "@/modules/citas/NuevaCitaModal";

interface PacienteDetalleContentProps {
  patientId: string;
}

type TabType = "citas" | "reposos" | "ficha";

export function PacienteDetalleContent({ patientId }: PacienteDetalleContentProps) {
  const router = useRouter();
  const { currentPaciente, fetchPacienteById, isLoading, error } = usePacientesStore();
  const { medicos, fetchMedicos } = useMedicosStore();

  const [activeTab, setActiveTab] = useState<TabType>("citas");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNewCitaModal, setShowNewCitaModal] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const loadData = useCallback(() => {
    fetchPacienteById(patientId);
    fetchMedicos();
  }, [fetchPacienteById, fetchMedicos, patientId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Prescription PDF Download
  const handleDownloadPrescription = async (citaId: string) => {
    try {
      setDownloadingId(`prescription-${citaId}`);
      setDownloadError(null);
      const blob = await apiDownloadAppointmentPrescription(citaId);
      const filename = `recipe-medico-${currentPaciente?.cedula ?? "cita"}-${citaId}.pdf`;
      downloadBlobAsFile(blob, filename);
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : "Error al descargar el récipe médico"
      );
    } finally {
      setDownloadingId(null);
    }
  };

  // Handle Medical Leave Certificate PDF Download
  const handleDownloadLeaveCertificate = async (reposoId: string) => {
    try {
      setDownloadingId(`leave-${reposoId}`);
      setDownloadError(null);
      const blob = await apiDownloadMedicalLeaveCertificate(reposoId);
      const filename = `constancia-reposo-${currentPaciente?.cedula ?? "reposo"}-${reposoId}.pdf`;
      downloadBlobAsFile(blob, filename);
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : "Error al descargar la constancia de reposo"
      );
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading && !currentPaciente) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-8">
        <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
        <h3 className="text-slate-800 dark:text-slate-200 font-semibold text-lg">
          Cargando expediente clínico...
        </h3>
        <p className="text-slate-500 text-sm mt-1">
          Consultando registros médicos, consultas y reposos de Mercal.
        </p>
      </div>
    );
  }

  if (error || !currentPaciente) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto border border-red-500/20">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          No se encontró el paciente
        </h2>
        <p className="text-slate-500 text-sm">
          {error ?? "El paciente solicitado no existe en la base de datos o ha sido dado de baja."}
        </p>
        <Link
          href="/pacientes"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al directorio de pacientes
        </Link>
      </div>
    );
  }

  const p = currentPaciente;
  const appointments: Cita[] = p.appointments ?? [];
  const medicalLeaves: Reposo[] = p.medical_leaves ?? [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/pacientes"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Volver al Directorio de Pacientes</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadData()}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Actualizar expediente"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-500" : ""}`} />
          </button>
          <button
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-sm"
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar Datos
          </button>
          <button
            onClick={() => setShowNewCitaModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold hover:from-blue-400 hover:to-cyan-400 transition-all shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            Nueva Cita
          </button>
        </div>
      </div>

      {/* Global Alerts if any */}
      {downloadError && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{downloadError}</span>
          </div>
          <button
            onClick={() => setDownloadError(null)}
            className="text-xs font-semibold text-red-700 underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Main Patient Header Card */}
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-700/40">
          <div className="flex items-start md:items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-blue-600/30 text-blue-600 dark:text-cyan-400 flex items-center justify-center text-xl md:text-2xl font-bold shadow-inner border border-blue-500/20">
                {p.nombre[0]}
                {p.apellido[0]}
              </div>
              <span
                className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 ${
                  p.estado === "ACTIVO" ? "bg-emerald-500" : "bg-slate-400"
                }`}
                title={p.estado === "ACTIVO" ? "Paciente Activo" : "Paciente Inactivo"}
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                  {p.nombre} {p.apellido}
                </h1>
                <span className="px-2.5 py-0.5 rounded-lg font-mono text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                  {p.cedula}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    p.estado === "ACTIVO"
                      ? "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-800"
                      : "text-slate-500 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      p.estado === "ACTIVO" ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                  />
                  {p.estado === "ACTIVO" ? "Activo" : "Inactivo"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-slate-500 dark:text-slate-400">
                <span>{p.departamento}</span>
                {p.cargo && <span>• {p.cargo}</span>}
                <span className="flex items-center gap-1">
                  •{" "}
                  {p.isHeadquarters ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      <Building2 className="w-3.5 h-3.5 text-blue-500" />
                      Sede Central (Torre Caracas)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {p.sede ?? "Red Nacional"}
                      {p.location?.state ? ` · ${p.location.state}` : ""}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 self-start lg:self-center">
            <div className="px-4 py-3 rounded-2xl bg-blue-50/50 dark:bg-slate-700/30 border border-blue-100 dark:border-slate-700 text-center min-w-[100px]">
              <span className="text-2xl font-bold text-blue-600 dark:text-cyan-400 block">
                {appointments.length}
              </span>
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Consultas
              </span>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-amber-50/50 dark:bg-slate-700/30 border border-amber-100 dark:border-slate-700 text-center min-w-[100px]">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 block">
                {medicalLeaves.length}
              </span>
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Reposos
              </span>
            </div>
          </div>
        </div>

        {/* Demographics & Clinical Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-6">
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Nacimiento / Edad
            </span>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {calcularEdad(p.fechaNacimiento)} años
            </p>
            <p className="text-xs text-slate-400">{p.fechaNacimiento}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1">
              <Droplet className="w-3.5 h-3.5 text-rose-500" />
              Grupo Sanguíneo
            </span>
            <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
              {p.grupoSanguineo ?? "No especificado"}
            </p>
            <p className="text-xs text-slate-400">Tipo de sangre registrado</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              Alergias Conocidas
            </span>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate" title={p.alergias ?? "Ninguna alergia registrada"}>
              {p.alergias ? p.alergias : "Ninguna registrada"}
            </p>
            <p className="text-xs text-slate-400">Expediente alergológico</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1">
              <Phone className="w-3.5 h-3.5 text-emerald-500" />
              Contacto de Emergencia
            </span>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
              {p.contactoEmergenciaNombre ?? "No registrado"}
            </p>
            <p className="text-xs text-slate-400">{p.contactoEmergenciaTelefono ?? "Sin teléfono"}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700/60 flex items-center gap-4">
        <button
          onClick={() => setActiveTab("citas")}
          className={`pb-3.5 text-sm font-semibold transition-all relative flex items-center gap-2 ${
            activeTab === "citas"
              ? "text-blue-600 dark:text-cyan-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Consultas y Citas Médicas</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {appointments.length}
          </span>
          {activeTab === "citas" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("reposos")}
          className={`pb-3.5 text-sm font-semibold transition-all relative flex items-center gap-2 ${
            activeTab === "reposos"
              ? "text-blue-600 dark:text-cyan-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Reposos Médicos</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {medicalLeaves.length}
          </span>
          {activeTab === "reposos" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("ficha")}
          className={`pb-3.5 text-sm font-semibold transition-all relative flex items-center gap-2 ${
            activeTab === "ficha"
              ? "text-blue-600 dark:text-cyan-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Sede y Ficha Laboral</span>
          {activeTab === "ficha" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
          )}
        </button>
      </div>

      {/* TAB CONTENT: CITAS / CONSULTAS */}
      {activeTab === "citas" && (
        <div className="space-y-4">
          {appointments.length === 0 ? (
            <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-12 text-center max-w-lg mx-auto">
              <Stethoscope className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-slate-800 dark:text-slate-200 font-semibold text-base">
                No hay consultas registradas
              </h3>
              <p className="text-slate-500 text-sm mt-1 mb-5">
                El paciente aún no posee citas o atenciones médicas en el sistema.
              </p>
              <button
                onClick={() => setShowNewCitaModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold hover:from-blue-400 hover:to-cyan-400 transition-all shadow-md shadow-blue-500/20"
              >
                <Plus className="w-4 h-4" />
                Agendar Primera Cita
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {appointments.map((apt) => {
                const isCompleted = apt.estado === "COMPLETADA";
                const isPending = apt.estado === "PENDIENTE";
                const isConfirmed = apt.estado === "CONFIRMADA";
                const isDownloading = downloadingId === `prescription-${apt.id}`;

                return (
                  <div
                    key={apt.id}
                    className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-all shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white text-base">
                            {apt.especialidad || "Medicina General"}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              isCompleted
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                                : isConfirmed
                                ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                                : isPending
                                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                                : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                            }`}
                          >
                            {apt.estado}
                          </span>
                        </div>

                        <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">
                          {apt.medicoNombre}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {apt.fecha}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {apt.hora}
                          </span>
                        </div>
                      </div>

                      {/* Download Prescription Button */}
                      {isCompleted && (
                        <button
                          onClick={() => handleDownloadPrescription(apt.id)}
                          disabled={isDownloading}
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 text-xs font-semibold transition-all shrink-0 self-start disabled:opacity-50"
                          title="Descargar récipe y órdenes médicas en formato PDF oficial"
                        >
                          <Download className={`w-3.5 h-3.5 ${isDownloading ? "animate-bounce" : ""}`} />
                          {isDownloading ? "Generando PDF..." : "Descargar Récipe (PDF)"}
                        </button>
                      )}
                    </div>

                    {/* Reason & Medical Notes */}
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-750 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80">
                        <span className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                          Motivo de Consulta:
                        </span>
                        <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line">
                          {apt.motivo}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80">
                        <span className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                          Diagnóstico & Indicaciones:
                        </span>
                        <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line">
                          {apt.notas ?? "Sin notas clínicas registradas aún."}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: REPOSOS MEDICOS */}
      {activeTab === "reposos" && (
        <div className="space-y-4">
          {medicalLeaves.length === 0 ? (
            <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-12 text-center max-w-lg mx-auto">
              <FileCheck2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-slate-800 dark:text-slate-200 font-semibold text-base">
                No posee reposos médicos registrados
              </h3>
              <p className="text-slate-500 text-sm mt-1">
                El paciente no tiene reposos laborales ni certificados médicos emitidos.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {medicalLeaves.map((leave) => {
                const isApproved = leave.estado === "APROBADO";
                const isPending = leave.estado === "PENDIENTE";
                const isDownloading = downloadingId === `leave-${leave.id}`;

                return (
                  <div
                    key={leave.id}
                    className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 hover:border-amber-500/40 dark:hover:border-amber-500/40 transition-all shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white text-base">
                            Reposo por {leave.tipo}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              isApproved
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                                : isPending
                                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                                : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800"
                            }`}
                          >
                            {leave.estado}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-750 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                            {leave.dias} {leave.dias === 1 ? "día" : "días"}
                          </span>
                        </div>

                        <p className="text-slate-600 dark:text-slate-300 text-sm">
                          {leave.medicoTratante}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <span>
                            Desde: <strong className="text-slate-700 dark:text-slate-300">{leave.fechaInicio}</strong>
                          </span>
                          <span>
                            Hasta: <strong className="text-slate-700 dark:text-slate-300">{leave.fechaFin}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Download Certificate PDF */}
                      {isApproved && (
                        <button
                          onClick={() => handleDownloadLeaveCertificate(leave.id)}
                          disabled={isDownloading}
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 text-xs font-semibold transition-all shrink-0 self-start disabled:opacity-50"
                          title="Descargar constancia oficial de convalidación de reposo médico"
                        >
                          <Download className={`w-3.5 h-3.5 ${isDownloading ? "animate-bounce" : ""}`} />
                          {isDownloading ? "Generando PDF..." : "Descargar Constancia (PDF)"}
                        </button>
                      )}
                    </div>

                    {/* Diagnosis & Admin Notes */}
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-750 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80">
                        <span className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                          Diagnóstico Médico:
                        </span>
                        <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line">
                          {leave.diagnostico}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80">
                        <span className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                          Revisión / Convalidación RRHH:
                        </span>
                        <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line">
                          {leave.notasAdmin ?? (isPending ? "Pendiente de evaluación médica." : "Convalidado conforme.")}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: FICHA LABORAL Y SEDE */}
      {activeTab === "ficha" && (
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-750">
            <Building2 className="w-5 h-5 text-blue-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Adscripción Organizacional y Geográfica en Mercal
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">Sede de Trabajo</span>
                <p className="text-slate-900 dark:text-white font-medium text-base mt-0.5">
                  {p.sede ?? "Sede Central Mercal"}
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">Tipo de Instalación</span>
                <p className="text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                  {p.isHeadquarters ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      <Building2 className="w-3.5 h-3.5 text-blue-500" />
                      Torre Principal · Sede Central
                    </span>
                  ) : (
                    "Sede Operativa Regional / Centro de Distribución"
                  )}
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">Estado / Entidad Federal</span>
                <p className="text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                  {p.location?.state ?? (p.isHeadquarters ? "Distrito Capital" : "Nacional")}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">Departamento</span>
                <p className="text-slate-900 dark:text-white font-medium text-base mt-0.5">
                  {p.departamento}
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">Cargo / Posición</span>
                <p className="text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                  {p.cargo ?? "Trabajador Activo"}
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">Correo y Contacto Laboral</span>
                <p className="text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                  {p.email || "No registrado"} {p.telefono ? `· ${p.telefono}` : ""}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      {showEditModal && (
        <NuevoPacienteModal
          paciente={p}
          onClose={() => {
            setShowEditModal(false);
            loadData();
          }}
        />
      )}

      {/* New Appointment Modal */}
      {showNewCitaModal && (
        <NuevaCitaModal
          onClose={() => setShowNewCitaModal(false)}
          pacientes={[p]}
          medicos={medicos}
          defaultPacienteId={p.id}
          onSuccess={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
}
