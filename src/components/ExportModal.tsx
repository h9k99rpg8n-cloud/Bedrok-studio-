import React, { useState } from 'react';
import { AddonProject } from '../types/bedrock';
import { exportAddonArchive } from '../utils/bedrockExport';
import confetti from 'canvas-confetti';
import {
  Download,
  CheckCircle2,
  X,
  Smartphone,
  Apple,
  Monitor,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ExportModalProps {
  project: AddonProject;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ project, isOpen, onClose }) => {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [downloadInfo, setDownloadInfo] = useState<{ fileName: string; size: number } | null>(null);
  const [guidePlatform, setGuidePlatform] = useState<'android' | 'ios' | 'pc'>('android');

  if (!isOpen) return null;

  const handleExport = async (format: 'mcaddon' | 'zip' = 'mcaddon') => {
    try {
      setIsExporting(true);
      const res = await exportAddonArchive(project, format);
      setDownloadInfo(res);
      setDownloadSuccess(true);

      // Trigger celebration confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10B981', '#06B6D4', '#F59E0B', '#EF4444'],
      });
    } catch (err) {
      console.error('Error al exportar addon:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-slate-100">Exportar Add-on a Minecraft Bedrock</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pack Summary */}
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-slate-200">{project.name}</div>
            <div className="text-xs text-slate-400">
              Namespace: <span className="font-mono text-emerald-400">{project.namespace}</span> · {project.blocks.length} {project.blocks.length === 1 ? 'bloque' : 'bloques'}
            </div>
          </div>
          <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-lg">
            v{project.version.join('.')}
          </span>
        </div>

        {/* Download Action Buttons */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => handleExport('mcaddon')}
            disabled={isExporting}
            className="w-full min-h-[52px] bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Empaquetando Add-on...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Descargar archivo .mcaddon (Directo a Minecraft)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleExport('zip')}
            disabled={isExporting}
            className="w-full min-h-[44px] bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <Layers className="w-4 h-4 text-slate-400" />
            <span>Descargar como .ZIP (Manual / Desarrollo)</span>
          </button>
        </div>

        {/* Success message */}
        {downloadSuccess && downloadInfo && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold">¡Archivo {downloadInfo.fileName} generado con éxito!</span>
              <p className="text-[11px] text-emerald-400/80">
                Tamaño: {(downloadInfo.size / 1024).toFixed(1)} KB con Resource Pack y Behavior Pack completos.
              </p>
            </div>
          </div>
        )}

        {/* Step-by-Step Guide for Mobile */}
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Guía de Instalación en el Móvil
            </span>
          </div>

          {/* Platform Selector */}
          <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setGuidePlatform('android')}
              className={`min-h-[38px] flex items-center justify-center gap-1 text-xs rounded-lg transition-colors ${
                guidePlatform === 'android'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Android
            </button>
            <button
              type="button"
              onClick={() => setGuidePlatform('ios')}
              className={`min-h-[38px] flex items-center justify-center gap-1 text-xs rounded-lg transition-colors ${
                guidePlatform === 'ios'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Apple className="w-3.5 h-3.5" />
              iOS / iPad
            </button>
            <button
              type="button"
              onClick={() => setGuidePlatform('pc')}
              className={`min-h-[38px] flex items-center justify-center gap-1 text-xs rounded-lg transition-colors ${
                guidePlatform === 'pc'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              PC Windows
            </button>
          </div>

          {/* Guide Steps */}
          {guidePlatform === 'android' && (
            <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside pl-1">
              <li>
                Presiona <strong>"Descargar archivo .mcaddon"</strong> en tu móvil.
              </li>
              <li>
                Abre la notificación de descarga o tu gestor de archivos (como Archivos o ZArchiver).
              </li>
              <li>
                Toca el archivo <code className="text-emerald-400 font-mono">.mcaddon</code> y selecciona <strong>"Abrir con Minecraft"</strong>.
              </li>
              <li>
                Minecraft Bedrock se abrirá automáticamente e importará el paquete de recursos y comportamientos.
              </li>
              <li>
                En tu mundo: ve a <strong>Ajustes del Mundo &gt; Paquetes de recursos &gt; Activar</strong>, y activa los <strong>Experimentos</strong> de Creador.
              </li>
            </ol>
          )}

          {guidePlatform === 'ios' && (
            <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside pl-1">
              <li>
                Descarga el archivo <code className="text-emerald-400 font-mono">.mcaddon</code> desde Safari o Chrome en tu iPhone o iPad.
              </li>
              <li>
                Abre la app nativa <strong>Archivos (Files)</strong> y ve a la carpeta "Descargas".
              </li>
              <li>
                Toca el archivo descargado. Se abrirá automáticamente Minecraft con el aviso <em>"Importación iniciada"</em>.
              </li>
              <li>
                Activa el Add-on en la configuración de tu mundo y disfruta tus bloques personalizados.
              </li>
            </ol>
          )}

          {guidePlatform === 'pc' && (
            <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside pl-1">
              <li>
                Descarga el archivo <code className="text-emerald-400 font-mono">.mcaddon</code> en tu ordenador.
              </li>
              <li>
                Haz doble clic sobre el archivo descargado.
              </li>
              <li>
                Minecraft Bedrock (Windows) se ejecutará e instalará el Add-on de forma instantánea.
              </li>
            </ol>
          )}
        </div>
      </div>
    </div>
  );
};
