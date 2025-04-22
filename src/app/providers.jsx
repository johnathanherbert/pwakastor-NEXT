'use client';

import { NextUIProvider } from '@nextui-org/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { Flowbite } from 'flowbite-react';
import { flowbiteTheme } from '@/theme/flowbite/theme';

export function Providers({ children }) {
  // Valores mock para demonstração - depois você deve obter estes valores da autenticação do usuário
  const userId = '123'; // Substituir pelo ID real do usuário logado
  const userEmail = 'usuario@exemplo.com'; // Substituir pelo email real do usuário logado
  const userName = 'Usuário Exemplo'; // Substituir pelo nome real do usuário logado

  return (
    <NextUIProvider>
      <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
        <Flowbite theme={{ theme: flowbiteTheme }}>
          <ThemeProvider>
            <ChatProvider userId={userId} userEmail={userEmail} userName={userName}>
              <div className="min-h-screen theme-bg-main transition-colors duration-300">
                {children}
              </div>
            </ChatProvider>
          </ThemeProvider>
        </Flowbite>
      </NextThemesProvider>
    </NextUIProvider>
  );
}
