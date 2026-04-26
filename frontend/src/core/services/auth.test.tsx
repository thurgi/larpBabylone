import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './auth';

// Mock the http module
vi.mock('./http', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { api } from './http';

function TestConsumer() {
  const { user, loading, logout } = useAuth();

  if (loading) return <div>Loading</div>;
  if (!user) return <div>No user</div>;
  return (
    <div>
      <span data-testid="username">{user.username}</span>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should show loading then user when auth succeeds', async () => {
    vi.mocked(api.get).mockResolvedValue({
      id: '1',
      username: 'alice',
      provider: 'discord',
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    // Initially loading
    expect(screen.getByText('Loading')).toBeInTheDocument();

    // Then shows user
    await waitFor(() => {
      expect(screen.getByTestId('username')).toHaveTextContent('alice');
    });
  });

  it('should show no user when auth fails', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('401'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('No user')).toBeInTheDocument();
    });
  });

  it('should call logout endpoint and clear user', async () => {
    vi.mocked(api.get).mockResolvedValue({
      id: '1',
      username: 'bob',
      provider: 'google',
    });
    vi.mocked(api.post).mockResolvedValue(undefined);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('username')).toHaveTextContent('bob');
    });

    screen.getByText('Logout').click();

    await waitFor(() => {
      expect(screen.getByText('No user')).toBeInTheDocument();
    });

    expect(api.post).toHaveBeenCalledWith('/api/auth/logout');
  });
});
