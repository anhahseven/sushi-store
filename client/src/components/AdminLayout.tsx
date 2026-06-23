import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutGrid,
  Utensils,
  Package,
  Tags,
  MapPin,
  Users,
  ShoppingCart,
  FileSpreadsheet,
  Boxes,
  ClipboardList,
  CheckSquare,
  History,
  LogOut,
  Globe,
  Bell,
  Sun,
  Moon,
  Search,
  Menu as MenuIcon,
  X,
  Compass,
  ArrowRight,
  TrendingUp,
  User as UserIcon,
  Sparkles
} from "lucide-react";

interface SidebarLink {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

import { HeaderProvider, useHeader } from "../context/HeaderContext";

export default function AdminLayout() {
  return (
    <HeaderProvider>
      <AdminLayoutContent />
    </HeaderProvider>
  );
}

function AdminLayoutContent() {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [theme, setTheme] = useState<string>("light");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { headerContent } = useHeader();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }, []);

  const toggleTheme = () => {
    // Theme is forced to light globally
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const sidebarLinks: SidebarLink[] = [
    { path: "/admin/dashboard", label: "Dashboard", icon: LayoutGrid, roles: ["manager", "admin", "store_manager"] },
    { path: "/staff/menu", label: "Menu Staff", icon: Utensils, roles: ["manager", "admin", "store_manager", "staff"] },
    { path: "/admin/orders", label: "Orders", icon: ShoppingCart, roles: ["manager", "admin", "store_manager", "cashier"] },
    { path: "/admin/inventory", label: "Inventory", icon: Package, roles: ["manager", "admin"] },
    { path: "/admin/category", label: "Category", icon: Tags, roles: ["manager", "admin"] },
    { path: "/admin/stock", label: "Stock Requests", icon: Boxes, roles: ["admin", "manager", "store_manager"] },
    { path: "/admin/stock/menu", label: "Stock Menu", icon: ClipboardList, roles: ["admin", "manager"] },
    { path: "/manager/daily-stock", label: "Daily Stock", icon: CheckSquare, roles: ["store_manager", "admin", "manager"] },
    { path: "/manager/daily-stock/history", label: "Stock History", icon: History, roles: ["admin", "manager"] },
    { path: "/admin/locations", label: "Locations", icon: MapPin, roles: ["admin"] },
    { path: "/admin/users", label: "Users", icon: Users, roles: ["admin"] },
    { path: "/admin/reports", label: "Reports", icon: FileSpreadsheet, roles: ["admin", "manager", "store_manager"] },
  ];

  // Group links dynamically for the Efferd-style sidebar section layout
  const navigationGroups = [
    {
      label: "",
      links: sidebarLinks.filter(l => ["Dashboard"].includes(l.label))
    },
    {
      label: "Operations & POS",
      links: sidebarLinks.filter(l => ["Menu Staff", "Orders"].includes(l.label))
    },
    {
      label: "Inventory & Logistics",
      links: sidebarLinks.filter(l => ["Inventory", "Category", "Stock Requests", "Stock Menu", "Daily Stock", "Stock History"].includes(l.label))
    },
    {
      label: "Administration",
      links: sidebarLinks.filter(l => ["Locations", "Users", "Reports"].includes(l.label))
    }
  ];

  // Filter links within groups based on roles and search queries
  const getFilteredGroups = () => {
    return navigationGroups.map(group => {
      const filtered = group.links.filter(link => {
        if (link.roles && !hasRole(link.roles)) return false;
        return link.label.toLowerCase().includes(searchQuery.toLowerCase());
      });
      return { ...group, links: filtered };
    }).filter(group => group.links.length > 0);
  };

  const getPageTitle = () => {
    const activeLink = sidebarLinks.find((link) => location.pathname.startsWith(link.path));
    return activeLink ? activeLink.label : "Admin Panel";
  };

  const filteredGroups = getFilteredGroups();

  return (
    <div className="flex h-screen overflow-hidden bg-[#f9fafb] dark:bg-gray-950 text-gray-800 dark:text-gray-100 relative font-sans transition-colors duration-300">
      
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300"
        />
      )}

      {/* Sidebar: Clean, off-white background, subtle borders, premium typography */}
      <aside
        id="sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#09090b] border-r border-gray-100 dark:border-zinc-800 text-gray-500 dark:text-zinc-400 flex flex-col flex-shrink-0 transform transition-transform duration-300 lg:static lg:translate-x-0 shadow-xl lg:shadow-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 px-6 flex items-center justify-between border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-orange-500 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white tracking-tight">Murakami</span>
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2"></span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Action / Website Home & Search */}
        <div className="px-4 py-3 flex flex-col gap-2 border-b border-gray-100 dark:border-zinc-800">
          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-gray-900 font-semibold text-sm rounded-lg shadow-sm transition-all group"
          >
            <Globe className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
            <span>Website Home</span>
          </Link>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search layout..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 dark:bg-zinc-900/60 text-xs text-gray-900 dark:text-white rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500 border border-gray-200 dark:border-zinc-800"
            />
          </div>
        </div>

        {/* Sidebar Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-zinc-800">
          {filteredGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {group.label && (
                <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-1.5">
                  {group.label}
                </h3>
              )}
              <div className="space-y-0.5">
                {group.links.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname.startsWith(link.path);
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all ${
                        isActive
                          ? "bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 font-semibold shadow-sm"
                          : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40 hover:text-zinc-900 dark:hover:text-white"
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? "text-orange-500" : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900"}`} />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Dynamic Location Promo Card */}
        {user && (
          <div className="mx-4 my-2 p-3.5 rounded-xl bg-orange-50/40 dark:bg-orange-950/10 border border-orange-100/50 dark:border-orange-950/20 text-xs shrink-0">
            <div className="flex items-center gap-1.5 font-bold text-orange-600 dark:text-orange-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              POS Session Active
            </div>
            <p className="text-gray-500 dark:text-zinc-500 mt-1 truncate">{user.email}</p>
            <p className="text-[9px] uppercase tracking-wider text-gray-400 mt-1.5">Role: {user.role}</p>
          </div>
        )}

        {/* Sidebar Footer Logout */}
        <div className="p-3 border-t border-gray-100 dark:border-zinc-800 shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/15 rounded-lg text-sm font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Logout Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden w-full bg-[#f9fafb] dark:bg-gray-950 p-3 lg:p-4 transition-colors">
        
        {/* The 3D Box wrapping both Header and Content Outlet */}
        <div 
          className="flex-1 flex flex-col overflow-hidden rounded-[20px] bg-white dark:bg-[#09090b] border border-gray-200/80 dark:border-zinc-800/80 transition-all duration-300"
          style={{
            boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.05), 0 10px 20px -20px rgba(0, 0, 0, 0.03)"
          }}
        >
          {/* Header: Clean layout, breadcrumbs, search, notification controls */}
          <header className="h-14 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between gap-4 px-6 shrink-0 transition-colors duration-300">
            
            {/* Breadcrumb controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <MenuIcon className="w-5 h-5" />
              </button>
              
              <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-gray-400 dark:text-zinc-500">
                <Compass className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline">Overview</span>
                <span className="hidden md:inline">/</span>
                <span className="text-gray-900 dark:text-white font-bold truncate max-w-[120px] sm:max-w-none">{getPageTitle()}</span>
              </div>
            </div>

            {/* Right side (contains filters and action tools) */}
            <div className="flex-1 flex items-center justify-end gap-2 sm:gap-4 max-w-full overflow-hidden">
              {headerContent && (
                <div className="flex-1 flex items-center justify-start sm:justify-end border-r border-gray-100 dark:border-zinc-800/80 pr-2 sm:pr-4 overflow-hidden">
                  <div className="w-full flex justify-start sm:justify-end overflow-x-auto no-scrollbar max-w-[calc(100vw-150px)] sm:max-w-[calc(100vw-300px)] md:max-w-[calc(100vw-420px)] lg:max-w-none">
                    {headerContent}
                  </div>
                </div>
              )}
              
              {/* Action Tools */}
              <div className="flex items-center gap-2">
                
                {/* Notifications mock */}
                <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors">
                  <Bell className="w-4 h-4" />
                </button>
                
                {/* Theme Toggle removed - Forced light theme */}

                {/* User Avatar */}
                <div className="h-6 w-px bg-gray-200 dark:bg-zinc-800 mx-1"></div>
                
                <div className="flex items-center gap-2 pl-1 group cursor-pointer">
                  <div className="w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xs shadow-sm ring-1 ring-orange-500/10">
                    {user?.email?.charAt(0).toUpperCase() || <UserIcon className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Content Wrapper */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
