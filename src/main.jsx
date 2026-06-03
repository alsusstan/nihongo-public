import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { getStoredString } from './utils/localSettings.js'

// apply saved theme immediately to prevent flash
const savedTheme = getStoredString('nihongo-theme', 'light')
document.documentElement.setAttribute('data-theme', savedTheme)
const Router = import.meta.env.BASE_URL === '/' ? BrowserRouter : HashRouter

if (Router === BrowserRouter && window.location.hash.startsWith('#/')) {
  const nextPath = window.location.hash.slice(1)
  window.history.replaceState(null, '', nextPath)
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24, background: 'linear-gradient(135deg, #fdf2f8, #ede9fe)', fontFamily: 'Nunito, sans-serif' }}>
          <div style={{ textAlign: 'center', maxWidth: 380, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', borderRadius: 24, padding: '40px 32px', boxShadow: '0 8px 32px rgba(192,132,252,0.15)' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>🐱💦</div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#8b5cf6', marginBottom: 8 }}>
              あれ… 何かがおかしいです
            </h1>
            <p style={{ fontSize: '0.95rem', color: '#6b7280', marginBottom: 24, lineHeight: 1.5 }}>
              Something went wrong. Try reloading — your progress should stay safe in browser storage.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: '12px 32px', borderRadius: 50, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #f472b6, #c084fc)', color: '#fff', fontSize: '1rem', fontWeight: 800, fontFamily: 'inherit', minHeight: 44 }}
            >
              reload 🔄
            </button>
            <details style={{ marginTop: 20, textAlign: 'left' }}>
              <summary style={{ fontSize: '0.75rem', color: '#9ca3af', cursor: 'pointer' }}>error details</summary>
              <pre style={{ fontSize: '0.7rem', color: '#6b7280', whiteSpace: 'pre-wrap', wordBreak: 'break-all', marginTop: 8, maxHeight: 160, overflow: 'auto' }}>
                {this.state.error?.toString()}
              </pre>
            </details>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <Router>
        <App />
      </Router>
    </ErrorBoundary>
  </StrictMode>,
)
