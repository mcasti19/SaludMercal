"use client";

import { useRouter } from "next/navigation";
import { Bell, LogOut, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/modules/auth/auth.store";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const initials = user
    ? `${user.nombre[0]}${user.apellido[0]}`.toUpperCase()
    : "??";

  return (
    <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700/50 flex items-center justify-between px-6 shrink-0 z-10">
      {/* Page title area — left side */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white" />
        <div className="w-1 h-6 rounded-full bg-gradient-to-b from-blue-500 to-cyan-500 hidden md:block" />
        <div className="hidden md:block">
          <h2 className="text-slate-900 dark:text-white font-semibold text-sm leading-tight">
            Sistema de Salud
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs">Mercal C.A.</p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <ThemeToggle />

        {/* Notifications */}
        <button
          id="header-notifications-btn"
          className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            id="header-user-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-slate-900 dark:text-white text-xs font-semibold leading-tight">
                {user?.nombre} {user?.apellido}
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-tight">
                {user?.roleLabel}
              </p>
            </div>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform",
                menuOpen && "rotate-180"
              )}
            />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl shadow-black/10 dark:shadow-black/30 z-20 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-slate-900 dark:text-white text-sm font-semibold">
                    {user?.nombre} {user?.apellido}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{user?.email}</p>
                  <span className="inline-flex mt-1.5 items-center px-2 py-0.5 rounded-md bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 text-xs font-medium">
                    {user?.roleLabel}
                  </span>
                </div>
                <div className="p-1.5">
                  <button
                    id="header-logout-btn"
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 text-sm transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
