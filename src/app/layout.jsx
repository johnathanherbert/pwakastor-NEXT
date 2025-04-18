'use client';

import './globals.css';
import { Providers } from './providers';

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Script para evitar o flash de tela branca em dark mode */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('theme');
                  var savedDarkMode = localStorage.getItem('darkMode');
                  
                  if (
                    savedTheme === 'dark' || 
                    (savedTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) ||
                    (savedDarkMode && JSON.parse(savedDarkMode))
                  ) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.backgroundColor = '#111827'; // bg-gray-900
                    document.body.style.backgroundColor = '#111827'; // bg-gray-900
                  }
                } catch (e) {
                  console.error('Error in dark mode initialization script:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
