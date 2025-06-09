'use client';

import { useState, useEffect } from 'react';
import { ExclamationTriangleIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

export default function NTsPage() {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          window.open('https://agilework.vercel.app', '_blank');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleRedirect = () => {
    window.open('https://agilework.vercel.app', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
        {/* Warning Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-full">
            <ExclamationTriangleIcon className="w-16 h-16 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Funcionalidade Descontinuada
        </h1>

        {/* Subtitle */}
        <h2 className="text-xl text-gray-600 dark:text-gray-300 mb-6">
          Gerenciamento de NT
        </h2>

        {/* Message */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 mb-8">
          <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-4">
            O <strong>Gerenciamento de NT</strong> nesta versão foi descontinuado e migrado para uma nova plataforma mais moderna e eficiente.
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Para continuar utilizando esta funcionalidade, acesse a nova versão da ferramenta:
          </p>
        </div>

        {/* New Tool Link */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-center mb-4">
            <ArrowTopRightOnSquareIcon className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-2" />
            <span className="text-xl font-semibold text-blue-800 dark:text-blue-300">
              Nova Versão Disponível
            </span>
          </div>
          <a
            href="https://agilework.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-2xl font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200 underline decoration-2 underline-offset-4"
          >
            agilework.vercel.app
          </a>
        </div>

        {/* Redirect Button */}
        <div className="space-y-4">
          <button
            onClick={handleRedirect}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 text-lg"
          >
            <span>Acessar Nova Versão</span>
            <ArrowTopRightOnSquareIcon className="w-5 h-5" />
          </button>

          {/* Auto-redirect countdown */}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Redirecionamento automático em: <span className="font-bold text-blue-600 dark:text-blue-400">{countdown}s</span>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Esta migração visa melhorar a experiência do usuário e oferecer novas funcionalidades.
          </p>
        </div>
      </div>
    </div>
  );
}