"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../supabaseClient";
import UserMenu from "./UserMenu";
import Sidebar from "./Sidebar";
import { Bars3Icon } from "@heroicons/react/24/outline";

export default function Topbar({ user, darkMode, setDarkMode }) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

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
      <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800/95 border-b dark:border-gray-700/50 z-50 h-16 backdrop-blur-sm transition-all duration-200">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors duration-200"
            >
              <Bars3Icon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            </button>
            <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">
              Pesagem - Devolução de Materiais
            </h1>
          </div>

          {/* Menu do usuário */}
          <div className="flex items-center gap-4">
            <UserMenu 
              user={user} 
              darkMode={darkMode} 
              setDarkMode={setDarkMode}
              onSignOut={handleSignOut}
            />
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
