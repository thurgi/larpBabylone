import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@gravity-ui/uikit';
import { MemoryRouter } from 'react-router-dom';
import { ObjectsPage } from './ObjectsPage';
import type { ObjectItem } from '@/core/types';

vi.mock('@/core/services', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  useAuth: () => ({ user: { id: 'u1', username: 'test-user', isGroupAdmin: false }, loading: false, logout: vi.fn() }),
}));

import { api } from '@/core/services';

const mockObject: ObjectItem = {
  id: 'o1',
  name: 'Épée',
  description: 'Une épée en mousse',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

describe('ObjectsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = () =>
    render(
      <MemoryRouter>
        <ThemeProvider theme="light">
          <ObjectsPage />
        </ThemeProvider>
      </MemoryRouter>,
    );

  it('should show loader then objects', async () => {
    vi.mocked(api.get).mockResolvedValue([mockObject]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Épée')).toBeInTheDocument();
    });

    expect(screen.getByText('Une épée en mousse')).toBeInTheDocument();
  });

  it('should show empty message when no objects', async () => {
    vi.mocked(api.get).mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Aucun objet. Créez-en un pour commencer.')).toBeInTheDocument();
    });
  });

  it('should create an object', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockResolvedValue([]);
    vi.mocked(api.post).mockResolvedValue({ ...mockObject, id: 'o2' });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Nouvel objet')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Nouvel objet'));

    const nameInput = screen.getByPlaceholderText("Nom de l'objet");
    await user.type(nameInput, 'Bouclier');

    const descInput = screen.getByPlaceholderText('Description');
    await user.type(descInput, 'Un bouclier en bois');

    vi.mocked(api.get).mockResolvedValue([{ ...mockObject, id: 'o2', name: 'Bouclier', description: 'Un bouclier en bois' }]);

    await user.click(screen.getByText('Créer'));

    expect(api.post).toHaveBeenCalledWith('/api/objects', expect.objectContaining({
      name: 'Bouclier',
      description: 'Un bouclier en bois',
    }));
  });

  it('should delete an object', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockResolvedValue([mockObject]);
    vi.mocked(api.delete).mockResolvedValue(undefined);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Épée')).toBeInTheDocument();
    });

    vi.mocked(api.get).mockResolvedValue([]);

    const cardActions = document.querySelector('.object-card__actions');
    const buttons = cardActions?.querySelectorAll('button');
    if (buttons && buttons.length >= 2) {
      await user.click(buttons[1]);
    }

    expect(api.delete).toHaveBeenCalledWith('/api/objects/o1');
  });
});
