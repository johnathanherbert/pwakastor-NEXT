'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { useEffect } from 'react';
import { useState } from 'react';
import UpdateNotification from '../components/UpdateNotification';
import AdminMessages from '../components/AdminMessages';
import useAppUpdate from '../hooks/useAppUpdate';
import ToastContainer from '../components/Toast/ToastContainer';

const inter = Inter({ subsets: ['latin'] });

// Removed metadata export as it can't be used with 'use client'

export default function RootLayout({ children }) {
  const { hasUpdate } = useAppUpdate(5); // Verifica atualizações a cada 5 minutos
  
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
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.backgroundColor = '';
        document.body.style.backgroundColor = '';
      }
    } catch (e) {
      console.error('Error in dark mode initialization script:', e);
    }
  }, []);

  return (
    <html lang="en" suppressHydrationWarning className={`h-full ${inter.className}`}>
      <body className="h-full">
        <Providers>
          {children}
          <UpdateNotification hasUpdate={hasUpdate} />
          <AdminMessages />
        </Providers>
        {/* Global ToastContainer that will be used by all pages */}
        <ToastContainer />
      </body>
    </html>
  );
}
