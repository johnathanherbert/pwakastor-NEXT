// filepath: c:\Users\johna\OneDrive\Documentos\development\pwakastor-NEXT\src\app\configuracao\layout.jsx
"use client";

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

export default function ConfiguracaoLayout({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar 
          drawerOpen={drawerOpen}
          setDrawerOpen={setDrawerOpen}
          openDialog={openDialog}
          setOpenDialog={setOpenDialog}
          title="Configurações"
        />
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}