"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../supabaseClient";
import UserMenu from "./UserMenu";
import Sidebar from "./Sidebar";
import { Bars3Icon, CloudArrowUpIcon } from "@heroicons/react/24/outline";
import ExcelUploader from "./ExcelUploader";

export default function Topbar({ 
  user, 
  darkMode, 
  setDarkMode, 
  drawerOpen, 
  setDrawerOpen, 
  openDialog, 
  setOpenDialog, 
  handleDataUpdated,
  title = "Devolução de Materiais" // Default title if none provided
}) {
  const router = useRouter();

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
      {/* Navbar Superior Fixo */}
      <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800/95 border-b dark:border-gray-700/50 z-50 backdrop-blur-sm transition-all duration-200">
        <div className="h-16 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors duration-200"
            >
              <Bars3Icon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            </button>
            <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {setOpenDialog && ( // Only render if setOpenDialog prop is provided
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
                <span className="hidden sm:inline">Upload Excel</span>
              </button>
            )}
            <UserMenu 
              user={user} 
              darkMode={darkMode} 
              setDarkMode={setDarkMode}
              onSignOut={handleSignOut}
            />
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
