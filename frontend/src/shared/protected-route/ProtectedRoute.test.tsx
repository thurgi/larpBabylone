import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

vi.mock('@/core/services', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/core/services';

describe('ProtectedRoute', () => {
  it('should show loader when loading', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: true,
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('should redirect to /login when not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: false,
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('should render children when authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', username: 'test', provider: 'discord' },
      loading: false,
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });
});
