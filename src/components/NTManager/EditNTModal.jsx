import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function EditNTModal({ isOpen, onClose, onNTEdited, nt, ntItems }) {
  const [ntNumber, setNtNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Initialize form with NT data when modal opens or NT changes
  useEffect(() => {
    if (isOpen && nt) {
      console.log("EditNTModal opened with NT:", nt);
      setNtNumber(nt.nt_number || '');
      setError('');
    }
  }, [isOpen, nt]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate form
    if (!ntNumber.trim()) {
      setError('Por favor, insira o número da NT.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("Updating NT:", nt.id, "to number:", ntNumber);
      
      const { error } = await supabase
        .from('nts')
        .update({ nt_number: ntNumber })
        .eq('id', nt.id);
      
      if (error) throw error;
      
      console.log("NT updated successfully");
      onNTEdited();
    } catch (error) {
      console.error('Error updating NT:', error);
      setError('Erro ao atualizar NT. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Make sure modal renders only when isOpen is true
  if (!isOpen || !nt) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
        
        <div className="relative bg-white dark:bg-gray-800/95 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Editar NT
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
            
            <div className="mb-4">
              <label htmlFor="nt-number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Número da NT
              </label>
              <input
                type="text"
                id="nt-number"
                value={ntNumber}
                onChange={(e) => setNtNumber(e.target.value)}
                className="w-full px-3 py-2 
                  bg-white dark:bg-gray-700
                  border border-gray-200 dark:border-gray-600 
                  rounded-lg text-gray-900 dark:text-gray-100
                  placeholder-gray-400 dark:placeholder-gray-400
                  focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
                  focus:border-transparent transition-colors"
              />
            </div>

            <div className="mb-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Esta NT possui {ntItems.length} {ntItems.length === 1 ? 'item' : 'itens'}.
              </p>
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
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </div>
                ) : (
                  'Salvar Alterações'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
