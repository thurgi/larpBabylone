export type AuthProvider = 'discord' | 'google';

export interface UserPayload {
  id: string;
  username: string;
  email?: string;
  provider: AuthProvider;
  providerId?: string;
}

export interface SyncUserProfile {
  id: string;
  username: string;
  email?: string;
  provider?: AuthProvider;
}

export interface AuthenticatedProfile {
  username: string;
  email?: string;
  provider: AuthProvider;
  providerId: string;
}
