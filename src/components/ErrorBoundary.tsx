import * as React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = 'Ocurrió un error inesperado en la aplicación.';
      
      try {
        const errorMsg = this.state.error?.message || '';
        if (errorMsg.startsWith('{')) {
          const firestoreError = JSON.parse(errorMsg);
          if (firestoreError.error && firestoreError.operationType) {
            errorMessage = `Error de Base de Datos: No tienes permisos suficientes para realizar esta operación (${firestoreError.operationType} en ${firestoreError.path}).`;
          }
        }
      } catch (e) {
        if (this.state.error?.message) {
          errorMessage = this.state.error.message;
        }
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4 text-center">
          <div className="bg-[#0a0a0a] border border-red-500/30 p-8 rounded-2xl max-w-md w-full shadow-2xl">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-4">¡Ups! Algo salió mal</h2>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              {errorMessage}
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full py-3 bg-dragon-red hover:bg-dragon-red-dark text-white rounded-xl font-bold transition-all"
            >
              VOLVER AL INICIO
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

