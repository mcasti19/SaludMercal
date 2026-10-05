"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  CalendarClock,
  Cross,
  FileBox,
  LayoutDashboard,
  Stethoscope,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/citas",
    label: "Citas Médicas",
    icon: CalendarClock,
    exact: false,
  },
  {
    href: "/pacientes",
    label: "Pacientes",
    icon: Users,
    exact: false,
  },
  {
    href: "/medicos",
    label: "Médicos",
    icon: Stethoscope,
    exact: false,
  },
  {
    href: "/reportes",
    label: "Reportes",
    icon: BarChart3,
    exact: false,
  },
  {
    href: "/reposos",
    label: "Reposos",
    icon: FileBox,
    exact: false,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const isActive = (item: (typeof NAV_ITEMS)[0]) => {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + "/");
  };

  return (
    <Sidebar
      className="border-r border-slate-200 dark:border-slate-900"
      collapsible="icon"
    >
      <SidebarHeader className="p-4 border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-linear-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/20 shrink-0">
            <Cross className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-slate-900 dark:text-white font-bold text-sm leading-tight truncate">
                SaludMercal
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-xs truncate">
                Sistema Médico
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-500 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            Menú Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                      className={cn(
                        "transition-all duration-200 uppercase",
                        active
                          ? "bg-blue-50 dark:bg-linear-to-r dark:from-blue-600/30 dark:to-cyan-600/20 text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-600/30"
                          : "text-white hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800",
                      )}
                    >
                      <Link href={item.href}>
                        <Icon
                          className={cn(
                            "w-4 h-4 shrink-0 transition-colors",
                            active
                              ? "text-blue-500 dark:text-blue-400"
                              : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300",
                          )}
                        />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-slate-200 dark:border-slate-800">
        {!collapsed && (
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
            Mercal C.A. v0.1.0
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
