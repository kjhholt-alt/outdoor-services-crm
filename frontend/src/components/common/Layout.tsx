import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Leaf,
  FileText,
  Receipt,
  Bell,
  MapPin,
  Upload,
  BarChart3,
  Menu,
  X,
  Moon,
  Sun,
  TreePine,
  Info,
} from 'lucide-react';
import { isDemoMode } from '../../data/demo';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/jobs', icon: Briefcase, label: 'Jobs' },
  { path: '/customers', icon: Users, label: 'Customers' },
  { path: '/services', icon: Leaf, label: 'Services' },
  { path: '/estimates', icon: FileText, label: 'Estimates' },
  { path: '/invoices', icon: Receipt, label: 'Invoices' },
  { path: '/routes', icon: MapPin, label: 'Routes' },
  { path: '/reminders', icon: Bell, label: 'Reminders' },
  { path: '/reports', icon: BarChart3, label: 'Reports' },
  { path: '/import', icon: Upload, label: 'Import/Export' },
];

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });
  const location = useLocation();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-stone-800 border-r border-stone-200 dark:border-stone-700 transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo/Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-stone-200 dark:border-stone-700">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <TreePine className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <span className="text-sm font-bold text-gray-900 dark:text-white block">
                AATOS
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                CRM
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg min-h-[48px] min-w-[48px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-0.5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 130px)' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-stone-200 dark:border-stone-700">
          <button
            onClick={toggleDarkMode}
            className="w-full btn-ghost flex items-center justify-center gap-2"
          >
            {darkMode ? (
              <>
                <Sun className="w-4 h-4" />
                <span className="text-sm">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4" />
                <span className="text-sm">Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 h-16 bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 lg:hidden">
          <div className="flex items-center justify-between h-full px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg min-h-[48px] min-w-[48px] flex items-center justify-center"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <TreePine className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                AATOS CRM
              </span>
            </Link>
            <div className="w-10" />
          </div>
        </header>

        {/* Demo mode banner */}
        {isDemoMode && (
          <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm">
              <Info className="w-4 h-4 shrink-0" />
              <span>Preview mode - showing sample data. Connect a backend to manage real customers and jobs.</span>
            </div>
          </div>
        )}

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
