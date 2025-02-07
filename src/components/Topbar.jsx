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
      <div className="sticky top-0 z-40 w-full backdrop-blur-sm">
        <div className="bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700">
          <div className="h-16 px-4 flex items-center justify-between">
            {/* Logo, título e botão do menu */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setDrawerOpen(true)}
                className="p-2 text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300
                       hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Bars3Icon className="w-6 h-6" />
              </button>
              <span className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                PWAKASTOR
              </span>
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
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
