import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { InvitationManagementPanel } from '../components/InvitationManagementPanel';
afterEach(cleanup);
it('shows an application capacity rejection while preserving valid import rows without inventing validation errors', async () => {
    const importInvitations = vi.fn().mockResolvedValue({ success: true, messages: ['3 seats required; 1 available. No invitations sent.'], data: { validationSucceeded: false, queued: false, validRowCount: 3, invalidRowCount: 0, previewRows: [{ rowNumber: 2, firstName: 'Valid', lastName: 'Person', emailAddress: 'valid@example.test' }], invalidRows: [] } });
    render(<InvitationManagementPanel presentation="workspace" showImport adapter={{ getInvitationList: vi.fn().mockResolvedValue({ success: true, data: { items: [], totalCount: 0 } }), inviteUser: vi.fn(), importInvitations }} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Import', exact: true }));
    fireEvent.change(screen.getByLabelText('Choose File'), { target: { files: [new File(['valid'], 'users.csv')] } });
    fireEvent.click(screen.getByRole('button', { name: 'Import and Send' }));
    expect(await screen.findByText('3 seats required; 1 available. No invitations sent.')).toBeTruthy();
    expect(screen.getByText('valid@example.test')).toBeTruthy();
    expect(screen.queryByText(/0 invalid row/i)).toBeNull();
    expect(importInvitations).toHaveBeenCalledOnce();
});

