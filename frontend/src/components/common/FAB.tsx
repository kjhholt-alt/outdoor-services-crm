import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface FABAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}

interface FABProps {
  actions: FABAction[];
}

export function FAB({ actions }: FABProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (actions.length === 0) return null;

  // If only one action, show it directly
  if (actions.length === 1) {
    return (
      <button
        onClick={actions[0].onClick}
        className="fab"
        title={actions[0].label}
      >
        {actions[0].icon}
      </button>
    );
  }

  // Multiple actions - show expandable menu
  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Action buttons */}
      <div
        className={`absolute bottom-16 right-0 flex flex-col-reverse gap-3 transition-all duration-200 ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => {
              action.onClick();
              setIsOpen(false);
            }}
            className="flex items-center gap-3 group"
          >
            <span className="px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {action.label}
            </span>
            <div
              className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white transition-transform hover:scale-110"
              style={{ backgroundColor: action.color || '#3b82f6' }}
            >
              {action.icon}
            </div>
          </button>
        ))}
      </div>

      {/* Main FAB button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fab transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </button>
    </div>
  );
}
