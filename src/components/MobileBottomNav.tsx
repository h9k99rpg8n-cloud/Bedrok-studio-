import React from 'react';
import { Paintbrush, Sliders, Box, FileCode, Download } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: 'texture' | 'properties' | 'preview3d' | 'code';
  onTabChange: (tab: 'texture' | 'properties' | 'preview3d' | 'code') => void;
  onOpenExport: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenExport,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 md:hidden pb-safe">
      <div className="grid grid-cols-5 items-center h-16 px-1">
        <button
          type="button"
          onClick={() => onTabChange('texture')}
          className={`min-h-[48px] flex flex-col items-center justify-center transition-colors ${
            activeTab === 'texture' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Paintbrush className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">Textura</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('properties')}
          className={`min-h-[48px] flex flex-col items-center justify-center transition-colors ${
            activeTab === 'properties' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">Física</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('preview3d')}
          className={`min-h-[48px] flex flex-col items-center justify-center transition-colors ${
            activeTab === 'preview3d' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Box className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">Visor 3D</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('code')}
          className={`min-h-[48px] flex flex-col items-center justify-center transition-colors ${
            activeTab === 'code' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">JSON</span>
        </button>

        <button
          type="button"
          onClick={onOpenExport}
          className="min-h-[48px] flex flex-col items-center justify-center text-amber-400 hover:text-amber-300 transition-colors"
        >
          <Download className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">Exportar</span>
        </button>
      </div>
    </div>
  );
};
