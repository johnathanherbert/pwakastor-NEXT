'use client';

import { NextUIProvider } from '@nextui-org/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function Providers({ children }) {
  return (
    <NextUIProvider>
      <NextThemesProvider attribute="class" defaultTheme="light" enableSystem>
        <div className="min-h-screen dark:bg-gray-900 transition-colors">
          {children}
        </div>
      </NextThemesProvider>
    </NextUIProvider>
  );
}
