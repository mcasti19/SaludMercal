"use client";

import { LoginFormValues, loginSchema } from "@/lib/schemas";
import { getRedirectPath, useAuthStore } from "@/modules/auth/auth.store";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Activity,
  AlertCircle,
  Building2,
  ClipboardList,
  Crown,
  Eye,
  EyeOff,
  HeartPulse,
  Lock,
  MapPin,
  ShieldCheck,
  Stethoscope,
  User,
  UserCheck,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

interface QuickRoleItem {
  role: string;
  label: string;
  username: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeBg: string;
  hoverBorder: string;
}

const QUICK_ROLES: QuickRoleItem[] = [
  {
    role: "super_admin",
    label: "SuperAdmin",
    username: "moicastillo",
    detail: "Moisés C. · Nacional",
    icon: Crown,
    badgeBg: "bg-amber-500/10 border-amber-500/25 text-amber-300",
    hoverBorder: "hover:border-amber-500/40 hover:bg-amber-500/5",
  },
  {
    role: "admin_central",
    label: "Admin Central",
    username: "admin",
    detail: "Sede Central Caracas",
    icon: Building2,
    badgeBg: "bg-blue-500/10 border-blue-500/25 text-blue-300",
    hoverBorder: "hover:border-blue-500/40 hover:bg-blue-500/5",
  },
  {
    role: "admin_regional",
    label: "Admin Estado",
    username: "admin.zulia",
    detail: "Coordinación Zulia",
    icon: MapPin,
    badgeBg: "bg-sky-500/10 border-sky-500/25 text-sky-300",
    hoverBorder: "hover:border-sky-500/40 hover:bg-sky-500/5",
  },
  {
    role: "logical_security",
    label: "Seg. Lógica",
    username: "seguridad.logica",
    detail: "División OTIC (IAM)",
    icon: ShieldCheck,
    badgeBg: "bg-purple-500/10 border-purple-500/25 text-purple-300",
    hoverBorder: "hover:border-purple-500/40 hover:bg-purple-500/5",
  },
  {
    role: "doctor",
    label: "Médico",
    username: "carlos.mendoza",
    detail: "Dr. Carlos Mendoza",
    icon: Stethoscope,
    badgeBg: "bg-emerald-500/10 border-emerald-500/25 text-emerald-300",
    hoverBorder: "hover:border-emerald-500/40 hover:bg-emerald-500/5",
  },
  {
    role: "nurse",
    label: "Enfermería",
    username: "enfermeria",
    detail: "Lic. Mariana Gómez",
    icon: HeartPulse,
    badgeBg: "bg-rose-500/10 border-rose-500/25 text-rose-300",
    hoverBorder: "hover:border-rose-500/40 hover:bg-rose-500/5",
  },
  {
    role: "receptionist",
    label: "Recepción",
    username: "recepcion",
    detail: "Triage y Citas Central",
    icon: ClipboardList,
    badgeBg: "bg-orange-500/10 border-orange-500/25 text-orange-300",
    hoverBorder: "hover:border-orange-500/40 hover:bg-orange-500/5",
  },
  {
    role: "employee",
    label: "Paciente / Emp.",
    username: "empleado",
    detail: "Juan Carlos Pérez",
    icon: UserCheck,
    badgeBg: "bg-teal-500/10 border-teal-500/25 text-teal-300",
    hoverBorder: "hover:border-teal-500/40 hover:bg-teal-500/5",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const {
    login,
    isLoading,
    error,
    clearError,
    isAuthenticated,
    user,
    isHydrated,
  } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isHydrated && isAuthenticated && user) {
      router.replace(getRedirectPath(user.role));
    }
  }, [isHydrated, isAuthenticated, user, router]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { login: "", password: "" },
  });

  const [activeQuickUser, setActiveQuickUser] = useState<string | null>(null);

  const handleQuickLogin = async (username: string) => {
    const defaultPassword = "Password123*";
    setValue("login", username, { shouldValidate: true });
    setValue("password", defaultPassword, { shouldValidate: true });
    setActiveQuickUser(username);
    clearError();

    const success = await login(username, defaultPassword);
    if (success) {
      const authUser = useAuthStore.getState().user;
      if (authUser) {
        router.push(getRedirectPath(authUser.role));
      } else {
        router.push("/");
      }
    } else {
      setActiveQuickUser(null);
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    setActiveQuickUser(null);
    const success = await login(data.login, data.password);
    if (success) {
      const user = useAuthStore.getState().user;
      if (user) {
        router.push(getRedirectPath(user.role));
      } else {
        router.push("/");
      }
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* ── PANEL IZQUIERDO ── */}
      <div className="relative hidden lg:flex lg:w-3/5 flex-col justify-between overflow-hidden">
        {/* Imagen de fondo */}
        <Image
          src="/fondoLogin.webp"
          alt="Fondo SaludMercal"
          fill
          priority
          className="object-cover object-center"
        />

        {/* Overlay degradado azul profundo */}
        <div className="absolute inset-0 bg-linear-to-br from-blue-950/90 via-blue-900/80 to-cyan-900/70" />

        {/* Blobs decorativos */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none" />

        {/* Contenido */}
        <div className="relative z-10 flex flex-col justify-between h-full p-10 xl:p-14">
          {/* Parte superior: Logo */}
          <div className="flex flex-col gap-3.5">
            <div className="relative w-40 h-40 shrink-0 drop-shadow-md transition-transform duration-200 hover:scale-105">
              <Image
                src="/logoMercalSalud.png"
                alt="Logo SaludMercal"
                width={150}
                height={150}
                priority
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-white font-bold text-3xl tracking-tight leading-none block">
                SaludMercal
              </span>
              <p className="text-blue-200/75 text-xl font-medium leading-none mt-1">
                Sistema de Gestión de Salud
              </p>
            </div>
          </div>

          {/* Centro: Titular principal */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-400/15 border border-cyan-400/25 backdrop-blur-sm">
                <Activity className="w-3.5 h-3.5 text-cyan-300" />
                <span className="text-cyan-200 text-xs font-medium tracking-wide uppercase">
                  Plataforma Oficial Mercal
                </span>
              </div>
              <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight">
                Tu salud,{" "}
                <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-300 to-blue-300">
                  nuestra misión
                </span>
              </h1>
              <p className="text-blue-100/80 text-lg leading-relaxed max-w-md">
                Gestionamos tus citas médicas con tecnología al servicio del
                bienestar de toda la familia venezolana.
              </p>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: ShieldCheck, label: "Atención Segura" },
                { icon: Activity, label: "Seguimiento en Tiempo Real" },
                { icon: HeartPulse, label: "Cuidado Integral" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15"
                >
                  <Icon className="w-4 h-4 text-cyan-300" />
                  <span className="text-white/90 text-sm font-medium">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Parte inferior */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {["bg-blue-400", "bg-cyan-400", "bg-blue-300"].map((c, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full ${c} border-2 border-blue-900/60 flex items-center justify-center`}
                >
                  <User className="w-3.5 h-3.5 text-blue-950" />
                </div>
              ))}
            </div>
            <p className="text-blue-100/70 text-sm">
              Miles de familias atendidas cada día
            </p>
          </div>
        </div>
      </div>
      {/* ── PANEL DERECHO ── */}
      <div className="flex-1 flex flex-col justify-start lg:justify-center items-center bg-slate-950 relative overflow-y-auto py-8 sm:py-12">
        {/* Ambient light glow */}
        <div className="absolute top-1/4 right-10 w-96 h-96 rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-80 h-80 rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none" />

        {/* Dynamic Grid Background */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative z-10 w-full max-w-md px-6 sm:px-8 py-10">
          {/* Logo solo en móvil */}
          <div className="flex flex-col lg:hidden items-center justify-center gap-3.5 mb-8">
            <div className="relative w-30 h-30 shrink-0 drop-shadow-md transition-transform duration-200 hover:scale-105">
              <Image
                src="/logoMercalSalud.png"
                alt="Logo SaludMercal"
                width={100}
                height={100}
                priority
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-center">
              <span className="text-white font-bold text-3xl tracking-tight block">
                SaludMercal
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Sistema de Gestión de Salud
              </p>
            </div>
          </div>

          {/* Encabezado */}
          <div className="mb-8 text-left">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Iniciar Sesión
            </h2>
            {/* <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">
              Ingresa tus credenciales para acceder al portal
            </p> */}
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
            id="login-form"
            noValidate
          >
            {/* Alert Error Global */}
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {/* Input Usuario */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-input"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  Usuario o Correo
                </label>
              </div>

              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-400 transition-colors duration-200 pointer-events-none">
                  <User className="w-4 h-4" />
                </div>

                <input
                  id="login-input"
                  type="text"
                  autoComplete="username"
                  placeholder="ej. usuario o nombre@mercal.gob.ve"
                  aria-invalid={!!errors.login}
                  aria-describedby={errors.login ? "login-error" : undefined}
                  {...register("login", {
                    onChange: () => clearError(),
                  })}
                  className={`w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-900/80 border text-slate-100 placeholder:text-slate-500 text-sm transition-all duration-200 shadow-inner focus:outline-none ${
                    errors.login
                      ? "border-red-500/70 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                      : "border-slate-800 hover:border-slate-700 focus:border-cyan-500/80 focus:ring-4 focus:ring-cyan-500/10"
                  }`}
                />

                {errors.login && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-red-400 pointer-events-none">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                )}
              </div>

              {errors.login && (
                <p
                  id="login-error"
                  className="text-red-400 text-xs font-medium pl-1 flex items-center gap-1.5 animate-in fade-in duration-150"
                >
                  {errors.login.message}
                </p>
              )}
            </div>

            {/* Input Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password-input"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  Contraseña
                </label>
              </div>

              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-400 transition-colors duration-200 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>

                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  {...register("password", {
                    onChange: () => clearError(),
                  })}
                  className={`w-full pl-10 pr-12 py-3.5 rounded-xl bg-slate-900/80 border text-slate-100 placeholder:text-slate-500 text-sm transition-all duration-200 shadow-inner focus:outline-none ${
                    errors.password
                      ? "border-red-500/70 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                      : "border-slate-800 hover:border-slate-700 focus:border-cyan-500/80 focus:ring-4 focus:ring-cyan-500/10"
                  }`}
                />

                <button
                  type="button"
                  id="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 focus:text-cyan-400 transition-colors rounded-lg focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {errors.password && (
                <p
                  id="password-error"
                  className="text-red-400 text-xs font-medium pl-1 flex items-center gap-1.5 animate-in fade-in duration-150"
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="login-submit-btn"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-linear-to-r from-blue-600 via-blue-500 to-cyan-500 text-white font-medium text-sm hover:brightness-110 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 focus:outline-none focus:ring-4 focus:ring-cyan-500/20"
            >
              {isLoading && !activeQuickUser ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Autenticando...
                </span>
              ) : (
                "Acceder al Sistema"
              )}
            </button>
          </form>

          {/* ── ACCESOS RÁPIDOS DE DESARROLLO ── */}
          <div className="mt-8 space-y-3">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800/80" />
              </div>
              <div className="relative bg-slate-950 px-3 flex items-center gap-1.5 text-xs text-slate-400">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-medium tracking-wide">Acceso Rápido por Rol</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
                  DEV
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              Haz clic en cualquier rol para ingresar automáticamente
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {QUICK_ROLES.map((r) => {
                const Icon = r.icon;
                const isSelectedLoading = isLoading && activeQuickUser === r.username;
                return (
                  <button
                    key={r.username}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleQuickLogin(r.username)}
                    className={`group relative flex items-center gap-2.5 p-2 rounded-xl border border-slate-800/80 bg-slate-900/40 ${r.hoverBorder} transition-all duration-200 text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className={`p-1.5 rounded-lg border shrink-0 transition-transform duration-200 group-hover:scale-105 ${r.badgeBg}`}>
                      {isSelectedLoading ? (
                        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin block" />
                      ) : (
                        <Icon className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                        {r.label}
                      </p>
                      <p className="text-[10px] text-slate-400 group-hover:text-slate-300 truncate">
                        {r.detail}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Badge Informativo */}
          <div className="mt-8 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <p className="text-slate-400 text-xs text-center leading-relaxed">
              🔒 Utiliza tu usuario o correo{" "}
              <span className="text-cyan-400 font-medium">@mercal.gob.ve</span>{" "}
              registrado.
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-slate-500 text-xs mt-8">
            © 2026 Mercal C.A. — Todos los derechos reservados
          </p>
        </div>
      </div>
    </div>
  );
}
