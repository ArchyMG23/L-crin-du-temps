import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class RootErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ROOT_ERROR_BOUNDARY] Exception caught at root level:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetToHome = () => {
    try {
      window.history.replaceState(null, '', '/');
    } catch {}
    window.location.href = '/';
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F0] flex items-center justify-center p-6 selection:bg-[#D4AF37] selection:text-black">
          <div className="max-w-lg w-full bg-[#141414] border border-[#262626] rounded-2xl p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-red-950/40 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="font-serif text-2xl font-bold tracking-tight text-[#F5F5F0]">
                Une erreur empêche l'application de se charger.
              </h1>
              <p className="text-sm text-[#A3A3A3] font-sans">
                Un incident imprévu a interrompu l'affichage de l'Écrin du Temps.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-[#0A0A0A] border border-[#262626] rounded-xl text-left font-mono text-xs text-red-300/90 overflow-x-auto max-h-40">
                <p className="font-bold text-red-400 mb-1">{this.state.error.name}: {this.state.error.message}</p>
                {this.state.error.stack && (
                  <pre className="text-[10px] text-[#737373] whitespace-pre-wrap">{this.state.error.stack}</pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#D4AF37] text-black font-semibold text-xs uppercase tracking-wider hover:bg-[#E5C158] transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Actualiser la page</span>
              </button>

              <button
                onClick={this.handleResetToHome}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#262626] text-[#F5F5F0] font-semibold text-xs uppercase tracking-wider hover:bg-[#333333] transition-colors border border-[#404040]"
              >
                <Home className="w-4 h-4" />
                <span>Retour à l'accueil</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
