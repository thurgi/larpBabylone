import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@gravity-ui/uikit';
import { MemoryRouter } from 'react-router-dom';
import { GroupsPage } from './GroupsPage';
import type { Group, User } from '@/core/types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/core/services', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  useAuth: vi.fn(),
}));

import { api } from '@/core/services';
import { useAuth } from '@/core/services';

const mockGroup: Group = {
  id: 'g1',
  name: 'Admins',
  permissions: {
    documents: { create: true, read: true, update: true, delete: true },
    versions: { create: true, read: true, update: true, delete: true },
    publicRead: false,
    admin: false,
  },
  userIds: ['u1', 'u2'],
};

const mockUsers: User[] = [
  { id: 'u1', username: 'alice', provider: 'discord' },
  { id: 'u2', username: 'bob', provider: 'google' },
];

describe('GroupsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'u1', username: 'admin', isGroupAdmin: true, provider: 'discord' },
      loading: false,
      logout: vi.fn(),
    });
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
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/users')) return Promise.resolve(mockUsers);
      return Promise.resolve([mockGroup]);
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Admins')).toBeInTheDocument();
    });

    expect(screen.getByText('2 utilisateurs')).toBeInTheDocument();
  });

  it('should show empty message when no groups', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/users')) return Promise.resolve([]);
      return Promise.resolve([]);
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Aucun groupe. Créez-en un pour commencer.')).toBeInTheDocument();
    });
  });

  it('should create a group', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/users')) return Promise.resolve([]);
      return Promise.resolve([]);
    });
    vi.mocked(api.post).mockResolvedValue({ ...mockGroup, id: 'g2' });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Nouveau groupe')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Nouveau groupe'));

    const nameInput = screen.getByPlaceholderText('Nom du groupe');
    await user.type(nameInput, 'Éditeurs');

    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/users')) return Promise.resolve([]);
      return Promise.resolve([{ ...mockGroup, id: 'g2', name: 'Éditeurs' }]);
    });

    await user.click(screen.getByText('Créer'));

    expect(api.post).toHaveBeenCalledWith('/api/groups', expect.objectContaining({
      name: 'Éditeurs',
    }));
  });

  it('should delete a group', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/users')) return Promise.resolve(mockUsers);
      return Promise.resolve([mockGroup]);
    });
    vi.mocked(api.delete).mockResolvedValue(undefined);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Admins')).toBeInTheDocument();
    });

    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/users')) return Promise.resolve(mockUsers);
      return Promise.resolve([]);
    });

    const cardActions = document.querySelector('.group-card__actions');
    const buttons = cardActions?.querySelectorAll('button');
    if (buttons && buttons.length >= 2) {
      await user.click(buttons[1]);
    }

    expect(api.delete).toHaveBeenCalledWith('/api/groups/g1');
  });

  it('should edit a group', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/users')) return Promise.resolve(mockUsers);
      return Promise.resolve([mockGroup]);
    });
    vi.mocked(api.put).mockResolvedValue(mockGroup);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Admins')).toBeInTheDocument();
    });

    // Click edit button (first button in actions)
    const cardActions = document.querySelector('.group-card__actions');
    const editBtn = cardActions?.querySelector('button') as HTMLElement;
    await user.click(editBtn);

    // Modal should show with group data
    expect(screen.getByText('Modifier le groupe')).toBeInTheDocument();
    const nameInput = screen.getByPlaceholderText('Nom du groupe');
    expect(nameInput).toHaveValue('Admins');

    await user.clear(nameInput);
    await user.type(nameInput, 'Super Admins');

    await user.click(screen.getByText('Enregistrer'));

    expect(api.put).toHaveBeenCalledWith('/api/groups/g1', expect.objectContaining({
      name: 'Super Admins',
    }));
  });

  it('should show singular "utilisateur" for single user', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/users')) return Promise.resolve(mockUsers);
      return Promise.resolve([{ ...mockGroup, userIds: ['u1'] }]);
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('1 utilisateur')).toBeInTheDocument();
    });
  });

  it('should redirect non-admin users', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'u1', username: 'user', isGroupAdmin: false, provider: 'discord' },
      loading: false,
      logout: vi.fn(),
    });
    vi.mocked(api.get).mockResolvedValue([]);

    renderPage();

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('should show users in the modal', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/users')) return Promise.resolve(mockUsers);
      return Promise.resolve([]);
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Nouveau groupe')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Nouveau groupe'));

    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
  });

  it('should show "Aucun utilisateur" when no users exist', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Nouveau groupe')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Nouveau groupe'));

    expect(screen.getByText('Aucun utilisateur enregistré')).toBeInTheDocument();
  });

  it('should not save when name is empty', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/users')) return Promise.resolve([]);
      return Promise.resolve([]);
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Nouveau groupe')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Nouveau groupe'));

    const createBtn = screen.getByText('Créer');
    expect(createBtn.closest('button')).toHaveAttribute('disabled');
  });

  it('should toggle permission checkboxes', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/users')) return Promise.resolve([]);
      return Promise.resolve([]);
    });
    vi.mocked(api.post).mockResolvedValue({ id: 'g2' });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Nouveau groupe')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Nouveau groupe'));

    // Toggle some checkboxes
    const createCheckboxes = screen.getAllByText('create');
    await user.click(createCheckboxes[0]); // documents create

    const readCheckboxes = screen.getAllByText('read');
    await user.click(readCheckboxes[1]); // versions read

    // Toggle publicRead and admin
    await user.click(screen.getByText('Lecture publique'));
    await user.click(screen.getByText('Administration'));

    const nameInput = screen.getByPlaceholderText('Nom du groupe');
    await user.type(nameInput, 'Test Group');

    vi.mocked(api.get).mockResolvedValue([]);
    await user.click(screen.getByText('Créer'));

    expect(api.post).toHaveBeenCalledWith('/api/groups', expect.objectContaining({
      name: 'Test Group',
      permissions: expect.objectContaining({
        documents: expect.objectContaining({ create: true }),
        versions: expect.objectContaining({ read: true }),
        publicRead: true,
        admin: true,
      }),
    }));
  });

  it('should toggle user selection', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/users')) return Promise.resolve(mockUsers);
      return Promise.resolve([]);
    });
    vi.mocked(api.post).mockResolvedValue({ id: 'g2' });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Nouveau groupe')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Nouveau groupe'));

    // Select alice
    await user.click(screen.getByText('alice'));

    const nameInput = screen.getByPlaceholderText('Nom du groupe');
    await user.type(nameInput, 'With Users');

    vi.mocked(api.get).mockResolvedValue([]);
    await user.click(screen.getByText('Créer'));

    expect(api.post).toHaveBeenCalledWith('/api/groups', expect.objectContaining({
      userIds: ['u1'],
    }));
  });
});
