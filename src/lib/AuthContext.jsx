import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca a sessão salva no localStorage ou sessionStorage
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
      }
    }

    setLoading(false);
  }, []);

  const signOut = async () => {
    localStorage.removeItem('userSession');
    sessionStorage.removeItem('userSession');
    setUser(null);
    setSession(null);
  };

  const value = {
    user,
    session,
    loading,
    isLoadingAuth: loading, // Compatibilidade com o App.jsx
    authError: !user && !loading ? { type: 'auth_required' } : null,
    signOut,
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
