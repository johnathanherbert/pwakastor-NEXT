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

  // Inicializa o tema com base no localStorage durante a montagem do componente
  useEffect(() => {
    // Tenta obter a preferência do tema do localStorage
    try {
      const savedTheme = localStorage.getItem('theme');
      const savedDarkMode = localStorage.getItem('darkMode');
      
      if (savedTheme) {
        // Se há um tema salvo explicitamente, use-o
        setTheme(savedTheme);
      } else if (savedDarkMode !== null) {
        // Compatibilidade com o formato anterior que usava "darkMode" booleano
        const isDark = JSON.parse(savedDarkMode);
        setTheme(isDark ? 'dark' : 'light');
      }
      
      // Aplica a classe 'dark' ao body antes mesmo da hidratação completa
      if ((savedTheme === 'dark') || 
          (savedTheme === 'system' && systemTheme === 'dark') ||
          (savedTheme === undefined && savedDarkMode && JSON.parse(savedDarkMode))) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('bg-gray-900');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('bg-gray-900');
      }
    } catch (error) {
      console.error('Erro ao carregar tema do localStorage:', error);
    }
    
    setMounted(true);
  }, []);
  // Efeito para atualizar as classes CSS quando o tema muda
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.backgroundColor = '#111827';
      document.body.style.backgroundColor = '#111827';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.backgroundColor = '#f9fafb';
      document.body.style.backgroundColor = '#f9fafb';
    }
  }, [isDarkMode]);

  // Função para alternar entre os temas
  const toggleDarkMode = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Salva a nova configuração no localStorage de duas formas para compatibilidade
    localStorage.setItem('theme', newTheme);
    localStorage.setItem('darkMode', JSON.stringify(newTheme === 'dark'));
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