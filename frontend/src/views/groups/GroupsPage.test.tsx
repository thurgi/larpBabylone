import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@gravity-ui/uikit';
import { MemoryRouter } from 'react-router-dom';
import { GroupsPage } from './GroupsPage';
import type { Group } from '@/core/types';

vi.mock('@/core/services', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  useAuth: () => ({ user: { id: 'u1', username: 'admin', isGroupAdmin: true }, loading: false, logout: vi.fn() }),
}));

import { api } from '@/core/services';

const mockGroup: Group = {
  id: 'g1',
  name: 'Admins',
  permissions: {
    documents: { create: true, read: true, update: true, delete: true },
    versions: { create: true, read: true, update: true, delete: true },
    publicRead: false,
  },
  userIds: ['u1', 'u2'],
};

describe('GroupsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = () =>
    render(
      <MemoryRouter>
        <ThemeProvider theme="light">
          <GroupsPage />
        </ThemeProvider>
      </MemoryRouter>,
    );

  it('should show loader then groups', async () => {
    vi.mocked(api.get).mockResolvedValue([mockGroup]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Admins')).toBeInTheDocument();
    });

    expect(screen.getByText('2 utilisateurs')).toBeInTheDocument();
  });

  it('should show empty message when no groups', async () => {
    vi.mocked(api.get).mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Aucun groupe. Créez-en un pour commencer.')).toBeInTheDocument();
    });
  });

  it('should create a group', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockResolvedValue([]);
    vi.mocked(api.post).mockResolvedValue({ ...mockGroup, id: 'g2' });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Nouveau groupe')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Nouveau groupe'));

    const nameInput = screen.getByPlaceholderText('Nom du groupe');
    await user.type(nameInput, 'Éditeurs');

    vi.mocked(api.get).mockResolvedValue([{ ...mockGroup, id: 'g2', name: 'Éditeurs' }]);

    await user.click(screen.getByText('Créer'));

    expect(api.post).toHaveBeenCalledWith('/api/groups', expect.objectContaining({
      name: 'Éditeurs',
    }));
  });

  it('should delete a group', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockResolvedValue([mockGroup]);
    vi.mocked(api.delete).mockResolvedValue(undefined);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Admins')).toBeInTheDocument();
    });

    vi.mocked(api.get).mockResolvedValue([]);

    const cardActions = document.querySelector('.group-card__actions');
    const buttons = cardActions?.querySelectorAll('button');
    if (buttons && buttons.length >= 2) {
      await user.click(buttons[1]);
    }

    expect(api.delete).toHaveBeenCalledWith('/api/groups/g1');
  });
});
