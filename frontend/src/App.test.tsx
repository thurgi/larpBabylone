import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { App } from './App';

vi.mock('@/core/services', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({ user: null, loading: false, logout: vi.fn() }),
}));

describe('App', () => {
  it('should render without crashing', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Se connecter avec Discord')).toBeInTheDocument();
    });
  });
});
