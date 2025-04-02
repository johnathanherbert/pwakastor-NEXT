import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function AddItemToNTModal({ isOpen, onClose, onAddItem, nt }) {
  const [item, setItem] = useState({
    codigo: '',
    descricao: '',
    quantidade: ''
  });
  const [error, setError] = useState('');
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setItem({
        codigo: '',
        descricao: '',
        quantidade: ''
      });
      setError('');
    }
  }, [isOpen]);
  
  const handleChange = (field, value) => {
    setItem(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    // Validate form
    if (!item.codigo.trim() || !item.quantidade.trim()) {
      setError('Código e quantidade são obrigatórios.');
      return;
    }
    
    // Call parent handler
    onAddItem(item);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
        
        <div className="relative bg-white dark:bg-gray-800/95 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Adicionar Item à NT {nt.nt_number}
            </h3>
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <XMarkIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-md">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Código
                </label>
                <input
                  type="text"
                  value={item.codigo}
                  onChange={(e) => handleChange('codigo', e.target.value)}
                  placeholder="Ex: 010228"
                  className="w-full px-3 py-2 
                    bg-white dark:bg-gray-700
                    border border-gray-200 dark:border-gray-600 
                    rounded-lg text-gray-900 dark:text-gray-100
                    placeholder-gray-400 dark:placeholder-gray-400
                    focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
                    focus:border-transparent transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição do Material
                </label>
                <input
                  type="text"
                  value={item.descricao}
                  onChange={(e) => handleChange('descricao', e.target.value)}
                  placeholder="Ex: DIOXIDO TITANIO"
                  className="w-full px-3 py-2 
                    bg-white dark:bg-gray-700
                    border border-gray-200 dark:border-gray-600 
                    rounded-lg text-gray-900 dark:text-gray-100
                    placeholder-gray-400 dark:placeholder-gray-400
                    focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
                    focus:border-transparent transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantidade
                </label>
                <input
                  type="text"
                  value={item.quantidade}
                  onChange={(e) => handleChange('quantidade', e.target.value)}
                  placeholder="Ex: 24"
                  className="w-full px-3 py-2 
                    bg-white dark:bg-gray-700
                    border border-gray-200 dark:border-gray-600 
                    rounded-lg text-gray-900 dark:text-gray-100
                    placeholder-gray-400 dark:placeholder-gray-400
                    focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
                    focus:border-transparent transition-colors"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                Adicionar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
