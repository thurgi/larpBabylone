import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@gravity-ui/uikit';
import { MemoryRouter } from 'react-router-dom';
import { DocumentsPage } from './DocumentsPage';
import type { Document, Folder } from '@/core/types';

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
    patch: vi.fn(),
    delete: vi.fn(),
  },
  useAuth: () => ({ user: { id: 'u1', username: 'test' }, loading: false, logout: vi.fn() }),
}));

import { api } from '@/core/services';

const mockDoc: Document = {
  id: 'd1',
  title: 'Test Doc',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  groupIds: [],
  folderId: null,
};

const mockFolder: Folder = {
  id: 'f1',
  name: 'Mon dossier',
  parentId: null,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const mockSubFolder: Folder = {
  id: 'f2',
  name: 'Sous-dossier',
  parentId: 'f1',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const mockDocInFolder: Document = {
  id: 'd2',
  title: 'Doc in Folder',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  groupIds: [],
  folderId: 'f1',
};

describe('DocumentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  const renderPage = () =>
    render(
      <MemoryRouter>
        <ThemeProvider theme="light">
          <DocumentsPage />
        </ThemeProvider>
      </MemoryRouter>,
    );

  it('should show empty message when no content', async () => {
    vi.mocked(api.get).mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Aucun contenu/)).toBeInTheDocument();
    });
  });

  it('should show documents and folders at root', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('folders')) return Promise.resolve([mockFolder]);
      return Promise.resolve([mockDoc]);
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Test Doc')).toBeInTheDocument();
      expect(screen.getByText('Mon dossier')).toBeInTheDocument();
    });
  });

  it('should navigate into folder when clicked', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('folders')) return Promise.resolve([mockFolder, mockSubFolder]);
      return Promise.resolve([mockDocInFolder]);
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Mon dossier')).toBeInTheDocument();
    });

    // Click the folder to navigate into it
    fireEvent.click(screen.getByText('Mon dossier'));

    // Now we should see the subfolder and doc inside folder
    await waitFor(() => {
      expect(screen.getByText('Sous-dossier')).toBeInTheDocument();
      expect(screen.getByText('Doc in Folder')).toBeInTheDocument();
    });
  });

  it('should show breadcrumbs when inside folder', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('folders')) return Promise.resolve([mockFolder, mockSubFolder]);
      return Promise.resolve([]);
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Mon dossier')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Mon dossier'));

    await waitFor(() => {
      // Breadcrumb should show "Mon dossier"
      expect(screen.getAllByText('Mon dossier').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('should create a new folder', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    vi.mocked(api.post).mockResolvedValue({});

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Aucun contenu/)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Nouveau dossier'));

    const input = screen.getByPlaceholderText('Nom du dossier');
    await userEvent.type(input, 'Nouveau');
    await userEvent.click(screen.getByText('Créer'));

    expect(api.post).toHaveBeenCalledWith('/api/folders', { name: 'Nouveau' });
  });

  it('should create a document in current folder', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('folders')) return Promise.resolve([mockFolder]);
      return Promise.resolve([]);
    });
    vi.mocked(api.post).mockResolvedValue({});

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Mon dossier')).toBeInTheDocument();
    });

    // Navigate into folder
    fireEvent.click(screen.getByText('Mon dossier'));

    await userEvent.click(screen.getByText('Nouveau document'));

    const input = screen.getByPlaceholderText('Titre du document');
    await userEvent.type(input, 'Mon doc');
    await userEvent.click(screen.getByText('Créer'));

    expect(api.post).toHaveBeenCalledWith('/api/documents', {
      title: 'Mon doc',
      folderId: 'f1',
    });
  });

  it('should delete a folder', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('folders')) return Promise.resolve([mockFolder]);
      return Promise.resolve([]);
    });
    vi.mocked(api.delete).mockResolvedValue({});

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Mon dossier')).toBeInTheDocument();
    });

    // Find the delete button in the folder card
    const folderCard = screen.getByText('Mon dossier').closest('.document-card');
    const deleteBtn = folderCard!.querySelector('.document-card__actions button:last-child') as HTMLElement;
    await userEvent.click(deleteBtn);

    expect(api.delete).toHaveBeenCalledWith('/api/folders/f1');
  });

  it('should navigate to document on click', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('folders')) return Promise.resolve([]);
      return Promise.resolve([mockDoc]);
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Test Doc')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Test Doc'));

    expect(mockNavigate).toHaveBeenCalledWith('/documents/d1');
  });

  it('should delete a document', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('folders')) return Promise.resolve([]);
      return Promise.resolve([mockDoc]);
    });
    vi.mocked(api.delete).mockResolvedValue({});

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Test Doc')).toBeInTheDocument();
    });

    const docCard = screen.getByText('Test Doc').closest('.document-card');
    const deleteBtn = docCard!.querySelector('.document-card__actions button:last-child') as HTMLElement;
    await userEvent.click(deleteBtn);

    expect(api.delete).toHaveBeenCalledWith('/api/documents/d1');
  });

  it('should navigate to document edit when clicking edit button', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('folders')) return Promise.resolve([]);
      return Promise.resolve([mockDoc]);
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Test Doc')).toBeInTheDocument();
    });

    const docCard = screen.getByText('Test Doc').closest('.document-card');
    const buttons = docCard!.querySelectorAll('.document-card__actions button');
    // Second button is the edit (Pencil) button
    await userEvent.click(buttons[1] as HTMLElement);

    expect(mockNavigate).toHaveBeenCalledWith('/documents/d1/edit');
  });

  it('should create a document at root', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    vi.mocked(api.post).mockResolvedValue({});

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Aucun contenu/)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Nouveau document'));

    const input = screen.getByPlaceholderText('Titre du document');
    await userEvent.type(input, 'Mon doc');
    await userEvent.click(screen.getByText('Créer'));

    expect(api.post).toHaveBeenCalledWith('/api/documents', { title: 'Mon doc' });
  });

  it('should cancel document creation', async () => {
    vi.mocked(api.get).mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Aucun contenu/)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Nouveau document'));
    expect(screen.getByPlaceholderText('Titre du document')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Annuler'));

    expect(api.post).not.toHaveBeenCalled();
  });

  it('should cancel folder creation', async () => {
    vi.mocked(api.get).mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Aucun contenu/)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Nouveau dossier'));
    expect(screen.getByPlaceholderText('Nom du dossier')).toBeInTheDocument();

    // Find the Annuler button for folder creation
    const cancelButtons = screen.getAllByText('Annuler');
    await userEvent.click(cancelButtons[0]);

    expect(api.post).not.toHaveBeenCalled();
  });

  it('should navigate back to root via breadcrumb', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('folders')) return Promise.resolve([mockFolder, mockSubFolder]);
      return Promise.resolve([mockDocInFolder]);
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Mon dossier')).toBeInTheDocument();
    });

    // Navigate into folder
    fireEvent.click(screen.getByText('Mon dossier'));

    await waitFor(() => {
      expect(screen.getByText('Doc in Folder')).toBeInTheDocument();
    });

    // Click Racine breadcrumb
    fireEvent.click(screen.getByText('Racine'));

    await waitFor(() => {
      expect(screen.getByText('Mon dossier')).toBeInTheDocument();
    });
  });

  it('should open move document modal', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('folders')) return Promise.resolve([mockFolder]);
      return Promise.resolve([mockDoc]);
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Test Doc')).toBeInTheDocument();
    });

    // Click move button (first button in doc actions with "Déplacer" title)
    const docCard = screen.getByText('Test Doc').closest('.document-card');
    const moveBtn = docCard!.querySelector('.document-card__actions button[title="Déplacer"]') as HTMLElement;
    await userEvent.click(moveBtn);

    expect(screen.getByText('Déplacer le document')).toBeInTheDocument();
  });

  it('should move a document', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('folders')) return Promise.resolve([mockFolder]);
      return Promise.resolve([mockDoc]);
    });
    vi.mocked(api.patch).mockResolvedValue({});

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Test Doc')).toBeInTheDocument();
    });

    const docCard = screen.getByText('Test Doc').closest('.document-card');
    const moveBtn = docCard!.querySelector('.document-card__actions button[title="Déplacer"]') as HTMLElement;
    await userEvent.click(moveBtn);

    // Click Déplacer without selecting a target (moves to root)
    await userEvent.click(screen.getByText('Déplacer'));

    expect(api.patch).toHaveBeenCalledWith(
      '/api/folders/move-document/d1',
      { folderId: null },
    );
  });

  it('should open move folder modal', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('folders')) return Promise.resolve([mockFolder]);
      return Promise.resolve([]);
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Mon dossier')).toBeInTheDocument();
    });

    const folderCard = screen.getByText('Mon dossier').closest('.document-card');
    const moveBtn = folderCard!.querySelector('.document-card__actions button[title="Déplacer"]') as HTMLElement;
    await userEvent.click(moveBtn);

    expect(screen.getByText('Déplacer le dossier')).toBeInTheDocument();
  });

  it('should move a folder', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('folders')) return Promise.resolve([mockFolder]);
      return Promise.resolve([]);
    });
    vi.mocked(api.put).mockResolvedValue({});

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Mon dossier')).toBeInTheDocument();
    });

    const folderCard = screen.getByText('Mon dossier').closest('.document-card');
    const moveBtn = folderCard!.querySelector('.document-card__actions button[title="Déplacer"]') as HTMLElement;
    await userEvent.click(moveBtn);

    await userEvent.click(screen.getByText('Déplacer'));

    expect(api.put).toHaveBeenCalledWith(
      '/api/folders/f1',
      { parentId: null },
    );
  });

  it('should create document with Enter key', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    vi.mocked(api.post).mockResolvedValue({});

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Aucun contenu/)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Nouveau document'));

    const input = screen.getByPlaceholderText('Titre du document');
    await userEvent.type(input, 'Doc Enter{Enter}');

    expect(api.post).toHaveBeenCalledWith('/api/documents', { title: 'Doc Enter' });
  });

  it('should create folder with Enter key', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    vi.mocked(api.post).mockResolvedValue({});

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Aucun contenu/)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Nouveau dossier'));

    const input = screen.getByPlaceholderText('Nom du dossier');
    await userEvent.type(input, 'Dossier Enter{Enter}');

    expect(api.post).toHaveBeenCalledWith('/api/folders', { name: 'Dossier Enter' });
  });
});
