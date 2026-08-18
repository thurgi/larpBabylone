import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api } from './http';
import type { User } from '../types';

const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://auth.localhost:3000';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const u = await api.get<User>('/api/auth/me');
      setUser(u);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = useCallback(async () => {
    try {
      // Déconnexion locale (efface le cookie sur ce domaine)
      await api.post('/api/auth/logout');
    } catch {
      // ignore
    }
    setUser(null);
    // Redirige vers le auth-service pour déconnexion globale (cross-domaine)
    window.location.href = `${AUTH_SERVICE_URL}/auth/logout-redirect?returnTo=${encodeURIComponent(window.location.origin + '/login')}`;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

