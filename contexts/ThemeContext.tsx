// contexts/ThemeContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

export const lightColors = {
  background: '#f5f5f5',
  card: '#ffffff',
  primary: '#007AFF',
  secondary: '#5856D6',
  text: '#1a1a1a',
  textSecondary: '#666',
  border: '#e0e0e0',
  success: '#27ae60',
  danger: '#e74c3c',
  warning: '#f39c12',
  info: '#3498db',
  
  // Cards coloridos
  cardSuccess: '#E8F5E9',
  cardDanger: '#FFEBEE',
  cardWarning: '#FFF3E0',
  cardInfo: '#E3F2FD',
  cardPurple: '#F3E5F5',
  
  // Específicos
  fabBackground: '#007AFF',
  inputBackground: '#ffffff',
  divider: '#e0e0e0',
  shadow: '#000000',
};

export const darkColors = {
  background: '#121212',
  card: '#1E1E1E',
  primary: '#0A84FF',
  secondary: '#5E5CE6',
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  border: '#2C2C2E',
  success: '#32D74B',
  danger: '#FF453A',
  warning: '#FFD60A',
  info: '#64D2FF',
  loadingText: '#A0A0A0',
  emptyTitle: '#CCCCCC',
  
  // Cards coloridos (versão escura)
  cardSuccess: '#1C3A24',
  cardDanger: '#3A1C1C',
  cardWarning: '#3A2F1C',
  cardInfo: '#1C2A3A',
  cardPurple: '#2A1C3A',
  
  // Específicos
  fabBackground: '#0A84FF',
  inputBackground: '#2C2C2E',
  divider: '#38383A',
  shadow: '#000000',
};

export type ThemeColors = typeof lightColors;

interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setThemeMode: (mode: 'light' | 'dark' | 'auto') => void;
  themeMode: 'light' | 'dark' | 'auto';
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  colors: lightColors,
  toggleTheme: () => {},
  setThemeMode: () => {},
  themeMode: 'auto',
});

export const useTheme = () => useContext(ThemeContext);

const THEME_KEY = '@caderneta:theme_mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<'light' | 'dark' | 'auto'>('auto');
  const [isLoading, setIsLoading] = useState(true);

  // Determina se está escuro baseado no modo
  const isDark = themeMode === 'auto' 
    ? systemColorScheme === 'dark' 
    : themeMode === 'dark';

  const colors = isDark ? darkColors : lightColors;

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_KEY);
      if (savedTheme) {
        setThemeModeState(savedTheme as 'light' | 'dark' | 'auto');
      }
    } catch (error) {
      console.error('Erro ao carregar tema:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setThemeMode = async (mode: 'light' | 'dark' | 'auto') => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_KEY, mode);
    } catch (error) {
      console.error('Erro ao salvar tema:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        colors,
        toggleTheme,
        setThemeMode,
        themeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}