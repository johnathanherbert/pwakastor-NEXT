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
  ArrowRightOnRectangleIcon,
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
      {/* Backdrop overlay com blur suave */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300 ease-in-out"
          onClick={onClose}
        />
      )}

      {/* Sidebar com design modernizado */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/95 dark:bg-gray-800/95 transform transition-transform duration-300 ease-in-out shadow-xl dark:shadow-gray-900/30 backdrop-blur-md border-r border-gray-200/50 dark:border-gray-700/30 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header com branding elevado */}
          <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200/70 dark:border-gray-700/30">
            <div className="flex items-center space-x-2.5">
              <div className="bg-gradient-to-br from-brand-500 to-brand-700 p-2 rounded-lg shadow-md shadow-brand-500/20 dark:shadow-brand-500/10">
                <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 7h-9m9 10h-9m9-5h-9M7 7v10l-2-2" />
                </svg>
              </div>
              <div>
                <h2 className="font-outfit font-bold text-gray-900 dark:text-gray-100 flex items-center">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-brand-800 dark:from-brand-500 dark:to-brand-300">PWA Kastor</span>
                  <span className="ml-1.5 bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 text-[9px] px-1.5 py-0.5 rounded font-medium leading-none">BETA</span>
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

          {/* Nav Links com design elevado */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin">
            <div className="mb-5 px-3">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100/70 dark:from-gray-800/40 dark:to-gray-700/20 rounded-lg p-3">
                <p className="text-[11px] uppercase font-medium text-gray-500 dark:text-gray-400 mb-1.5 tracking-wider">Navegação</p>
                <div className="relative h-0.5 w-16 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden mb-1">
                  <div className="absolute top-0 left-0 h-full w-2/3 bg-gradient-to-r from-brand-400 to-brand-600 rounded-full"></div>
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
                        ? "bg-gradient-to-r from-brand-50 to-brand-100/70 dark:from-brand-900/30 dark:to-brand-800/20 text-brand-700 dark:text-brand-300 shadow-sm border border-brand-100/70 dark:border-brand-800/20"
                        : item.href
                        ? "hover:bg-gray-50 dark:hover:bg-gray-700/30 text-gray-700 dark:text-gray-200"
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
                            ? "text-brand-600 dark:text-brand-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        <item.icon className={`h-5 w-5 ${active ? "" : "group-hover:text-gray-700 dark:group-hover:text-gray-300"}`} />
                      </span>
                      <span className={`ml-3 font-medium text-sm ${active ? "font-semibold" : ""}`}>{item.name}</span>
                    </div>
                    
                    {/* Indicador de item ativo */}
                    {active && (
                      <div className="h-2 w-2 rounded-full bg-brand-500 mr-1 shadow-sm shadow-brand-500/30"></div>
                    )}
                    
                    {/* Tooltip com descrição melhorado */}
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

          {/* Footer com design elevado */}
          <div className="p-4 border-t border-gray-200/70 dark:border-gray-700/30 space-y-4">
            <div className="glassmorphism-light p-3 text-xs text-center">
              <div className="flex items-center justify-center mb-2 font-medium">
                <div className="status-online"></div>
                Sistema Ativo
              </div>
              <p className="text-gray-600 dark:text-gray-400">v0.1.2 • {new Date().getFullYear()}</p>
              <p className="text-gray-500 dark:text-gray-500 text-[10px] mt-1">Desenvolvido por Johnathan Herbert</p>
            </div>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/login";
              }}
              className="btn-primary w-full py-2 flex items-center justify-center gap-2"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              <span>Encerrar Sessão</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
