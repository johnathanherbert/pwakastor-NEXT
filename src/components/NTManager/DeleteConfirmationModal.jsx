import { useState } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Loading from '../ui/Loading';

export default function DeleteConfirmationModal({ isOpen, onClose, onConfirm, type, item, nt }) {
  const [isDeleting, setIsDeleting] = useState(false);
  
  if (!isOpen) return null;
  
  const isNT = type === 'nt';
  
  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
        
        <div className="relative bg-white dark:bg-gray-800/95 rounded-lg shadow-xl w-full max-w-md">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
              Confirmação de Exclusão
            </h3>
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              disabled={isDeleting}
            >
              <XMarkIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col items-center mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2 text-center">
                {isNT ? `Excluir NT ${nt?.nt_number}?` : `Excluir item #${item?.item_number}?`}
              </h3>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                {isNT 
                  ? `Esta ação excluirá permanentemente a NT ${nt?.nt_number} e todos os seus itens.` 
                  : `Esta ação excluirá permanentemente o item #${item?.item_number} (${item?.code}).`
                }
              </p>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-500 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <div className="flex items-center">
                    <Loading 
                      size="small" 
                      message="" 
                      logoVisible={false} 
                      className="min-h-0 bg-transparent"
                    />
                    <span className="ml-2">Excluindo...</span>
                  </div>
                ) : (
                  'Excluir'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
