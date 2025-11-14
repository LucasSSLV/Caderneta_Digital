// contexts/AuthContext.tsx - ATUALIZADO
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as authService from '../services/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  needsOnboarding: boolean;
  login: () => void;
  logout: () => void;
  verificarAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  needsOnboarding: true,
  login: () => { },
  logout: () => { },
  verificarAuth: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(true);

  useEffect(() => {
    verificarAuth();
  }, []);

  const verificarAuth = async () => {
    try {
      // Primeiro verifica se o onboarding foi completado
      const onboardingCompleto = await authService.verificarOnboardingCompleto();

      if (!onboardingCompleto) {
        setNeedsOnboarding(true);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      setNeedsOnboarding(false);

      // Verifica se a autenticação está ativa
      const authAtiva = await authService.autenticacaoEstaAtiva();

      if (!authAtiva) {
        // Se não tem PIN configurado (usuário pulou), deixa autenticado
        setIsAuthenticated(true);
      } else {
        // Se tem PIN configurado, precisa autenticar
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      setIsAuthenticated(true);
      setNeedsOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = () => {
    setIsAuthenticated(true);
    setNeedsOnboarding(false);
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        needsOnboarding,
        login,
        logout,
        verificarAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}