"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/modules/auth/auth.store";
import {
  HeartPulse,
  LayoutDashboard,
  CalendarDays,
  FileText,
  FileBox,
  User,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  {
    label: "Mi Resumen",
    href: "/portal",
    icon: LayoutDashboard,
  },
  {
    label: "Mis Citas",
    href: "/portal/citas",
    icon: CalendarDays,
  },
  {
    label: "Mi Expediente",
    href: "/portal/expediente",
    icon: FileText,
  },
  {
    label: "Reposos Médicos",
    href: "/portal/reposos",
    icon: FileBox,
  },
  {
    label: "Mi Perfil",
    href: "/portal/perfil",
    icon: User,
  },
];

export function PortalSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { state } = useSidebar();

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className="border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" collapsible="icon">
      <SidebarHeader className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500 shrink-0">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 transition-opacity duration-200">
              <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 truncate">
                MiSaludMercal
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-3">
        <SidebarMenu>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={item.label}
                  className={cn(
                    "transition-all duration-200",
                    active
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 font-medium"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  )}
                >
                  <Link href={item.href}>
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className={cn("flex", isCollapsed ? "justify-center" : "items-center justify-between")}>
          {!isCollapsed && (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold shrink-0">
                {user?.nombre?.[0]}{user?.apellido?.[0]}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {user?.nombre} {user?.apellido}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user?.roleLabel}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className={cn(
              "p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-red-500 dark:hover:bg-slate-800 dark:hover:text-red-400 transition-colors shrink-0",
              isCollapsed && "mx-auto"
            )}
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
