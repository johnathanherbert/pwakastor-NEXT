import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../supabaseClient";

export default function UserMenu({ user, onUserUpdate }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const router = useRouter();

  const handleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onUserUpdate(null);
    router.push("/login");
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

  return (
    <div className="relative" ref={menuRef}>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700 dark:text-gray-200">
          {user?.email}
        </span>
        <button
          onClick={handleMenu}
          className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
        >
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.email}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <span className="text-gray-600 text-sm font-medium">
              {user?.email?.[0]?.toUpperCase()}
            </span>
          )}
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-50">
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
