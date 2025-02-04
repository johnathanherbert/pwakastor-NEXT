'use client'
import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import UserMenu from '@/components/UserMenu';
import { Bars3Icon } from "@heroicons/react/24/outline";

export default function DevolucaoLayout({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState(null);

  const toggleDrawer = (open) => (event) => {
    if (event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header/TopBar */}
      <header className="sticky top-0 z-30">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700/50">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleDrawer(true)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                <Bars3Icon className="h-5 w-5" />
              </button>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                Devolução de Materiais
              </span>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-2">
              <UserMenu user={user} onUserUpdate={setUser} />
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar open={drawerOpen} toggleDrawer={toggleDrawer} />

      {/* Main Content */}
      <main className="relative">
        {children}
      </main>
    </div>
  );
} 