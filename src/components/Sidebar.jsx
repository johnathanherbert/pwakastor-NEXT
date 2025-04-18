import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "../supabaseClient";
import {
  HomeIcon,
  TruckIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  BuildingStorefrontIcon,
  ArchiveBoxIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  XMarkIcon,
  BeakerIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

export default function Sidebar({ open, onClose }) {
  const pathname = usePathname();
  
  const navigation = [
    { name: "Pesagem", href: "/", icon: HomeIcon, description: "Gestão de ordens de produção e materiais" },
    { name: "Devolução", href: "/devolucao", icon: TruckIcon, description: "Gerenciar devoluções de materiais" },
    { name: "Gestão", href: "/gestao", icon: ClipboardDocumentListIcon, description: "Controle de armazenamento" },
    { name: "Aging", href: "/aging", icon: ChartBarIcon, description: "Acompanhamento de envelhecimento" },
    { 
      name: "Almoxarifado", 
      href: "/almoxarifado/nts", 
      icon: BuildingStorefrontIcon,
      description: "Gestão de inventário e notas técnicas"
    },
    //{ name: "Alocação", href: "/alocacao-mobile", icon: BeakerIcon, description: "Alocação de materiais em vagas" },
    { name: "Inventário", href: "", icon: ArchiveBoxIcon, description: "Controle e balanço de inventário" },
    { name: "Usuários", href: "", icon: UserGroupIcon, description: "Gerenciamento de usuários" },
    { name: "Administração", href: "", icon: ShieldCheckIcon, description: "Configurações administrativas" },
    { name: "Configurações", href: "", icon: Cog6ToothIcon, description: "Configurações do sistema" },
  ];

  const isActive = (path) => {
    return pathname === path;
  };

  return (
    <div>
      {/* Backdrop overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-800/95 transform transition-transform duration-300 ease-in-out shadow-xl dark:shadow-gray-900/30 backdrop-blur-sm ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200 dark:border-gray-700/50">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 7h-9m9 10h-9m9-5h-9M7 7v10l-2-2" />
                </svg>
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-gray-100">pwakastor</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Sistema de Gestão</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700/50 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <div className="space-y-1">
              {navigation.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href || "#"}
                    className={`flex items-center px-4 py-2.5 rounded-lg transition-all duration-200 group relative ${
                      active
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm"
                        : item.href
                        ? "hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200"
                        : "opacity-60 cursor-not-allowed text-gray-500 dark:text-gray-400"
                    }`}
                    onClick={(e) => {
                      if (!item.href) e.preventDefault();
                    }}
                  >
                    <div className="flex items-center">
                      <span
                        className={`flex-shrink-0 ${
                          active
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        <item.icon className={`h-5 w-5 ${active ? "" : "group-hover:text-gray-700 dark:group-hover:text-gray-300"}`} />
                      </span>
                      <span className="ml-3 font-medium text-sm">{item.name}</span>
                    </div>
                    
                    {/* Tooltip com descrição */}
                    {item.description && (
                      <div className="absolute left-full ml-2 transform -translate-y-1/2 top-1/2 z-50 hidden group-hover:block">
                        <div className="bg-gray-800 dark:bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                          {item.description}
                        </div>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700/50 space-y-4">
            <div className="text-xs text-center text-gray-500 dark:text-gray-400">
              <div className="flex items-center justify-center mb-1.5 font-medium">
                <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse mr-1.5"></div>
                Sistema Ativo
              </div>
              <p>v0.1.0 • Sistema de Gerenciamento</p>
              <p>Desenvolvido por Johnathan Herbert</p>
            </div>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/login";
              }}
              className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow"
            >
              Encerrar Sessão
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
