"use client";
import React from "react";
import { MagnifyingGlassIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

export default function SearchBar({ searchTerm, setSearchTerm, loading, onSearch, onKeyPress }) {
  return (
    <div className="fixed top-16 left-0 right-0 bg-white dark:bg-gray-800/95 border-b dark:border-gray-700/50 z-40 backdrop-blur-sm transition-all duration-200">
      <div className="h-12 px-6 flex items-center justify-between">
        {/* Campo de busca */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={onKeyPress}
              placeholder="Digite o código do material..."
              className="w-56 px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                       placeholder-gray-500 dark:placeholder-gray-400
                       text-xs font-medium"
            />
            <MagnifyingGlassIcon className="h-3.5 w-3.5 absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <button
            onClick={onSearch}
            disabled={loading}
            className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg 
                     hover:from-blue-700 hover:to-blue-600
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 font-medium
                     shadow-md hover:shadow-lg text-xs min-w-[60px] h-[30px]
                     flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <MagnifyingGlassIcon className="h-3.5 w-3.5" />
            )}
            <span>Buscar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
