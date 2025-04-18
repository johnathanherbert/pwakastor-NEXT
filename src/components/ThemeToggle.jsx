'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { useEffect } from 'react';
import { HiSun, HiMoon } from 'react-icons/hi';

export default function ThemeToggle() {
  const { darkMode, toggleDarkMode, mounted } = useTheme();

  // Se o componente não foi montado, retorna null para evitar renderizações inconsistentes
  if (!mounted) return null;

  return (
    <button
      onClick={toggleDarkMode}
      className={`p-2 rounded-lg transition-colors ${
        darkMode 
          ? 'bg-gray-700 hover:bg-gray-600 text-yellow-300' 
          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
      } shadow-sm`}
      title={darkMode ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      aria-label={darkMode ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
    >
      {darkMode ? (
        <HiSun className="h-5 w-5" />
      ) : (
        <HiMoon className="h-5 w-5" />
      )}
    </button>
  );
}