import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import React from 'react';

// Mocking Gemini service
vi.mock('./services/geminiService', () => ({
    analyzeCustomerIntent: vi.fn().mockResolvedValue(['AI Tag']),
    getAISuggestion: vi.fn().mockResolvedValue('AI suggestion response'),
}));

describe('App Component', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('renders login page initially', () => {
        render(<App />);
        expect(screen.getByRole('heading', { name: /OmniAI/i })).toBeInTheDocument();
    });

    it('navigates to dashboard after login', async () => {
        render(<App />);

        fireEvent.change(screen.getByPlaceholderText(/name@company.com/i), { target: { value: 'admin@omniai.com' } });
        fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: /Access Dashboard/i }));

        await waitFor(() => {
            // Find Sidebar Inbox icon title to confirm login
            expect(screen.getByTitle('Inbox')).toBeInTheDocument();
        }, { timeout: 5000 });
    });

    it('persists session after login', async () => {
        const session = { id: 'admin-id', name: 'Admin Regular', email: 'admin@omniai.com', role: 'admin' };
        localStorage.setItem('omniai_current_session', JSON.stringify(session));

        render(<App />);

        await waitFor(() => {
            expect(screen.getByTitle('Inbox')).toBeInTheDocument();
        }, { timeout: 5000 });
    });
});
