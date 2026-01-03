import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Sidebar from '../components/Sidebar';
import React from 'react';

describe('Sidebar Component', () => {
    const mockOnViewChange = vi.fn();
    const mockOnLogout = vi.fn();

    it('renders navigation items', () => {
        render(
            <Sidebar
                activeView="dashboard"
                onViewChange={mockOnViewChange}
                onLogout={mockOnLogout}
            />
        );

        // In the Sidebar, navigation items are buttons with 'title' attribute
        // Check for unique labels in NAV_ITEMS
        expect(screen.getByTitle('Dashboard')).toBeInTheDocument();
        expect(screen.getByTitle('Inbox')).toBeInTheDocument();
        expect(screen.getByTitle('Contacts')).toBeInTheDocument();
    });

    it('calls onViewChange when an item is clicked', () => {
        render(
            <Sidebar
                activeView="dashboard"
                onViewChange={mockOnViewChange}
                onLogout={mockOnLogout}
            />
        );

        const inboxButton = screen.getByTitle('Inbox');
        fireEvent.click(inboxButton);

        expect(mockOnViewChange).toHaveBeenCalledWith('chats');
    });

    it('calls onLogout when logout button is clicked', () => {
        render(
            <Sidebar
                activeView="dashboard"
                onViewChange={mockOnViewChange}
                onLogout={mockOnLogout}
            />
        );

        // Find logout button by text inside
        const logoutText = screen.getByText(/Logout/i);
        fireEvent.click(logoutText);

        expect(mockOnLogout).toHaveBeenCalled();
    });
});
