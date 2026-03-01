import React from 'react'

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div style={{ minHeight: '100vh', padding: 24, fontFamily: 'system-ui', color: '#1C1917', background: '#FAF9F6' }}>
          <h1 style={{ fontSize: 24, marginBottom: 12, color: '#722F37' }}>Une erreur s'est produite</h1>
          <pre style={{ background: '#f5f5f5', padding: 16, overflow: 'auto', fontSize: 12, borderRadius: 8 }}>
            {this.state.error.message}
          </pre>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: undefined })}
            style={{ marginTop: 16, padding: '12px 24px', background: '#722F37', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            Réessayer
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
