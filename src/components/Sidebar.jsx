import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  XMarkIcon, 
  HomeIcon, 
  ClockIcon, 
  DocumentChartBarIcon,
  CubeIcon,
  ArchiveBoxIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  TruckIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  BuildingStorefrontIcon
} from "@heroicons/react/24/outline";
import { supabase } from "../supabaseClient";

export default function Sidebar({ open, onClose }) {
  const pathname = usePathname();
  
  const navigation = [
    { name: "Pesagem", href: "/", icon: HomeIcon },
    { name: "Devolução", href: "/devolucao", icon: TruckIcon },
    { name: "Gestão", href: "/gestao", icon: ClipboardDocumentListIcon },
    { name: "Aging", href: "/aging", icon: ChartBarIcon },
    { 
      name: "Almoxarifado", 
      href: "/almoxarifado/nts", 
      icon: BuildingStorefrontIcon 
    },
    { name: "Inventário", href: "", icon: ArchiveBoxIcon },
    { name: "Usuários", href: "", icon: UserGroupIcon },
    { name: "Configurações", href: "", icon: Cog6ToothIcon },
  ];

  const isActive = (path) => {
    return pathname === path;
  };

  return (
    <div>
      {/* Backdrop overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 transition-all duration-300"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar drawer */}
      <div 
        className={`fixed top-0 left-0 z-50 h-screen w-72 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 h-16 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <img 
              src="/pwakastor-logo.svg" 
              alt="PWA Kastor" 
              className="h-8 w-auto"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://placehold.co/100x40?text=PWA+Kastor";
              }}
            />
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-6">
          <ul className="space-y-1">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center px-3 py-2.5 rounded-lg font-medium transition-colors group ${
                    isActive(item.href)
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                  }`}
                  onClick={onClose}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActive(item.href)
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                    }`}
                  />
                  <span>{item.name}</span>
                  {isActive(item.href) && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400"></span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="px-3 py-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 mb-4">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <p className="font-medium mb-1">PWA Kastor</p>
              <p>v0.1.0 • Sistema de Gerenciamento</p>
              <p>Desenvolvido por Johnathan Herbert</p>
            </div>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/login";
            }}
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            Sair do Sistema
          </button>
        </div>
      </div>
    </div>
  );
}
