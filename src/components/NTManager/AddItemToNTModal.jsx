import { useState, useEffect } from 'react';
import { XMarkIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../supabaseClient';

export default function AddItemToNTModal({ isOpen, onClose, onAddItem, nt }) {
  const [item, setItem] = useState({
    codigo: '',
    descricao: '',
    quantidade: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [bulkText, setBulkText] = useState('');
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setItem({
        codigo: '',
        descricao: '',
        quantidade: ''
      });
      setBulkText('');
      setShowBulkInput(false);
      setError('');
    }
  }, [isOpen]);
  
  const handleChange = (field, value) => {
    setItem(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Process a pasted line similar to AddNTModal
  const processBulkText = () => {
    const line = bulkText.trim();
    
    // Skip empty lines
    if (!line) {
      setError('Por favor, insira algum texto.');
      return;
    }
    
    try {
      // First try with tab separation
      let parts;
      if (line.includes('\t')) {
        parts = line.split('\t');
        
        // Format could be: "code description quantity" or "item_number code description quantity"
        if (parts.length === 3) {
          const newItem = {
            codigo: parts[0],
            descricao: parts[1],
            quantidade: parts[2]
          };
          setItem(newItem);
          setShowBulkInput(false);
          setBulkText('');
          return;
        } else if (parts.length === 4) {
          // If there are 4 parts, assume first part is item number which we can ignore
          const newItem = {
            codigo: parts[1],
            descricao: parts[2],
            quantidade: parts[3]
          };
          setItem(newItem);
          setShowBulkInput(false);
          setBulkText('');
          return;
        }
      }
      
      // If no tabs or if tab parsing failed, try space-based parsing
      const trimmedLine = line.trim();
      
      // Try to detect the format by looking at patterns
      if (/^\d+\s+\S+/.test(trimmedLine)) {
        // Find the position of the last number in the string
        const lastNumberMatch = trimmedLine.match(/\s+\d+\s*$/);
        
        if (lastNumberMatch) {
          const lastNumberPos = trimmedLine.lastIndexOf(lastNumberMatch[0]);
          const beforeLastNumber = trimmedLine.substring(0, lastNumberPos);
          const quantity = lastNumberMatch[0].trim();
          
          // Now find where the code ends and description begins
          const parts = beforeLastNumber.trim().split(/\s+/);
          
          if (parts.length >= 2) {
            // Check if first part might be an item number (1-3 digits)
            let code, description;
            
            if (/^\d{1,3}$/.test(parts[0]) && parts.length >= 3) {
              // First part looks like an item number, so code is the second part
              code = parts[1];
              description = parts.slice(2).join(' ');
            } else {
              // First part is the code
              code = parts[0];
              description = parts.slice(1).join(' ');
            }
            
            const newItem = {
              codigo: code,
              descricao: description,
              quantidade: quantity
            };
            
            setItem(newItem);
            setShowBulkInput(false);
            setBulkText('');
            return;
          }
        }
      }
      
      // If we get here, parsing failed
      setError('Não foi possível processar o texto. Verifique o formato.');
    } catch (error) {
      console.error("Error processing line:", error);
      setError('Erro ao processar o texto. Verifique o formato.');
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    // Validate form
    if (!item.codigo.trim() || !item.quantidade.trim()) {
      setError('Código e quantidade são obrigatórios.');
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Call parent handler - this will handle the UI update
      await onAddItem(item);
      // The modal will be closed by the parent component
    } catch (error) {
      console.error('Error adding item:', error);
      setError('Ocorreu um erro ao adicionar o item. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
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
            
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {showBulkInput ? "Colar linha de item" : "Detalhes do item"}
              </h4>
              <button
                type="button"
                onClick={() => setShowBulkInput(!showBulkInput)}
                className="px-3 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-md hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors flex items-center gap-1"
              >
                <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                {showBulkInput ? 'Formulário padrão' : 'Colar linha'}
              </button>
            </div>
            
            {showBulkInput ? (
              <div className="mb-4">
                <div className="mb-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Cole a linha do item abaixo
                  </label>
                  <textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder="010228&#9;DIOXIDO TITANIO&#9;24"
                    className="w-full px-3 py-2 h-20 
                      bg-white dark:bg-gray-700
                      border border-gray-200 dark:border-gray-600 
                      rounded-lg text-gray-900 dark:text-gray-100
                      placeholder-gray-400 dark:placeholder-gray-400
                      focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
                      focus:border-transparent transition-colors text-sm
                      font-mono"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Formatos aceitos:
                  </p>
                  <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                    • código[tab]descrição[tab]quantidade
                  </p>
                  <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">
                    • item_num[tab]código[tab]descrição[tab]quantidade
                  </p>
                  <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">
                    • código descrição quantidade
                  </p>
                  <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">
                    • item_num código descrição quantidade
                  </p>
                </div>
                <button
                  type="button"
                  onClick={processBulkText}
                  className="px-3 py-2 text-sm bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  Processar Texto
                </button>
              </div>
            ) : (
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
            )}
            
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
                disabled={isSubmitting || showBulkInput}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Adicionando...
                  </div>
                ) : (
                  'Adicionar'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
