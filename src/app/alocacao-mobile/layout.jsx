"use client";

import { useTheme } from "@/contexts/ThemeContext";
import HeaderClock from "@/components/Clock/HeaderClock";
import { HiLocationMarker } from "react-icons/hi";
import ThemeToggle from "@/components/ThemeToggle";

export default function AlocacaoMobileLayout({ children }) {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <div className="min-h-screen theme-bg-main">
      {/* Header simplificado para mobile */}
      <header className="sticky top-0 z-10 theme-card-bg shadow-sm border-b theme-border-light px-4 py-3">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-blue-600 dark:text-blue-400 align-baseline flex items-center">  
          <HiLocationMarker/>
          Trackprod
          </h2>
          
          <div className="flex items-center">
            <HeaderClock />
            
            <ThemeToggle />
          </div>
        </div>
      </header>
      
      {/* Conteúdo da página */}
      <main className="pb-20">
        {children}
      </main>
      
      {/* Footer com navegação fixa para mobile */}
      <footer className="fixed bottom-0 left-0 right-0 theme-card-bg border-t theme-border-light shadow-lg p-3">
        <div className="flex justify-around">
          <a 
            href="/gestao" 
            className="flex flex-col items-center theme-text-tertiary hover:text-blue-600 dark:hover:text-blue-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-xs mt-1">Gestão</span>
          </a>
          
          <a 
            href="/alocacao-mobile" 
            className="flex flex-col items-center text-blue-600 dark:text-blue-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-xs mt-1">Alocar</span>
          </a>
          
          <a 
            href="/" 
            className="flex flex-col items-center theme-text-tertiary hover:text-blue-600 dark:hover:text-blue-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-1">Início</span>
          </a>
        </div>
      </footer>
    </div>
  );
}