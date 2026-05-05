import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@gravity-ui/uikit';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/core/services', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/core/services';

describe('LoginPage', () => {
  const renderPage = () =>
    render(
      <MemoryRouter>
        <ThemeProvider theme="light">
          <LoginPage />
        </ThemeProvider>
      </MemoryRouter>,
    );

  it('should show login buttons', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, loading: false, logout: vi.fn() });

    renderPage();

    expect(screen.getByText('Se connecter avec Discord')).toBeInTheDocument();
    expect(screen.getByText('Se connecter avec Google')).toBeInTheDocument();
  });

  it('should show app title', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, loading: false, logout: vi.fn() });

    renderPage();

    expect(screen.getByText('LarpBabylone')).toBeInTheDocument();
  });

  it('should redirect to / when user is already logged in', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', username: 'alice', provider: 'discord' as const },
      loading: false,
      logout: vi.fn(),
    });

    renderPage();

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });
});
