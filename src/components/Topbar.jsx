"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../supabaseClient";
import UserMenu from "./UserMenu";
import Sidebar from "./Sidebar";
import { Bars3Icon, CloudArrowUpIcon } from "@heroicons/react/24/outline";
import ExcelUploader from "./ExcelUploader";
import { HiOutlineUpload } from 'react-icons/hi';
import ThemeToggle from "./ThemeToggle";

export default function Topbar({ 
  user, 
  drawerOpen, 
  setDrawerOpen, 
  openDialog, 
  setOpenDialog, 
  handleDataUpdated,
  title = "Devolução de Materiais", // Default title if none provided
  onUploadClick // Add this prop
}) {
  const router = useRouter();

  // Check if current page is Devolucao
  const isDevolucaoPage = title === "Devolução de Materiais";

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <>
      {/* Navbar Superior Fixo com efeito de vidro aprimorado */}
      <nav className="fixed top-0 left-0 right-0 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/70 dark:border-gray-700/30 shadow-sm z-50 transition-all duration-300">
        <div className="h-16 px-4 md:px-6 flex items-center justify-between">
          {/* Logo e Título com design moderno */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="btn-icon-light"
              aria-label="Menu principal"
            >
              <Bars3Icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
            <div>
              <h1 className="heading-sm bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-brand-500 dark:from-brand-400 dark:to-brand-300">
                {title}
              </h1>
              <div className="flex items-center gap-1.5">
                <div className="status-online"></div>
                <p className="text-xs text-gray-600 dark:text-gray-400 hidden sm:block">
                  {new Date().toLocaleDateString('pt-BR', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Botões de Ação com design aprimorado */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              {setOpenDialog && ( 
                <button
                  onClick={() => setOpenDialog(true)}
                  className="btn-action bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 
                           border border-brand-200 dark:border-brand-800/50
                           hover:bg-brand-100 dark:hover:bg-brand-800/50 
                           shadow-sm hover:shadow active:scale-[0.98]
                           focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:focus:ring-brand-500/30"
                  title="Upload Excel"
                >
                  <CloudArrowUpIcon className="w-4 h-4 mr-1.5" />
                  <span className="text-sm">Upload</span>
                </button>
              )}
              
              {onUploadClick && (
                <button
                  onClick={onUploadClick}
                  className="btn-action bg-jade-50 dark:bg-jade-900/30 text-jade-700 dark:text-jade-300 
                           border border-jade-200 dark:border-jade-800/50
                           hover:bg-jade-100 dark:hover:bg-jade-800/50 
                           shadow-sm hover:shadow active:scale-[0.98]
                           focus:outline-none focus:ring-2 focus:ring-jade-500/40 dark:focus:ring-jade-500/30"
                  title="Upload XLS"
                >
                  <HiOutlineUpload className="w-4 h-4 mr-1.5" />
                  <span className="text-sm">Upload XLS</span>
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <div className="glassmorphism-light p-1 rounded-lg">
                <ThemeToggle />
              </div>
              
              <UserMenu 
                user={user} 
                onSignOut={handleSignOut}
                onUserUpdate={() => {}} 
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Espaçador para compensar a navbar fixa */}
      <div className="h-16"></div>

      {openDialog && setOpenDialog && (
        <ExcelUploader
          onDataUpdated={handleDataUpdated}
          openUploadDialog={openDialog}
          handleCloseUploadDialog={() => setOpenDialog(false)}
        />
      )}
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
