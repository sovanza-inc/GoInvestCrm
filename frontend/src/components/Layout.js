import { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, MessageSquare, BarChart3, FileText, Settings, LogOut, Menu, X, Zap, CreditCard } from "lucide-react";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/leads", icon: Users, label: "Leads" },
  { to: "/crm", icon: MessageSquare, label: "CRM Inbox" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/templates", icon: FileText, label: "Templates" },
  { to: "/pricing", icon: CreditCard, label: "Billing" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
          GoSocial
        </span>
      </div>

      <nav className="flex-1 px-3 space-y-1 mt-4" data-testid="sidebar-nav">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || (item.to !== "/dashboard" && location.pathname.startsWith(item.to));
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
              className={`sidebar-link flex items-center gap-3 px-4 py-2.5 text-sm font-medium ${
                isActive ? "active text-blue-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800/50">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <Button
            variant="ghost" size="icon"
            onClick={logout}
            data-testid="logout-btn"
            className="text-slate-500 hover:text-red-400 h-8 w-8"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-col bg-[#020617] border-r border-slate-800/50 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-60 bg-[#020617] border-r border-slate-800/50 z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-60">
        {/* Top bar */}
        <header className="sticky top-0 z-20 glass-surface h-14 flex items-center px-4 lg:px-6 gap-4">
          <Button
            variant="ghost" size="icon"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-400"
            data-testid="mobile-menu-btn"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex-1" />
          <div className="text-xs text-slate-500 font-medium uppercase tracking-widest">
            {navItems.find(i => i.to === location.pathname || (i.to !== "/" && location.pathname.startsWith(i.to)))?.label || "Dashboard"}
          </div>
        </header>

        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
