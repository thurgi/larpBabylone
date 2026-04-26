import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, ToasterProvider } from '@gravity-ui/uikit';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { DocumentViewPage } from './DocumentViewPage';
import type { Document } from '@/core/types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@gravity-ui/markdown-editor', () => ({
  useMarkdownEditor: () => ({}),
  MarkdownEditorView: () => <div data-testid="markdown-view" />,
}));

vi.mock('@/core/services', () => ({
  api: {
    get: vi.fn(),
  },
  useAuth: () => ({ user: { id: 'u1', username: 'test' }, loading: false, logout: vi.fn() }),
}));

import { api } from '@/core/services';

const mockDoc: Document = {
  id: 'd1',
  title: 'Mon Document',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  groupIds: [],
  folderId: null,
};

describe('DocumentViewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    vi.stubGlobal('fetch', vi.fn());
  });

  const renderPage = () =>
    render(
      <MemoryRouter initialEntries={['/documents/d1']}>
        <ThemeProvider theme="light">
          <ToasterProvider>
            <Routes>
              <Route path="/documents/:documentId" element={<DocumentViewPage />} />
            </Routes>
          </ToasterProvider>
        </ThemeProvider>
      </MemoryRouter>,
    );

  it('should show document title and current version content', async () => {
    vi.mocked(api.get).mockResolvedValue(mockDoc);
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('# Hello World'),
    } as Response);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Mon Document')).toBeInTheDocument();
    });
  });

  it('should show error when no active version', async () => {
    vi.mocked(api.get).mockResolvedValue(mockDoc);
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
      text: () => Promise.resolve(''),
    } as Response);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Aucune version active pour ce document.')).toBeInTheDocument();
    });

    expect(screen.getByText('Créer une version')).toBeInTheDocument();
  });

  it('should navigate to editor on edit button click', async () => {
    vi.mocked(api.get).mockResolvedValue(mockDoc);
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('# Hello'),
    } as Response);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Mon Document')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Éditer'));
    expect(mockNavigate).toHaveBeenCalledWith('/documents/d1/edit');
  });

  it('should navigate back on retour click', async () => {
    vi.mocked(api.get).mockResolvedValue(mockDoc);
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('# Content'),
    } as Response);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Mon Document')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Retour'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
