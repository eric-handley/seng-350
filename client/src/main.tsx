import React from 'react'
import { createRoot } from 'react-dom/client'

function App() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '1rem' }}>
      <h1>React + TypeScript</h1>
      <p>Dev server is running (esbuild).</p>
    </main>
  )
}

const root = document.getElementById('root')!
createRoot(root).render(<App />)

