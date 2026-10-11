import React from 'react';
import { AddonProject } from '../types/bedrock';
import { Download, Settings, Compass, Box } from 'lucide-react';

interface NavbarProps {
  project: AddonProject;
  activeTab: 'texture' | 'properties' | 'preview3d' | 'code';
  onTabChange: (tab: 'texture' | 'properties' | 'preview3d' | 'code') => void;
  onOpenSettings: () => void;
  onOpenExport: () => void;
  onOpenRoadmap: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  project,
  activeTab,
  onTabChange,
  onOpenSettings,
  onOpenExport,
  onOpenRoadmap,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="/"
            onClick={(e) => e.preventDefault()}
            className="text-base sm:text-lg font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <span className="w-6 h-6 rounded-md bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xs shadow-sm">
              ⛏
            </span>
            <span>Bedrock Studio</span>
          </a>
          <span className="hidden sm:inline-block text-xs text-slate-400 font-mono">
            {project.namespace} · v{project.version.join('.')}
          </span>
        </div>

        {/* Zone 2: 4-5 single-line clean navigation links (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onTabChange('texture')}
            className={`min-h-[44px] px-3.5 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-colors ${
              activeTab === 'texture'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Editor 16x16
          </button>
          <button
            type="button"
            onClick={() => onTabChange('properties')}
            className={`min-h-[44px] px-3.5 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-colors ${
              activeTab === 'properties'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Propiedades
          </button>
          <button
            type="button"
            onClick={() => onTabChange('preview3d')}
            className={`min-h-[44px] px-3.5 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-colors ${
              activeTab === 'preview3d'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Vista 3D
          </button>
          <button
            type="button"
            onClick={() => onTabChange('code')}
            className={`min-h-[44px] px-3.5 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-colors ${
              activeTab === 'code'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Código JSON
          </button>
          <button
            type="button"
            onClick={onOpenRoadmap}
            className="min-h-[44px] px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 flex items-center gap-1 whitespace-nowrap"
            title="Ver Módulos Mobs y Scripts"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Módulos IDE</span>
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenSettings}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            title="Configuración del Add-on"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenExport}
            className="min-h-[44px] px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all whitespace-nowrap shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Exportar .mcaddon</span>
          </button>
        </div>
      </div>
    </header>
  );
};
