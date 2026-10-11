import React from 'react';
import { DiagnosticIssue, AddonProject } from '../types/addon';

interface DiagnosticsModalProps {
  isOpen: boolean;
  issues: DiagnosticIssue[];
  project: AddonProject;
  onClose: () => void;
  onAutoFix: (issue: DiagnosticIssue) => void;
  onProceedExport: () => void;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({
  isOpen,
  issues,
  project,
  onClose,
  onAutoFix,
  onProceedExport,
}) => {
  if (!isOpen) return null;

  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const infos = issues.filter((i) => i.severity === 'info');

  const hasBlockingErrors = errors.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0d1322] border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <i className={`bx ${hasBlockingErrors ? 'bx-error-circle text-rose-400' : 'bx-check-shield text-emerald-400'} text-xl`} />
            <div>
              <h2 className="text-sm font-bold text-slate-100">Diagnóstico del Addon</h2>
              <span className="text-[10px] text-slate-400 font-mono">
                {errors.length} errores · {warnings.length} advertencias · {infos.length} notas
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100"
          >
            <i className="bx bx-x text-xl" />
          </button>
        </div>

        {/* Status Banner */}
        <div
          className={`mt-3 p-3 rounded-2xl border text-xs flex items-center gap-2.5 ${
            hasBlockingErrors
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : warnings.length > 0
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}
        >
          <i
            className={`bx ${
              hasBlockingErrors
                ? 'bx-shield-x text-xl text-rose-400'
                : warnings.length > 0
                ? 'bx-shield text-xl text-amber-400'
                : 'bx-shield-quarter text-xl text-emerald-400'
            } shrink-0`}
          />
          <div>
            <span className="font-bold block">
              {hasBlockingErrors
                ? 'Se detectaron problemas críticos para Minecraft'
                : warnings.length > 0
                ? 'Addon listo con recomendaciones de optimización'
                : '¡Addon 100% verificado y compatible!'}
            </span>
            <p className="text-[11px] opacity-90 mt-0.5">
              {hasBlockingErrors
                ? 'Debes corregir los errores marcados en rojo antes de importar a Minecraft Bedrock.'
                : 'El Addon puede exportarse directamente a .mcaddon sin fallos estructurales.'}
            </p>
          </div>
        </div>

        {/* Issues List */}
        <div className="flex-1 flex flex-col gap-2.5 my-3">
          {issues.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <i className="bx bx-check-double text-4xl text-emerald-400 mb-1" />
              <p>No se encontraron problemas en la configuración ni en los archivos.</p>
            </div>
          ) : (
            issues.map((issue) => (
              <div
                key={issue.id}
                className={`p-3 rounded-2xl border flex flex-col gap-1.5 ${
                  issue.severity === 'error'
                    ? 'bg-rose-950/20 border-rose-500/40'
                    : issue.severity === 'warning'
                    ? 'bg-amber-950/20 border-amber-500/30'
                    : 'bg-blue-950/20 border-blue-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold flex items-center gap-1.5 ${
                      issue.severity === 'error'
                        ? 'text-rose-400'
                        : issue.severity === 'warning'
                        ? 'text-amber-400'
                        : 'text-blue-400'
                    }`}
                  >
                    <i
                      className={`bx ${
                        issue.severity === 'error'
                          ? 'bxs-error'
                          : issue.severity === 'warning'
                          ? 'bxs-error-circle'
                          : 'bxs-info-circle'
                      } text-sm`}
                    />
                    {issue.title}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                    {issue.affectedTarget}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{issue.description}</p>

                <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80 mt-0.5">
                  <div>
                    <strong className="text-slate-300">Causa:</strong> {issue.reason}
                  </div>
                  <div className="mt-1 text-emerald-300">
                    <strong>Sugerencia:</strong> {issue.suggestion}
                  </div>
                </div>

                {issue.canAutoFix && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => onAutoFix(issue)}
                      className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold rounded-lg flex items-center gap-1 active:scale-95 transition-all"
                    >
                      <i className="bx bx-wrench text-xs" />
                      <span>Corregir automáticamente</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[46px] px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold"
          >
            Cerrar Diagnóstico
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onProceedExport();
            }}
            disabled={hasBlockingErrors}
            className="min-h-[46px] px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            <i className="bx bxs-download text-base" />
            <span>Continuar a Exportar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
