import { useState, useEffect } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export default function UpdateNotification({ hasUpdate }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Mostra a notificação com um pequeno atraso para evitar flashes em carregamentos rápidos
    if (hasUpdate) {
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, [hasUpdate]);

  if (!isVisible) return null;

  const handleUpdate = () => {
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up-fade">
      <div className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-3 rounded-lg shadow-lg flex items-center">
        <div className="mr-3 bg-white/20 rounded-full p-1.5">
          <ArrowPathIcon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-medium">Nova versão disponível</p>
          <p className="text-sm text-blue-100">Atualize para obter as últimas melhorias</p>
        </div>
        <button 
          onClick={handleUpdate}
          className="ml-3 px-3 py-1.5 bg-white text-blue-700 font-medium rounded-md hover:bg-blue-50 transition-colors"
        >
          Atualizar
        </button>
      </div>
    </div>
  );
}