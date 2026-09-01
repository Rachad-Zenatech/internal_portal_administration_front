import { ChevronDown, ChevronRight, PanelRight } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { navigation } from "./Navigation";
import { useState, useEffect } from "react";
import zenatechLogo from "@/assets/zenatech_logo.png";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "../../lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/apiClient";
import type { LucideIcon } from "lucide-react";
import { useUnreadNotificationCount } from "@/hooks/useNotifications";
import { usePurchasingSummary } from "@/hooks/usePurchasing";

interface SidebarUser {
  is_super_admin?: boolean;
  assigned_roles?: Array<{ code: string }>;
}

interface SidebarNavigationItem {
  label: string;
  path?: string;
  icon: LucideIcon;
  section?: string;
  navigationCode?: string;
  subItems?: Array<{
    label: string;
    path: string;
    navigationCode?: string;
  }>;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({
  isOpen,
  onToggle,
}: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const location = useLocation();
  const navigate = useNavigate();

  const { hasPermission, hasRole, user } = useAuth();
  const isSuperAdmin = hasRole("SUPER_ADMIN") || user?.is_super_admin;

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiClient.get<SidebarUser[]>("/api/configuration/users"),
    enabled: !!isSuperAdmin,
  });

  const pendingUsersCount = users?.filter((u) =>
    !u.is_super_admin && 
    (!u.assigned_roles || u.assigned_roles.length === 0 || u.assigned_roles.every((role) => role.code === "PENDING_USER"))
  ).length || 0;

  const { data: unreadCountData } = useUnreadNotificationCount({
    refetchInterval: 10000, // Poll every 10 seconds to keep counts fresh
  });
  const unreadCount = unreadCountData?.count ?? 0;

  const { data: purchasingSummary } = usePurchasingSummary();

  const getSubItemCount = (path: string): number | undefined => {
    if (!purchasingSummary) return undefined;
    if (path === "/purchasing/requests") return purchasingSummary.total_requests;
    if (path === "/purchasing/recurring") return purchasingSummary.recurring_total ?? 0;
    if (path.includes("/purchasing/recurring")) {
      const searchParams = new URLSearchParams(path.includes("?") ? path.split("?")[1] : "");
      const filterKey = searchParams.get("filter")?.toUpperCase();
      if (filterKey === "DUE_SOON") return purchasingSummary.recurring_due_soon_count ?? 0;
      if (filterKey === "WAITING_REVIEW") return purchasingSummary.recurring_waiting_review ?? 0;
      if (filterKey === "REVIEWED") return purchasingSummary.recurring_reviewed ?? 0;
      return purchasingSummary.recurring_total ?? 0;
    }
    const searchParams = new URLSearchParams(path.includes("?") ? path.split("?")[1] : "");
    const statusKey = searchParams.get("status")?.toUpperCase();
    if (!statusKey) return undefined;
    if (statusKey === "PURCHASED") {
      return (purchasingSummary.status_counts?.PURCHASED ?? 0) + (purchasingSummary.status_counts?.ORDERED ?? 0);
    }
    return purchasingSummary.status_counts?.[statusKey] ?? 0;
  };

  useEffect(() => {
    if (location.pathname.startsWith("/purchasing/requests")) {
      setExpandedItems(prev => ({ ...prev, "Purchase Requests": true }));
    }
    if (location.pathname.startsWith("/purchasing/recurring")) {
      setExpandedItems(prev => ({ ...prev, "Recurring Payments": true }));
    }
  }, [location.pathname]);

  const toggleExpand = (label: string) => {
    setExpandedItems(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const groupedNavigation = navigation.reduce<Record<string, SidebarNavigationItem[]>>((acc, item) => {
    // Pure Role Permission Gating: Check item navigation permission
    if (item.navigationCode) {
      const hasItemAccess =
        isSuperAdmin ||
        hasPermission(`${item.navigationCode}_READ`) ||
        hasPermission(`${item.navigationCode}_VIEW`);
      if (!hasItemAccess) return acc;
    }

    const filteredSubItems = item.subItems 
      ? item.subItems.filter(sub => {
          if ('navigationCode' in sub && sub.navigationCode) {
            const navCode = (sub as { navigationCode?: string }).navigationCode;
            const hasSubAccess =
              isSuperAdmin ||
              hasPermission(`${navCode}_READ`) ||
              hasPermission(`${navCode}_VIEW`);
            if (!hasSubAccess) return false;
          }
          return true;
        })
      : undefined;

    // If it had subItems but now they are all filtered out, don't show the parent if it relies on subItems
    if (item.subItems && (!filteredSubItems || filteredSubItems.length === 0)) {
      return acc;
    }

    const section = item.section || "GENERAL";
    if (!acc[section]) acc[section] = [];
    
    acc[section].push({ ...item, subItems: filteredSubItems });
    return acc;
  }, {});

  return (
    <>
      {/* Mobile & Tablet backdrop overlay */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs laptop:hidden animate-in fade-in"
        />
      )}

      <aside
        className={`
          fixed laptop:static top-0 bottom-0 left-0 z-50 h-full flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out shadow-lg laptop:shadow-none
          ${isOpen ? "w-52 tablet:w-56 desktop:w-60 translate-x-0" : "-translate-x-full laptop:translate-x-0 laptop:w-14"}
        `}
      >
      <div className={`flex items-center h-16 tablet:h-20 px-3 py-2 transition-all duration-300 ease-in-out ${isOpen ? "justify-between" : "laptop:justify-center"}`}>
          <Link to="/" className={`flex items-center flex-1 min-w-0 transition-all duration-300 ease-in-out ${isOpen ? "opacity-100" : "opacity-0 w-0 h-0 overflow-hidden"}`}>
            <img
              src={zenatechLogo}
              alt="Zenatech Logo"
              className={`transition-all duration-300 ease-in-out object-contain cursor-pointer ${
                isOpen ? "h-14 sm:h-16 tablet:h-20 w-auto max-w-[185px] tablet:max-w-[215px] scale-125 origin-left hover:scale-[1.3]" : "w-0 h-0"
              }`}
            />
          </Link>

        <button
          onClick={onToggle}
          className="rounded-lg p-2 hover:bg-sidebar-accent flex-shrink-0"
        >
          <PanelRight size={16} />
        </button>
      </div>

      <TooltipProvider delayDuration={0}>
        <nav className="space-y-3 px-2 mt-2 pb-4 overflow-y-auto scrollbar-hide flex-1 min-h-0">
          {Object.entries(groupedNavigation).map(([section, items]) => (
          <div key={section} className="space-y-1">
            {isOpen ? (
              <div className="px-3 mb-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                {section}
              </div>
            ) : (
              <div className="h-4" /> // Spacing when collapsed
            )}
            
            {items.map((item) => {
              const Icon = item.icon;

          if (item.subItems) {
            const isExpanded = expandedItems[item.label];
            return (
              <div key={item.label} className="flex flex-col">
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        if (!isOpen) onToggle();
                        toggleExpand(item.label);
                        if (item.path) {
                          navigate(item.path);
                        }
                      }}
                      className={`
                        flex items-center justify-between h-8 tablet:h-8.5 overflow-hidden rounded-md text-xs transition-all duration-300 ease-in-out hover:bg-sidebar-accent text-sidebar-foreground
                        ${isOpen ? "px-3" : "px-0 justify-center"}
                      `}
                    >
                      <div className={`flex items-center ${isOpen ? "justify-start" : "justify-center"}`}>
                        <div className="flex items-center justify-center flex-shrink-0">
                          <Icon size={16} />
                        </div>
                        <span className={`text-xs font-medium transition-all duration-300 ease-in-out ${isOpen ? "opacity-100 ml-3 translate-x-0 w-auto" : "opacity-0 ml-0 -translate-x-4 w-0 overflow-hidden"}`}>
                          {item.label}
                        </span>
                      </div>
                      {isOpen && (
                        <div className="flex-shrink-0">
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </div>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={10} className={`font-semibold z-50 ${isOpen ? "hidden" : ""}`}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
                <div 
                  className={`ml-6 pl-2 border-l border-sidebar-border/60 space-y-0.5 overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen && isExpanded ? "max-h-[1000px] mt-1 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  {item.subItems.map((sub) => {
                    const fullPath = location.pathname + location.search;
                    const isSubActive = sub.path.includes("?")
                      ? fullPath === sub.path
                      : (location.pathname === sub.path && !location.search);
                    const subCount = (sub.path.startsWith("/purchasing/requests") || sub.path.startsWith("/purchasing/recurring")) ? getSubItemCount(sub.path) : undefined;
                    return (
                      <Link
                        key={sub.path}
                        to={sub.path}
                        className={`
                          flex items-center justify-between h-7.5 px-2.5 rounded-md text-xs font-medium transition-all duration-200
                          ${isSubActive ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-2xs font-semibold" : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/80"}
                        `}
                      >
                        <span className="truncate">{sub.label}</span>
                        {sub.label === "Role Assignments" && isSuperAdmin && pendingUsersCount > 0 && (
                          <div className="flex-shrink-0 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-1.5">
                            {pendingUsersCount}
                          </div>
                        )}
                        {subCount !== undefined && (
                          <div className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1.5 transition-colors ${
                            isSubActive 
                              ? "bg-white/20 text-sidebar-primary-foreground" 
                              : "bg-slate-200/80 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-300/60 dark:border-zinc-700/60"
                          }`}>
                            {subCount}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }

          const isMainActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path + "/"));
          return (
            <Tooltip key={item.path} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  to={item.path!}
                  className={
                    `
                      flex items-center h-8 tablet:h-8.5 overflow-hidden rounded-md text-xs transition-all duration-300 ease-in-out
                      ${isOpen ? "px-3 justify-start" : "px-0 justify-center"}
                      ${
                        isMainActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm font-semibold"
                          : "hover:bg-sidebar-accent text-sidebar-foreground font-medium"
                      }
                    `
                  }
                >
                  <div className="flex items-center justify-center flex-shrink-0 relative">
                    <Icon size={16} />
                    {!isOpen && item.label === "Notification Plans" && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}
                    {!isOpen && item.label === "Recurring Payments" && (purchasingSummary?.recurring_due_soon_count ?? 0) > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                    )}
                    {!isOpen && (item.label === "My Approvals" || item.navigationCode === "MY_APPROVALS") && (purchasingSummary?.my_approvals_count ?? 0) > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                      </span>
                    )}
                  </div>
                  <div className={`flex items-center justify-between min-w-0 ${isOpen ? 'flex-1' : 'w-0'}`}>
                    <span
                      className={`text-xs font-medium transition-all duration-300 ease-in-out truncate ${
                        isOpen ? "opacity-100 ml-3 translate-x-0 w-auto" : "opacity-0 ml-0 -translate-x-4 w-0 overflow-hidden"
                      }`}
                    >
                      {item.label}
                    </span>
                    {isOpen && item.label === "Notification Plans" && unreadCount > 0 && (
                      <span className="flex-shrink-0 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mr-2">
                        {unreadCount}
                      </span>
                    )}
                    {isOpen && item.label === "Recurring Payments" && (purchasingSummary?.recurring_due_soon_count ?? 0) > 0 && (
                      <span
                        className="flex-shrink-0 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full mr-2 shadow-2xs animate-in fade-in"
                        title={`${purchasingSummary?.recurring_due_soon_count} recurring payment(s) due within 7 days`}
                      >
                        {purchasingSummary?.recurring_due_soon_count}
                      </span>
                    )}
                    {isOpen && (item.label === "My Approvals" || item.navigationCode === "MY_APPROVALS") && (
                      <div className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1.5 transition-colors ${
                        isMainActive 
                          ? "bg-white/20 text-sidebar-primary-foreground" 
                          : "bg-slate-200/80 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-300/60 dark:border-zinc-700/60"
                      }`}>
                        {purchasingSummary?.my_approvals_count ?? 0}
                      </div>
                    )}
                  </div>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10} className={`font-semibold z-50 ${isOpen ? "hidden" : ""}`}>
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
        </div>
        ))}
        </nav>
      </TooltipProvider>
    </aside>
    </>
  );
}
