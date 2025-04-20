import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../supabaseClient";
import { useTheme } from "next-themes";
import { UserCircleIcon, ArrowRightOnRectangleIcon, SunIcon, MoonIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";

export default function UserMenu({ user, onUserUpdate, onSignOut }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Aguarda a montagem do componente para evitar problemas de hidratação
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    if (onSignOut) {
      onSignOut();
    } else {
      await supabase.auth.signOut();
      if (onUserUpdate) onUserUpdate(null);
      router.push("/login");
    }
  };

  const handleDarkModeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Fecha o menu quando clica fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // If no user is provided, try to get one from supabase
  useEffect(() => {
    if (!user) {
      const getUser = async () => {
        const { data } = await supabase.auth.getUser();
        if (data?.user && onUserUpdate) {
          onUserUpdate(data.user);
        }
      };
      getUser();
    }
  }, [user, onUserUpdate]);

  // Placeholder skeleton enquanto carrega
  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <div className="skeleton w-24 h-4"></div>
        <div className="skeleton w-8 h-8 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden md:inline-block">
          {user?.email ? user.email.split('@')[0] : "Usuário"}
        </span>
        <button
          onClick={handleMenu}
          className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/70 transition-colors border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          aria-label="Menu do usuário"
        >
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user?.email || "Usuário"}
              className="w-7 h-7 rounded-full object-cover"
            />
          ) : (
            <span className="text-brand-600 dark:text-brand-400 text-sm font-medium">
              {user?.email?.[0]?.toUpperCase() || <UserCircleIcon className="h-5 w-5" />}
            </span>
          )}

          {/* Indicador de status online */}
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-jade-500 border-2 border-white dark:border-gray-800"></div>
        </button>
      </div>

      {/* Dropdown Menu melhorado */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 glassmorphism shadow-dropdown">
          {/* Cabeçalho do menu */}
          <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/30">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 dark:from-brand-500 dark:to-brand-700 flex items-center justify-center text-white font-medium">
                {user?.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {user?.email || "Usuário"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.user_metadata?.role || "Usuário"}
                </p>
              </div>
            </div>
          </div>
          
          {/* Itens do menu */}
          <div className="py-1">
            <button
              onClick={handleDarkModeToggle}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50"
            >
              {theme === 'dark' ? (
                <>
                  <SunIcon className="h-4 w-4 mr-3 text-amber-500" />
                  Modo Claro
                </>
              ) : (
                <>
                  <MoonIcon className="h-4 w-4 mr-3 text-indigo-500" />
                  Modo Escuro
                </>
              )}
            </button>
            
            <button
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50"
            >
              <Cog6ToothIcon className="h-4 w-4 mr-3 text-gray-500" />
              Preferências
            </button>
            
            <div className="h-px bg-gray-200/70 dark:bg-gray-700/30 my-1"></div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
