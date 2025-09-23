import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

function App() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '1rem' }}>
      <h1>React + TypeScript</h1>
      <p>Dev server is running (esbuild).</p>
    </main>
  );
}

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText('React + TypeScript')).toBeInTheDocument();
  });

  it('displays the dev server message', () => {
    render(<App />);
    expect(screen.getByText('Dev server is running (esbuild).')).toBeInTheDocument();
  });
});