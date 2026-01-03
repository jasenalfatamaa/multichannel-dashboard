import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CustomerDatabase from '../components/CustomerDatabase';
import React from 'react';
import { MOCK_CUSTOMERS } from '../constants';

describe('CustomerDatabase Component', () => {
    const mockOnAdd = vi.fn();
    const mockOnDelete = vi.fn();
    const mockOnStartChat = vi.fn();

    it('renders customer list', () => {
        render(
            <CustomerDatabase
                customers={MOCK_CUSTOMERS}
                onAddCustomer={mockOnAdd}
                onDeleteCustomer={mockOnDelete}
                onStartChat={mockOnStartChat}
            />
        );

        // Check for "Customers" heading
        expect(screen.getByRole('heading', { name: /Customers/i })).toBeInTheDocument();

        // Check for customer name (might be multiple due to mobile/desktop views)
        expect(screen.getAllByText(MOCK_CUSTOMERS[0].name).length).toBeGreaterThan(0);
    });

    it('navigates to delete confirmation', async () => {
        render(
            <CustomerDatabase
                customers={MOCK_CUSTOMERS}
                onAddCustomer={mockOnAdd}
                onDeleteCustomer={mockOnDelete}
                onStartChat={mockOnStartChat}
            />
        );

        // Open the menu for the first customer (desktop view usually)
        const menuButtons = screen.getAllByLabelText(/Open menu/i);
        fireEvent.click(menuButtons[0]);

        // Find and click 'Delete Contact'
        const deleteOption = await screen.findByText(/Delete Contact/i);
        fireEvent.click(deleteOption);

        // Verification of modal
        expect(screen.getByText(/Delete Contact\?/i)).toBeInTheDocument();

        // Click 'Delete Permanently'
        const finalDeleteButton = screen.getByText(/Delete Permanently/i);
        fireEvent.click(finalDeleteButton);

        expect(mockOnDelete).toHaveBeenCalledWith(MOCK_CUSTOMERS[0].id);
    });
});
