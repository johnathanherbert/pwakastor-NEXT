'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { useEffect, useState } from 'react';
import { HiSun, HiMoon } from 'react-icons/hi';
import { Button } from 'flowbite-react';

export default function ThemeToggle() {
  const { darkMode, toggleDarkMode, mounted } = useTheme();

  if (!mounted) return null;

  return (
    <Button
      color={darkMode ? 'light' : 'dark'}
      onClick={toggleDarkMode}
      size="sm"
      className="rounded-full p-2"
      title={darkMode ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
    >
      {darkMode ? (
        <HiSun className="h-5 w-5" />
      ) : (
        <HiMoon className="h-5 w-5" />
      )}
    </Button>
  );
}