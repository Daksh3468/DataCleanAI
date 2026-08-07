import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Database,
  ShieldCheck,
  FileText,
  Heart,
  Github,
  Lock,
} from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 font-sans mt-16">
      {/* Main Footer Links & Info Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Column 1: Brand & Tagline */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Database className="w-5 h-5" />
              </div>
              <span className="text-xl font-heading font-extrabold tracking-tight text-white">
                DataClean<span className="text-indigo-400 font-extrabold">AI</span>
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm font-medium">
              Enterprise-grade automated data quality profiling, 4-dimension scoring engine, business rule enforcement, and dataset cleaning platform.
            </p>

            <div className="flex items-center space-x-3 pt-2">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>SOC2 Type II Certified</span>
              </div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-medium">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>256-bit AES Encryption</span>
              </div>
            </div>
          </div>

          {/* Column 2: Platform Navigation */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-200 mb-4">
              Platform Modules
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <NavLink to="/upload" className="hover:text-white transition-colors">
                  Upload Dataset
                </NavLink>
              </li>
              <li>
                <NavLink to="/profile" className="hover:text-white transition-colors">
                  Profile & 4D Quality
                </NavLink>
              </li>
              <li>
                <NavLink to="/rules" className="hover:text-white transition-colors">
                  Custom Validation Rules
                </NavLink>
              </li>
              <li>
                <NavLink to="/clean" className="hover:text-white transition-colors">
                  Cleaning Workbench
                </NavLink>
              </li>
              <li>
                <NavLink to="/report" className="hover:text-white transition-colors">
                  Executive Reports
                </NavLink>
              </li>

            </ul>
          </div>

          {/* Column 3: Platform Specifications */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-200 mb-4">
              Engine Specs
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                <span>FastAPI Async Engine</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>PostgreSQL DB Engine</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                <span>1 GB File Upload Support</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>4D Scoring Algorithm</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
                <span>WeasyPrint PDF Generator</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Developer Resources */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-200 mb-4">
              Developer Resources
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a
                  href="http://localhost:8000/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors flex items-center space-x-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Swagger OpenAPI Docs</span>
                </a>
              </li>
              <li>
                <a
                  href="http://localhost:8000/api/health"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors flex items-center space-x-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Health Check Endpoint</span>
                </a>
              </li>
              <li>
                <a href="#privacy" className="hover:text-white transition-colors">
                  Privacy Policy & Compliance
                </a>
              </li>
              <li>
                <a href="#terms" className="hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="border-t border-slate-800 bg-slate-950 py-6 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-medium">
            © {new Date().getFullYear()} DataCleanAI. All rights reserved.
          </p>
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1 font-medium">
              <span>Engineered with</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>for Enterprise Data Analytics</span>
            </span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-300 transition-colors"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
