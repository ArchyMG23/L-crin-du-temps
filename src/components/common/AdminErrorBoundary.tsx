import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, Home, Terminal, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showStack: boolean;
}

/**
 * Robust Error Boundary dedicated to the Admin CMS.
 * Catches any render lifecycle exceptions and displays clear diagnostic details
 * instead of leaving the user with a blank white screen.
 */
export class AdminErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showStack: true
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('[ADMIN] ERROR', {
      code: error.name || 'AdminRenderError',
      message: error.message || String(error),
      componentStack: errorInfo.componentStack
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleReturnToStore = () => {
    window.location.href = '/';
  };

  private sanitizeStack(stack?: string | null): string {
    if (!stack) return 'Aucune trace disponible.';
    // Strip potential sensitive query parameters or auth tokens
    return stack.replace(/([?&](?:apiKey|auth|token|password)=)[^& \n]+/gi, '$1***');
  }

  public render() {
    if (this.state.hasError) {
      const { error, errorInfo, showStack } = this.state;
      const componentStack = errorInfo?.componentStack || '';

      // Extract the first component name from componentStack if possible
      const matchedComponent = componentStack.match(/in\s+([A-Za-z0-9_]+)/);
      const componentName = matchedComponent ? matchedComponent[1] : 'Composant Inconnu';

      return (
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex items-center justify-center p-4 sm:p-6 select-text">
          <div className="max-w-2xl w-full bg-[var(--carte-bg)] border border-rose-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Header with error badge */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 rounded-2xl shrink-0">
                <AlertOctagon className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] uppercase tracking-widest text-rose-600 dark:text-rose-400 font-bold">
                  Diagnostic Console Admin
                </span>
                <h2 className="text-lg sm:text-xl font-serif font-bold text-[var(--text)]">
                  Une erreur est survenue dans le panneau d'administration.
                </h2>
                <p className="text-xs text-[var(--text-soft)]">
                  L'exception a été interceptée par la barrière de sécurité pour éviter l'écran blanc.
                </p>
              </div>
            </div>

            {/* Error Summary Card */}
            <div className="p-4 bg-[var(--bg-2)] border border-[var(--sep)] rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-[var(--sep)] pb-2">
                <span className="text-[var(--text-muted)] font-medium">Composant concerné :</span>
                <span className="font-mono font-bold text-[var(--or)] bg-[var(--badge-bg)] px-2 py-0.5 rounded border border-[var(--badge-border)]">
                  &lt;{componentName} /&gt;
                </span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] font-medium block mb-1">Message d'erreur :</span>
                <p className="font-mono text-rose-600 dark:text-rose-400 font-semibold break-words bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                  {error?.message || 'Erreur non spécifiée'}
                </p>
              </div>
            </div>

            {/* Collapsible Stack Trace for Developer Mode */}
            <div className="border border-[var(--sep)] rounded-xl overflow-hidden bg-[var(--bg-2)]">
              <button
                type="button"
                onClick={() => this.setState({ showStack: !showStack })}
                className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-[var(--text-soft)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-[var(--or)]" />
                  <span>Détails techniques (Stack trace en développement)</span>
                </span>
                {showStack ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showStack && (
                <div className="p-4 border-t border-[var(--sep)] bg-black/40 space-y-3 font-mono text-[11px]">
                  {componentStack && (
                    <div>
                      <span className="text-white/60 block text-[10px] uppercase tracking-wider mb-1">
                        Pile des composants React :
                      </span>
                      <pre className="text-amber-400/90 whitespace-pre-wrap overflow-x-auto max-h-36 p-2 bg-black/30 rounded border border-white/10 text-[10px] leading-relaxed">
                        {componentStack.trim()}
                      </pre>
                    </div>
                  )}

                  {error?.stack && (
                    <div>
                      <span className="text-white/60 block text-[10px] uppercase tracking-wider mb-1">
                        Trace d'exécution JavaScript :
                      </span>
                      <pre className="text-rose-300 whitespace-pre-wrap overflow-x-auto max-h-48 p-2 bg-black/30 rounded border border-white/10 text-[10px] leading-relaxed">
                        {this.sanitizeStack(error.stack)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Recovery Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleRetry}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-[var(--or)] hover:opacity-90 text-black font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-opacity cursor-pointer shadow-md"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Réessayer le rendu</span>
              </button>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-[var(--bg-2)] hover:bg-[var(--badge-bg)] text-[var(--text)] border border-[var(--sep)] font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Recharger la page</span>
              </button>

              <button
                type="button"
                onClick={this.handleReturnToStore}
                className="w-full sm:w-auto sm:ml-auto px-4 py-2.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Retour à la boutique publique</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
