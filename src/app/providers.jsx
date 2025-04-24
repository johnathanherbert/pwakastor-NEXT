'use client';

import { NextUIProvider } from '@nextui-org/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Flowbite } from 'flowbite-react';
import { flowbiteTheme } from '@/theme/flowbite/theme';

export function Providers({ children }) {
  return (
    <NextUIProvider>
      <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
        <Flowbite theme={{ theme: flowbiteTheme }}>
          <ThemeProvider>
            <div className="min-h-screen theme-bg-main transition-colors duration-300">
              {children}
            </div>
          </ThemeProvider>
        </Flowbite>
      </NextThemesProvider>
    </NextUIProvider>
  );
}
