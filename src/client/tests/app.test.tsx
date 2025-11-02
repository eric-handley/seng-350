import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

/**
 * Minimal App component for smoke testing.
 * The tests verify that:
 * - The main heading renders
 * - The dev server status text is present
 *
 * Strategy: simple render + presence assertions using Testing Library.
 * No routing or interaction is exercised here.
 */
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
    // Act: render the component
    render(<App />);

    // Assert: the main heading is present
    expect(screen.getByText('React + TypeScript')).toBeInTheDocument();
  });

  it('displays the dev server message', () => {
    // Act: render the component
    render(<App />);

    // Assert: the dev server status line is present
    expect(screen.getByText('Dev server is running (esbuild).')).toBeInTheDocument();
  });

  it('exposes main landmark and level-1 heading with correct accessible name', () => {
    render(<App />);

    // Accessible "main" region exists
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();

    // Heading is an h1 with expected accessible name (case-insensitive)
    const h1 = screen.getByRole('heading', { level: 1, name: /react \+ typescript/i });
    expect(h1).toBeInTheDocument();
  });

  it('has a simple document structure: main contains exactly one h1 and one paragraph', () => {
    render(<App />);

    const main = screen.getByRole('main');
    // Exactly two direct children
    expect(main.querySelectorAll(':scope > *')).toHaveLength(2);
    // Contains expected tags
    expect(main.querySelector(':scope > h1')).not.toBeNull();
    expect(main.querySelector(':scope > p')).not.toBeNull();
  });

  it('renders without logging errors to the console', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => { });

    render(<App />);

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});