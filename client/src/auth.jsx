import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Restore session on load + surface ?auth=success/error from the OAuth redirect
  useEffect(() => {
    api
      .me()
      .then(({ user: u }) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));

    const params = new URLSearchParams(window.location.search);
    const authResult = params.get('auth');
    if (authResult === 'success' || authResult === 'error') {
      if (authResult === 'success') setToast({ type: 'success', text: 'Signed in with Google!' });
      else setToast({ type: 'error', text: 'Google sign-in failed. Please try again.' });
      // Remove only the 'auth' param, preserving any other query params
      params.delete('auth');
      const qs = params.toString();
      window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''));
    }
  }, []);

  // Auto-dismiss the toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch (_) {
      /* even if the call fails, clear local state */
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, logout, toast }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
