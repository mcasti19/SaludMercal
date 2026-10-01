"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Stethoscope, AlertCircle } from "lucide-react";
import { useAuthStore, getRedirectPath } from "@/modules/auth/auth.store";
import { loginSchema, LoginFormValues } from "@/lib/schemas";
import { DEMO_CREDENTIALS, DEMO_EMPLEADO_CREDENTIALS } from "@/modules/auth/auth.mocks";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { cedula: "", password: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    const success = await login(data.cedula, data.password);
    if (success) {
      const user = useAuthStore.getState().user;
      if (user) {
        router.push(getRedirectPath(user.role));
      } else {
        router.push("/");
      }
    }
  };

  const fillDemo = () => {
    setValue("cedula", DEMO_CREDENTIALS.cedula);
    setValue("password", DEMO_CREDENTIALS.password);
    clearError();
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-blue-950 dark:to-slate-900">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-600/5 blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(99,179,237,1) 1px, transparent 1px), linear-gradient(to right, rgba(99,179,237,1) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-md px-4">
        {/* Card */}
        <div className="bg-white/90 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-2xl shadow-blue-900/10 dark:shadow-black/40">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30 mb-4">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              SaludMercal
            </h1>
            <p className="text-slate-600 dark:text-blue-200/70 text-sm mt-1">
              Sistema de Gestión de Citas Médicas
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id="login-form">
            {/* Error global */}
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Cédula */}
            <div className="space-y-1.5">
              <label
                htmlFor="cedula-input"
                className="block text-sm font-medium text-slate-700 dark:text-blue-100"
              >
                Cédula de Identidad
              </label>
              <input
                id="cedula-input"
                type="text"
                placeholder="V-12345678"
                {...register("cedula")}
                onChange={(e) => {
                  clearError();
                  register("cedula").onChange(e);
                }}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 dark:bg-white/10 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 focus:border-blue-500/50 dark:focus:border-blue-400/50 transition-all text-sm"
              />
              {errors.cedula && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.cedula.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password-input"
                className="block text-sm font-medium text-slate-700 dark:text-blue-100"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  onChange={(e) => {
                    clearError();
                    register("password").onChange(e);
                  }}
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-50 border border-slate-200 dark:bg-white/10 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 focus:border-blue-500/50 dark:focus:border-blue-400/50 transition-all text-sm"
                />
                <button
                  type="button"
                  id="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-white/40 dark:hover:text-white/70 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              id="login-submit-btn"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-sm hover:from-blue-400 hover:to-cyan-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
            >
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

          {/* Demo credentials hint */}
          <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <p className="text-slate-600 dark:text-blue-200/70 text-xs text-center mb-2">
              🔑 <strong>Credenciales de demostración</strong>
            </p>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <button
                type="button"
                id="fill-demo-admin-btn"
                onClick={() => {
                  setValue("cedula", DEMO_CREDENTIALS.cedula);
                  setValue("password", DEMO_CREDENTIALS.password);
                  clearError();
                }}
                className="py-2 px-2 rounded-lg bg-blue-50 dark:bg-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/30 text-blue-600 dark:text-blue-200 text-[10px] sm:text-xs font-medium transition-colors text-center leading-tight"
              >
                Como Administrador<br/>
                <span className="opacity-70 font-normal mt-0.5 inline-block">V-10234567</span>
              </button>
              <button
                type="button"
                id="fill-demo-empleado-btn"
                onClick={() => {
                  setValue("cedula", DEMO_EMPLEADO_CREDENTIALS.cedula);
                  setValue("password", DEMO_EMPLEADO_CREDENTIALS.password);
                  clearError();
                }}
                className="py-2 px-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/30 text-emerald-600 dark:text-emerald-200 text-[10px] sm:text-xs font-medium transition-colors text-center leading-tight"
              >
                Como Empleado<br/>
                <span className="opacity-70 font-normal mt-0.5 inline-block">V-20987654</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 dark:text-white/20 text-xs mt-6">
          © 2026 Mercal C.A. — Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}
