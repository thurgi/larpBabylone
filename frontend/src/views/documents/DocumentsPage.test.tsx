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
});
