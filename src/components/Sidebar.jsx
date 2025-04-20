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
      {/* Backdrop overlay com blur aperfeiçoado */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ease-in-out"
          onClick={onClose}
        />
      )}

      {/* Sidebar com design aprimorado */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/90 dark:bg-gray-800/90 transform transition-transform duration-300 ease-in-out shadow-xl dark:shadow-gray-900/30 backdrop-blur-md border-r border-gray-200/50 dark:border-gray-700/30 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header com design moderno */}
          <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200/70 dark:border-gray-700/30">
            <div className="flex items-center space-x-2.5">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2 rounded-lg shadow-sm shadow-blue-500/20 dark:shadow-blue-500/10">
                <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 7h-9m9 10h-9m9-5h-9M7 7v10l-2-2" />
                </svg>
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-gray-100 flex items-center">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-400">PWA Kastor</span>
                  <span className="ml-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[9px] px-1 py-0.5 rounded-sm font-medium">BETA</span>
                </h2>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Sistema Integrado de Gestão</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400/30"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Nav Links com design moderno */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <div className="mb-4 px-3">
              <div className="bg-gray-100/80 dark:bg-gray-700/40 rounded-lg p-2">
                <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">NAVEGAÇÃO</p>
                <div className="relative h-1 w-16 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div className="absolute top-0 left-0 h-full w-2/3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="space-y-1 px-2">
              {navigation.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href || "#"}
                    className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                      active
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 shadow-sm border border-blue-100/70 dark:border-blue-800/20"
                        : item.href
                        ? "hover:bg-gray-100/70 dark:hover:bg-gray-700/30 text-gray-700 dark:text-gray-200"
                        : "opacity-60 cursor-not-allowed text-gray-500 dark:text-gray-400"
                    }`}
                    onClick={(e) => {
                      if (!item.href) e.preventDefault();
                    }}
                  >
                    <div className="flex items-center flex-1">
                      <span
                        className={`flex-shrink-0 ${
                          active
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        <item.icon className={`h-5 w-5 ${active ? "" : "group-hover:text-gray-700 dark:group-hover:text-gray-300"}`} />
                      </span>
                      <span className={`ml-3 font-medium text-sm ${active ? "font-semibold" : ""}`}>{item.name}</span>
                    </div>
                    
                    {/* Indicador de ativo */}
                    {active && (
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-1"></div>
                    )}
                    
                    {/* Tooltip com descrição aprimorado */}
                    {item.description && (
                      <div className="absolute left-full ml-3 transform -translate-y-1/2 top-1/2 z-50 hidden group-hover:block">
                        <div className="bg-gray-800 dark:bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded shadow-lg whitespace-nowrap before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-x-[6px] before:-translate-y-1/2 before:border-[6px] before:border-transparent before:border-r-gray-800 dark:before:border-r-gray-900">
                          {item.description}
                        </div>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer com design moderno */}
          <div className="p-4 border-t border-gray-200/70 dark:border-gray-700/30 space-y-4">
            <div className="text-xs text-center text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg p-2.5 shadow-sm border border-gray-100 dark:border-gray-700/50">
              <div className="flex items-center justify-center mb-1.5 font-medium">
                <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse mr-1.5 shadow-sm shadow-green-500/50"></div>
                Sistema Ativo
              </div>
              <p>v0.1.0 • {new Date().getFullYear()}</p>
              <p>Desenvolvido por Johnathan Herbert</p>
            </div>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/login";
              }}
              className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              Encerrar Sessão
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
