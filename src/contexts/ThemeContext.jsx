'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useTheme as useNextTheme } from 'next-themes';

// Criando o contexto de tema
const ThemeContext = createContext();

// Hook personalizado para usar o tema
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};

// Provider do tema que será usado na aplicação
export function ThemeProvider({ children }) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, systemTheme } = useNextTheme();
  
  // Determina se está no modo escuro com base no tema atual
  const isDarkMode = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');

  // Marca o componente como montado após a renderização inicial
  useEffect(() => {
    setMounted(true);
  }, []);

  // Função para alternar entre os temas
  const toggleDarkMode = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Valor que será disponibilizado pelo contexto
  const value = {
    darkMode: isDarkMode,
    toggleDarkMode,
    theme,
    setTheme,
    mounted
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}