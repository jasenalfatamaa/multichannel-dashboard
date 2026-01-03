import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Login from '../components/Login';
import React from 'react';

describe('Login Component', () => {
    it('renders login form correctly', () => {
        const mockOnLogin = vi.fn();
        render(<Login onLogin={mockOnLogin} />);

        // Use getByRole for heading to avoid multiple matches with logos/tags
        expect(screen.getByRole('heading', { name: /OmniAI/i })).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/name@company.com/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Access Dashboard/i })).toBeInTheDocument();
    });

    it('shows error message with invalid credentials', async () => {
        const mockOnLogin = vi.fn();
        render(<Login onLogin={mockOnLogin} />);

        const emailInput = screen.getByPlaceholderText(/name@company.com/i);
        const passwordInput = screen.getByPlaceholderText(/••••••••/i);
        const submitButton = screen.getByRole('button', { name: /Access Dashboard/i });

        fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/Email atau password salah/i)).toBeInTheDocument();
        }, { timeout: 3000 });

        expect(mockOnLogin).not.toHaveBeenCalled();
    });

    it('calls onLogin with valid credentials', async () => {
        const mockOnLogin = vi.fn();
        render(<Login onLogin={mockOnLogin} />);

        const emailInput = screen.getByPlaceholderText(/name@company.com/i);
        const passwordInput = screen.getByPlaceholderText(/••••••••/i);
        const submitButton = screen.getByRole('button', { name: /Access Dashboard/i });

        fireEvent.change(emailInput, { target: { value: 'admin@omniai.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockOnLogin).toHaveBeenCalledWith(expect.objectContaining({
                name: 'Admin Regular',
                email: 'admin@omniai.com'
            }));
        }, { timeout: 3000 });
    });
});
