import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginForm from '../src/pages/LoginPage';
import { BrowserRouter } from 'react-router-dom';

global.fetch = jest.fn();

test('renders login form and logs in admin', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
            id: '1',
            email: 'admin@uvic.ca',
            first_name: 'Admin',
            last_name: 'User',
            role: 'Admin',
        }),
    });

    render(<BrowserRouter><LoginForm onLogin={jest.fn()} /></BrowserRouter>);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'admin@uvic.ca' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
            'http://localhost:3000/api/auth/login',
            expect.objectContaining({ method: 'POST' }),
        );
    });
});
