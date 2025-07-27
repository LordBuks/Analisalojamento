import { useState, useEffect } from 'react';
import { authService, AuthUser } from '../services/authService';

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const user = await authService.signIn(email, password);
      setUser(user);
      return user;
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await authService.signOut();
      setUser(null);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  return {
    user,
    loading,
    error,
    signIn,
    signOut,
    isAuthenticated: !!user
  };
};

