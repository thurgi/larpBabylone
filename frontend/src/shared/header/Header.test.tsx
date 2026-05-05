import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Header } from './Header';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/core/services', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/core/services';

describe('Header', () => {
  const mockLogout = vi.fn();

  const renderHeader = (userOverride?: Record<string, unknown>) => {
    vi.mocked(useAuth).mockReturnValue({
      user: userOverride === null ? null : { id: '1', username: 'alice', provider: 'discord', ...userOverride },
      loading: false,
      logout: mockLogout,
    });
    return render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );
  };

  it('should show app title', () => {
    renderHeader();
    expect(screen.getByText('LarpBabylone')).toBeInTheDocument();
  });

  it('should show username when logged in', () => {
    renderHeader();
    expect(screen.getByText('alice')).toBeInTheDocument();
  });

  it('should show logout button when logged in', () => {
    renderHeader();
    expect(screen.getByText('Déconnexion')).toBeInTheDocument();
  });

  it('should call logout and navigate to /login on logout click', async () => {
    const user = userEvent.setup();
    mockLogout.mockResolvedValue(undefined);
    renderHeader();

    await user.click(screen.getByText('Déconnexion'));

    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should navigate to / when clicking title', async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByText('LarpBabylone'));

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should navigate to /objects when clicking Objets', async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByText('Objets'));

    expect(mockNavigate).toHaveBeenCalledWith('/objects');
  });

  it('should show Groupes link when user is group admin', () => {
    renderHeader({ isGroupAdmin: true });
    expect(screen.getByText('Groupes')).toBeInTheDocument();
  });

  it('should not show Groupes link when user is not group admin', () => {
    renderHeader({ isGroupAdmin: false });
    expect(screen.queryByText('Groupes')).not.toBeInTheDocument();
  });

  it('should navigate to /groups when clicking Groupes', async () => {
    const user = userEvent.setup();
    renderHeader({ isGroupAdmin: true });

    await user.click(screen.getByText('Groupes'));

    expect(mockNavigate).toHaveBeenCalledWith('/groups');
  });

  it('should toggle menu on burger click', async () => {
    const user = userEvent.setup();
    renderHeader();

    const menuBtn = document.querySelector('.app-header__menu-btn') as HTMLElement;
    await user.click(menuBtn);

    const nav = document.querySelector('.app-header__nav');
    expect(nav?.classList.contains('app-header__nav--open')).toBe(true);
  });
});
