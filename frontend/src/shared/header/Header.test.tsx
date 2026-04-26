import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Header } from './Header';

vi.mock('@/core/services', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/core/services';

describe('Header', () => {
  it('should show app title', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', username: 'alice', provider: 'discord' },
      loading: false,
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByText('LarpBabylone')).toBeInTheDocument();
  });

  it('should show username when logged in', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', username: 'alice', provider: 'discord' },
      loading: false,
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByText('alice')).toBeInTheDocument();
  });

  it('should show logout button when logged in', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', username: 'alice', provider: 'discord' },
      loading: false,
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByText('Déconnexion')).toBeInTheDocument();
  });
});
