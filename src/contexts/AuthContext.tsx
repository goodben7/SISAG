import { createContext, useContext, useEffect, useState, ReactNode } from 'react';


import type { Database } from '../lib/database.types';
import { signUp as apiSignUp, signIn as apiSignIn, me as apiMe, clearAuthToken } from '../lib/api';

type Profile = Database['public']['Tables']['profiles']['Row'];

type AuthUser = { id: string; email: string; created_at: string };

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: {
    full_name: string;
    role: 'citizen' | 'government' | 'partner';
    organization?: string;
    province?: string;
    phone?: string;
  }) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiMe();
        setUser(data.user);
        setProfile(data.profile);
      } catch {
        // not logged in or token invalid
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    userData: {
      full_name: string;
      role: 'citizen' | 'government' | 'partner';
      organization?: string;
      province?: string;
      phone?: string;
    }
  ) => {
    try {
      const res = await apiSignUp({
        email,
        password,
        full_name: userData.full_name,
        role: userData.role,
        organization: userData.organization || null,
        province: userData.province || null,
        phone: userData.phone || null
      });
setUser({
  id: res.user.id,
  email: res.user.email,
  created_at: (res.user as any).created_at ?? new Date().toISOString(),
});
      setProfile(res.profile as Profile);
      return { error: null };
    } catch (error) {
      return { error: (error as Error) };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const res = await apiSignIn(email, password);
      setUser({
        id: res.user.id,
        email: res.user.email,
        created_at: (res.user as any).created_at ?? new Date().toISOString(),
      });
      setProfile(res.profile as Profile);
      return { error: null };
    } catch (error) {
      return { error: (error as Error) };
    }
  };

  const signOut = async () => {
    clearAuthToken();
    setUser(null);
    setProfile(null);
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
