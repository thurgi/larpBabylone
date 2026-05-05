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

    const deleteButton = document.querySelector('.object-item__actions button');
    if (deleteButton) {
      await user.click(deleteButton);
    }

    expect(api.delete).toHaveBeenCalledWith('/api/objects/o1');
  });

  it('should edit an object when clicking on the card', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockResolvedValue([mockObject]);
    vi.mocked(api.put).mockResolvedValue(mockObject);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Épée')).toBeInTheDocument();
    });

    const card = document.querySelector('.object-item__card') as HTMLElement;
    await user.click(card);

    expect(screen.getByText("Modifier l'objet")).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText("Nom de l'objet");
    expect(nameInput).toHaveValue('Épée');

    await user.clear(nameInput);
    await user.type(nameInput, 'Épée magique');

    vi.mocked(api.get).mockResolvedValue([{ ...mockObject, name: 'Épée magique' }]);

    await user.click(screen.getByText('Enregistrer'));

    expect(api.put).toHaveBeenCalledWith('/api/objects/o1', expect.objectContaining({
      name: 'Épée magique',
    }));
  });

  it('should not save when name is empty', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockResolvedValue([mockObject]);
    vi.mocked(api.put).mockResolvedValue(mockObject);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Épée')).toBeInTheDocument();
    });

    const card = document.querySelector('.object-item__card') as HTMLElement;
    await user.click(card);

    const nameInput = screen.getByPlaceholderText("Nom de l'objet");
    await user.clear(nameInput);

    const saveButton = screen.getByText('Enregistrer');
    expect(saveButton.closest('button')).toHaveAttribute('disabled');
  });

  it('should not call api on cancel', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockResolvedValue([mockObject]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Épée')).toBeInTheDocument();
    });

    const card = document.querySelector('.object-item__card') as HTMLElement;
    await user.click(card);

    expect(screen.getByPlaceholderText("Nom de l'objet")).toBeInTheDocument();

    await user.click(screen.getByText('Annuler'));

    expect(api.put).not.toHaveBeenCalled();
    expect(api.post).not.toHaveBeenCalled();
  });
});
