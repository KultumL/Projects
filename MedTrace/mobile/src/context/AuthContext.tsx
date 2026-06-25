import React, { createContext, useContext, useEffect, useState } from 'react';
import { loginRequest, fetchCurrentUser, User } from '@/api/auth';
import { saveToken, getToken, saveUser, getUser, clearSession } from '@/api/storage';

export type { User as AuthUser };

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore persisted session on mount — reads token + cached user JSON
  // from secure storage so the app doesn't need a network call on every start.
  useEffect(() => {
    async function restoreSession() {
      try {
        const [savedToken, savedUserJson] = await Promise.all([
          getToken(),
          getUser(),
        ]);

        if (savedToken && savedUserJson) {
          setToken(savedToken);
          setUser(JSON.parse(savedUserJson) as User);
        }
      } catch {
        // Corrupted or unreadable storage — start fresh.
        await clearSession().catch(() => {});
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const jwt = await loginRequest(email, password);
    const currentUser = await fetchCurrentUser(jwt);

    await Promise.all([
      saveToken(jwt),
      saveUser(JSON.stringify(currentUser)),
    ]);

    setToken(jwt);
    setUser(currentUser);
  };

  const logout = async (): Promise<void> => {
    await clearSession();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
