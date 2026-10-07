"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, AlertCircle, User, Lock, HeartPulse, ShieldCheck, Activity } from "lucide-react";
import { useAuthStore, getRedirectPath } from "@/modules/auth/auth.store";
import { loginSchema, LoginFormValues } from "@/lib/schemas";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { login: "", password: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
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
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/90 via-blue-900/80 to-cyan-900/70" />

        {/* Blobs decorativos */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none" />

        {/* Contenido */}
        <div className="relative z-10 flex flex-col justify-between h-full p-10 xl:p-14">
          {/* Parte superior: Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 shadow-lg">
              <HeartPulse className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <span className="text-white font-bold text-lg tracking-tight leading-none">
                SaludMercal
              </span>
              <p className="text-blue-200/70 text-xs leading-none mt-0.5">
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
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">
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
                  <span className="text-white/90 text-sm font-medium">{label}</span>
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
      <div className="flex-1 flex flex-col justify-center items-center bg-slate-950 relative overflow-hidden">
        {/* Cuadrícula sutil */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(99,179,237,1) 1px, transparent 1px), linear-gradient(to right, rgba(99,179,237,1) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
        {/* Glow blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-cyan-600/8 blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 w-full max-w-sm px-6 py-10">
          {/* Logo solo en móvil */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">SaludMercal</span>
          </div>

          {/* Encabezado */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Bienvenido de vuelta
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id="login-form">
            {/* Error global */}
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Usuario */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-input"
                className="block text-sm font-medium text-slate-300"
              >
                Usuario o Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="login-input"
                  type="text"
                  autoComplete="username"
                  placeholder="moicastillo o correo@mercal.gob.ve"
                  {...register("login")}
                  onChange={(e) => {
                    clearError();
                    register("login").onChange(e);
                  }}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 hover:border-slate-600 transition-all text-sm"
                />
              </div>
              {errors.login && (
                <p className="text-red-400 text-xs mt-1">{errors.login.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password-input"
                className="block text-sm font-medium text-slate-300"
              >
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register("password")}
                  onChange={(e) => {
                    clearError();
                    register("password").onChange(e);
                  }}
                  className="w-full pl-10 pr-12 py-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 hover:border-slate-600 transition-all text-sm"
                />
                <button
                  type="button"
                  id="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Botón submit */}
            <button
              type="submit"
              id="login-submit-btn"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-sm hover:from-blue-500 hover:to-cyan-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-lg shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed mt-2 relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300" />
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verificando...
                </span>
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </form>

          {/* Badge informativo */}
          <div className="mt-6 p-3.5 rounded-xl bg-blue-500/8 border border-blue-500/15">
            <p className="text-slate-400 text-xs text-center">
              🔒 Ingresa con tu{" "}
              <span className="text-blue-300 font-medium">nombre de usuario</span> o{" "}
              <span className="text-blue-300 font-medium">correo institucional</span>
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-slate-600 text-xs mt-8">
            © 2026 Mercal C.A. — Todos los derechos reservados
          </p>
        </div>
      </div>
    </div>
  );
}
