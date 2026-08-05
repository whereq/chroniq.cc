import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}
interface State {
  hasError: boolean
  error?: Error
}

/**
 * App-wide error boundary. A render error anywhere below this point shows a
 * recoverable fallback instead of a blank white page. The fallback is
 * intentionally self-contained (no i18n / theme / router dependencies) so it
 * still renders even when one of those is the thing that crashed.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surfaced in the browser console for debugging; wire to a reporter later.
    console.error('Unhandled render error:', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0B0B0E',
          color: '#F2F2F5',
          fontFamily: 'system-ui, sans-serif',
          padding: 24,
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>Something went wrong</h1>
          <p style={{ color: '#C6C6CC', margin: '0 0 20px', lineHeight: 1.5 }}>
            The page hit an unexpected error. Reloading usually fixes it.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: 'none',
              background: '#0091FF',
              color: '#fff',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Reload page
          </button>
          <p style={{ marginTop: 16 }}>
            <a href="/" style={{ color: '#0091FF', textDecoration: 'none', fontSize: 13 }}>← Go home</a>
          </p>
        </div>
      </div>
    )
  }
}
