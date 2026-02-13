import React from 'react';
import { Link } from 'react-router-dom';
import { TreePine, ArrowLeft } from 'lucide-react';

interface CrewLayoutProps {
  children: React.ReactNode;
}

export function CrewLayout({ children }: CrewLayoutProps) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-green-600 text-white">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <TreePine className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <span className="text-sm font-bold block">AATOS</span>
              <span className="text-[10px] text-white/70">Crew View</span>
            </div>
          </div>
          <span className="text-sm text-white/80 hidden sm:block">{today}</span>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm text-white/90 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to CRM</span>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="p-4">{children}</main>
    </div>
  );
}
