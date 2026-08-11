import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkLocalSession = () => {
    const localData = localStorage.getItem('userSession');
    const sessionData = sessionStorage.getItem('userSession');
    const savedSession = localData || sessionData;

    if (savedSession) {
      try {
        const parsedUser = JSON.parse(savedSession);
        setUser(parsedUser);
        setSession({ user: parsedUser });
      } catch (e) {
        console.error("Erro ao carregar sessão local:", e);
        setUser(null);
        setSession(null);
      }
    } else {
      setUser(null);
      setSession(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkLocalSession();
  }, []);

  const signOut = async () => {
    localStorage.removeItem('userSession');
    sessionStorage.removeItem('userSession');
    setUser(null);
    setSession(null);
    window.location.href = '/login';
  };

  const navigateToLogin = () => {
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  };

  const value = {
    user,
    session,
    loading,
    isLoadingAuth: loading,
    authError: !user && !loading ? { type: 'auth_required' } : null,
    signOut,
    navigateToLogin,
    refreshSession: checkLocalSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};
