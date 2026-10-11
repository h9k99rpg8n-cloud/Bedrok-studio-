import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturó una excepción no controlada:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-full max-w-md bg-[#0d1322] border border-rose-500/40 rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Warning Icon */}
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-lg">
              <i className="bx bx-error text-3xl" />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-100 mb-1">
                {this.props.fallbackTitle || 'Se recuperó de un problema visual'}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Bedrock Studio ha evitado que la aplicación se quede en pantalla negra. Tus datos guardados en IndexedDB están seguros.
              </p>
            </div>

            {/* Error Message Details */}
            {this.state.error && (
              <div className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-left font-mono text-[11px] text-rose-300 overflow-x-auto max-h-28">
                <span className="font-bold text-slate-400 block mb-0.5">Detalle del error:</span>
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            {/* Action Buttons */}
            <div className="w-full flex flex-col sm:flex-row items-center gap-2 pt-1">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full min-h-[44px] px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
              >
                <i className="bx bx-refresh text-base" />
                <span>Reanudar sesión</span>
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="w-full min-h-[44px] px-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <i className="bx bx-reset text-base" />
                <span>Reiniciar aplicación</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
