import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Database,
  UploadCloud,
  BarChart3,
  Sliders,
  Sparkles,
  FileCheck,
} from 'lucide-react';
import { Dataset } from '../types';

interface NavbarProps {
  currentDataset?: Dataset | null;
  onNewUpload?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentDataset, onNewUpload }) => {
  const navigate = useNavigate();

  const handleNewUploadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNewUpload) {
      onNewUpload();
    }
    navigate('/upload');
  };

  const navItems = [
    { to: '/upload', label: 'Upload', icon: UploadCloud },
    { to: '/profile', label: 'Profile & Quality', icon: BarChart3 },
    { to: '/rules', label: 'Custom Rules', icon: Sliders },
    { to: '/clean', label: 'Clean Workbench', icon: Sparkles },
    { to: '/report', label: 'Reports', icon: FileCheck },

  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">

      {/* Main Fluid Navbar Relative to Screen Width */}
      <div className="w-full px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left Brand Identity */}
          <NavLink to="/upload" className="flex items-center space-x-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs group-hover:bg-indigo-600 transition-colors">
              <Database className="w-5 h-5" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-heading font-extrabold tracking-tight text-slate-900">
                DataClean<span className="text-indigo-600 font-extrabold">AI</span>
              </span>
            </div>
          </NavLink>

          {/* Center Relative Responsive Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 text-indigo-600" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right Section: Active Dataset & Action CTA */}
          <div className="flex items-center space-x-3 shrink-0">
            {currentDataset ? (
              <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs shadow-2xs">
                <Database className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="font-semibold text-slate-800 max-w-[140px] lg:max-w-[200px] truncate" title={currentDataset.filename}>
                  {currentDataset.filename}
                </span>
                <span className="text-slate-300">•</span>
                <span className="font-mono text-[11px] text-slate-500">
                  {currentDataset.row_count?.toLocaleString()} rows
                </span>
              </div>
            ) : null}

            <button
              onClick={handleNewUploadClick}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>New Upload</span>
            </button>
          </div>
        </div>

        {/* Medium/Mobile Responsive Navigation Ribbon */}
        <div className="lg:hidden flex items-center justify-start overflow-x-auto py-2 border-t border-slate-100 gap-1.5 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5 text-indigo-600" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
