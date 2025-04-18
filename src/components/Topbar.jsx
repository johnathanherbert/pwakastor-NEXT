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
      {/* Navbar Superior Fixo com efeito de vidro*/}
      <nav className="fixed top-0 left-0 right-0 glassmorphism border-b dark:border-gray-700/50 z-50 transition-all duration-200">
        <div className="h-16 px-4 md:px-6 flex items-center justify-between">
          {/* Logo e Título */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors duration-200"
              aria-label="Menu principal"
            >
              <Bars3Icon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            </button>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400 dark:from-blue-400 dark:to-blue-300">
                {title}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                {new Date().toLocaleDateString('pt-BR', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              {setOpenDialog && ( 
                <button
                  onClick={() => setOpenDialog(true)}
                  className="inline-flex items-center justify-center p-1.5 sm:px-3 sm:py-1.5 text-xs
                     text-purple-600 dark:text-purple-400 
                     bg-purple-50 dark:bg-purple-900/30 
                     hover:bg-purple-100 dark:hover:bg-purple-900/50 
                     border border-purple-200 dark:border-purple-700/50
                     rounded-lg transition-all duration-200
                     hover:shadow-md dark:hover:shadow-purple-900/20"
                  title="Upload Excel"
                >
                  <CloudArrowUpIcon className="w-4 h-4 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Upload</span>
                </button>
              )}
              
              {onUploadClick && (
                <button
                  onClick={onUploadClick}
                  className="inline-flex items-center justify-center p-1.5 sm:px-3 sm:py-1.5 text-xs
                     text-blue-600 dark:text-blue-400 
                     bg-blue-50 dark:bg-blue-900/30 
                     hover:bg-blue-100 dark:hover:bg-blue-900/50 
                     border border-blue-200 dark:border-blue-700/50
                     rounded-lg transition-all duration-200
                     hover:shadow-md dark:hover:shadow-blue-900/20"
                  title="Upload XLS"
                >
                  <HiOutlineUpload className="w-4 h-4 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Upload XLS</span>
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <div className="bg-white/40 dark:bg-gray-800/40 rounded-lg p-1 backdrop-blur-sm border border-white/10 dark:border-gray-700/50 shadow-sm">
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
