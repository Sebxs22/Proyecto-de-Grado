import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.tsx' // ✅ AGREGADO

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider> {/* ✅ AGREGADO */}
      <App />
    </AuthProvider> {/* ✅ AGREGADO */}
  </React.StrictMode>,
)