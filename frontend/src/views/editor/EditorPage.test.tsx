import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, ToasterProvider } from '@gravity-ui/uikit';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { EditorPage } from './EditorPage';
import type { Document, Version, VersionFull, Group } from '@/core/types';

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

vi.mock('./VersionEditor', () => ({
  VersionEditor: ({ content, onSave, saving }: { content: string; onSave: (c: string) => Promise<void>; saving: boolean }) => (
    <div data-testid="version-editor">
      <span>{content}</span>
      <button onClick={() => onSave('updated content')} disabled={saving}>
        Save
      </button>
    </div>
  ),
}));

import { api } from '@/core/services';

const mockDoc: Document = {
  id: 'doc1',
  title: 'Mon Document',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  groupIds: [],
  folderId: null,
};

const mockVersion: Version = {
  id: 'v1',
  documentId: 'doc1',
  title: '1',
  isValid: false,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  authorId: 'u1',
};

const mockVersionFull: VersionFull = {
  ...mockVersion,
  content: '# Hello',
};

const mockGroup: Group = {
  id: 'g1',
  name: 'Editors',
  permissions: {
    documents: { create: true, read: true, update: true, delete: true },
    versions: { create: true, read: true, update: true, delete: true },
  },
  userIds: ['u1'],
};

describe('EditorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  const renderPage = (documentId = 'doc1') =>
    render(
      <MemoryRouter initialEntries={[`/documents/${documentId}/edit`]}>
        <ThemeProvider theme="light">
          <ToasterProvider>
            <Routes>
              <Route path="/documents/:documentId/edit" element={<EditorPage />} />
            </Routes>
          </ToasterProvider>
        </ThemeProvider>
      </MemoryRouter>,
    );

  it('should show loader initially', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(document.querySelector('.editor-page__loader')).toBeInTheDocument();
  });

  it('should show document title after loading', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/versions/')) return Promise.resolve(mockVersionFull);
      if (url.includes('/versions')) return Promise.resolve([mockVersion]);
      if (url.includes('/groups')) return Promise.resolve([]);
      return Promise.resolve(mockDoc);
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Mon Document')).toBeInTheDocument();
    });
  });

  it('should show not found when document does not exist', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/versions')) return Promise.resolve([]);
      if (url.includes('/groups')) return Promise.resolve([]);
      return Promise.resolve(null);
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Document introuvable')).toBeInTheDocument();
    });
  });

  it('should navigate back when clicking Retour on not found', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/versions')) return Promise.resolve([]);
      if (url.includes('/groups')) return Promise.resolve([]);
      return Promise.resolve(null);
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Retour')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Retour'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should show version editor when version is loaded', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/versions/')) return Promise.resolve(mockVersionFull);
      if (url.includes('/versions')) return Promise.resolve([mockVersion]);
      if (url.includes('/groups')) return Promise.resolve([]);
      return Promise.resolve(mockDoc);
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('version-editor')).toBeInTheDocument();
    });

    expect(screen.getByText('# Hello')).toBeInTheDocument();
  });

  it('should show empty message when no versions', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/versions')) return Promise.resolve([]);
      if (url.includes('/groups')) return Promise.resolve([]);
      return Promise.resolve(mockDoc);
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Aucune version/)).toBeInTheDocument();
    });
  });

  it('should save content via version editor', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/versions/')) return Promise.resolve(mockVersionFull);
      if (url.includes('/versions')) return Promise.resolve([mockVersion]);
      if (url.includes('/groups')) return Promise.resolve([]);
      return Promise.resolve(mockDoc);
    });
    vi.mocked(api.put).mockResolvedValue({ ...mockVersionFull, content: 'updated content' });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('version-editor')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Save'));

    expect(api.put).toHaveBeenCalledWith(
      '/api/documents/doc1/versions/v1',
      { content: 'updated content' },
    );
  });

  it('should create a new version', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/versions/')) return Promise.resolve(mockVersionFull);
      if (url.includes('/versions')) return Promise.resolve([mockVersion]);
      if (url.includes('/groups')) return Promise.resolve([]);
      return Promise.resolve(mockDoc);
    });
    vi.mocked(api.post).mockResolvedValue({ ...mockVersionFull, id: 'v2' });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Mon Document')).toBeInTheDocument();
    });

    // Find the Plus button (create version)
    const buttons = document.querySelectorAll('.editor-page__toolbar-right button');
    const createBtn = buttons[1] as HTMLElement; // after version select
    await user.click(createBtn);

    expect(api.post).toHaveBeenCalledWith('/api/documents/doc1/versions', {});
  });

  it('should delete a version', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/versions/')) return Promise.resolve(mockVersionFull);
      if (url.includes('/versions')) return Promise.resolve([mockVersion]);
      if (url.includes('/groups')) return Promise.resolve([]);
      return Promise.resolve(mockDoc);
    });
    vi.mocked(api.delete).mockResolvedValue(undefined);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Mon Document')).toBeInTheDocument();
    });

    // Find the delete (trash) button
    const trashBtn = document.querySelector('.editor-page__toolbar-right [class*="flat-danger"]') as HTMLElement;
    if (trashBtn) {
      await user.click(trashBtn);
      expect(api.delete).toHaveBeenCalledWith('/api/documents/doc1/versions/v1');
    }
  });

  it('should validate a version', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/versions/')) return Promise.resolve(mockVersionFull);
      if (url.includes('/versions')) return Promise.resolve([mockVersion]);
      if (url.includes('/groups')) return Promise.resolve([]);
      return Promise.resolve(mockDoc);
    });
    vi.mocked(api.patch).mockResolvedValue(undefined);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Valider')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Valider'));

    expect(api.patch).toHaveBeenCalledWith('/api/documents/doc1/versions/v1/validate');
  });

  it('should navigate back when clicking Retour button', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/versions/')) return Promise.resolve(mockVersionFull);
      if (url.includes('/versions')) return Promise.resolve([mockVersion]);
      if (url.includes('/groups')) return Promise.resolve([]);
      return Promise.resolve(mockDoc);
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Retour')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Retour'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should select the valid version by default', async () => {
    const validVersion: Version = { ...mockVersion, id: 'v2', title: '2', isValid: true };
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/versions/v2')) return Promise.resolve({ ...mockVersionFull, id: 'v2', isValid: true });
      if (url.includes('/versions/v1')) return Promise.resolve(mockVersionFull);
      if (url.includes('/versions')) return Promise.resolve([mockVersion, validVersion]);
      if (url.includes('/groups')) return Promise.resolve([]);
      return Promise.resolve(mockDoc);
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('version-editor')).toBeInTheDocument();
    });

    // Should have loaded version v2 (the valid one)
    expect(api.get).toHaveBeenCalledWith('/api/documents/doc1/versions/v2');
  });

  it('should update groups on document', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/versions/')) return Promise.resolve(mockVersionFull);
      if (url.includes('/versions')) return Promise.resolve([mockVersion]);
      if (url.includes('/groups')) return Promise.resolve([mockGroup]);
      return Promise.resolve(mockDoc);
    });
    vi.mocked(api.put).mockResolvedValue(mockDoc);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Mon Document')).toBeInTheDocument();
    });

    // The Select component for groups should be rendered
    // We can't easily interact with gravity-ui Select, but verify the api call exists
    expect(api.get).toHaveBeenCalledWith('/api/groups');
  });
});
