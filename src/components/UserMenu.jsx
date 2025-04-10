import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../supabaseClient";
import { useTheme } from "next-themes";

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

  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700">
          {user?.email || "Usuário"}
        </span>
        <div className="w-8 h-8 rounded-full bg-gray-200"></div>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700 dark:text-gray-200">
          {user?.email || "Usuário"}
        </span>
        <button
          onClick={handleMenu}
          className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
        >
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user?.email || "Usuário"}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <span className="text-gray-600 text-sm font-medium">
              {user?.email?.[0]?.toUpperCase() || "U"}
            </span>
          )}
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-50">
          <button
            onClick={handleDarkModeToggle}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {theme === 'dark' ? "Modo Claro" : "Modo Escuro"}
          </button>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
