'use client';

import './globals.css';
import { Providers } from './providers';
import { useEffect } from 'react';

export default function RootLayout({ children }) {
  // Script para dark mode executado no lado do cliente para evitar problemas de hidratação
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      const savedDarkMode = localStorage.getItem('darkMode');
      
      if (
        savedTheme === 'dark' || 
        (savedTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) ||
        (savedDarkMode && JSON.parse(savedDarkMode))
      ) {
        document.documentElement.classList.add('dark');
        document.documentElement.style.backgroundColor = '#111827';
        document.body.style.backgroundColor = '#111827';
      }
    } catch (e) {
      console.error('Error in dark mode initialization script:', e);
    }
  }, []);

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <title>PWA Kastor - Sistema de Gestão Hospitalar</title>
        <meta name="description" content="Sistema integrado para gestão de materiais e processos hospitalares" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        
        {/* SEO e compartilhamento */}
        <meta name="author" content="Johnathan Herbert" />
        <meta property="og:title" content="PWA Kastor - Sistema de Gestão Hospitalar" />
        <meta property="og:description" content="Sistema integrado para gestão de materiais e processos hospitalares" />
        <meta property="og:type" content="website" />
        
        {/* PWA */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Fontes otimizadas */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen antialiased font-inter">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
