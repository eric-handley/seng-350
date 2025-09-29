import React from 'react'
import { createRoot } from 'react-dom/client'
import LoginPage from 'src/pages/LoginPage'

function App() {
  return (
    <React.StrictMode>
      <LoginPage />
    </React.StrictMode>
  );
}

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')
createRoot(root).render(<App />)
