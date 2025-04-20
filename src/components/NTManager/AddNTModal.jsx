import { useState, useRef, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { XMarkIcon, PlusIcon, TrashIcon, ClipboardDocumentIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { showToast } from '../../components/Toast/ToastContainer';

export default function AddNTModal({ isOpen, onClose, onNTAdded }) {
  const [ntNumber, setNtNumber] = useState('');
  const [items, setItems] = useState([{ 
    codigo: '', 
    descricao: '', 
    quantidade: '',
    item_number: 1
  }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(false);
  const modalRef = useRef(null);
  const firstInputRef = useRef(null);
  
  // Focus on first input when modal opens
  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      setTimeout(() => {
        firstInputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);
  
  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleAddItem = () => {
    setItems([
      ...items, 
      { 
        codigo: '', 
        descricao: '', 
        quantidade: '',
        item_number: items.length + 1
      }
    ]);
  };
  
  const handleRemoveItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    // Re-number the items
    newItems.forEach((item, i) => {
      item.item_number = i + 1;
    });
    setItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const processBulkText = () => {
    const lines = bulkText.trim().split('\n');
    const newItems = [];
    
    lines.forEach((line, index) => {
      // Skip empty lines
      if (!line.trim()) return;
      
      try {
        // First try with tab separation
        let parts;
        if (line.includes('\t')) {
          parts = line.split('\t');
          
          // Format: "code description quantity"
          if (parts.length === 3) {
            newItems.push({
              item_number: index + 1,
              codigo: parts[0],
              descricao: parts[1],
              quantidade: parts[2]
            });
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
            // We assume code is the first sequence of digits
            const codeMatch = beforeLastNumber.match(/^\d+/);
            
            if (codeMatch) {
              const code = codeMatch[0];
              const description = beforeLastNumber.substring(code.length).trim();
              
              newItems.push({
                item_number: index + 1,
                codigo: code,
                descricao: description,
                quantidade: quantity
              });
            }
          }
        }
      } catch (error) {
        console.error("Error processing line:", line, error);
      }
    });
    
    if (newItems.length > 0) {
      setItems(newItems);
      setShowBulkInput(false);
      setBulkText('');
      
      showToast(`${newItems.length} itens processados com sucesso`, 'success');
    } else {
      setError('Não foi possível processar o texto. Verifique o formato.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate form
    if (!ntNumber.trim()) {
      setError('Por favor, insira o número da NT.');
      return;
    }
    
    if (items.some(item => !item.codigo.trim() || !item.quantidade.trim())) {
      setError('Todos os itens devem ter pelo menos código e quantidade.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const now = new Date();
      const formattedDate = now.toLocaleDateString('pt-BR');
      const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      // First, insert the NT
      const { data: ntData, error: ntError } = await supabase
        .from('nts')
        .insert([
          {
            nt_number: ntNumber,
            created_date: formattedDate,
            created_time: formattedTime,
            status: 'Aberto'
          }
        ])
        .select();
      
      if (ntError) throw ntError;
      
      const ntId = ntData[0].id;

      // Add a flag to indicate this is a new NT with items
      localStorage.setItem('new_nt_with_items', ntId);
      
      // Then, insert all the items
      const itemsToInsert = items.map(item => ({
        nt_id: ntId,
        item_number: item.item_number,
        code: item.codigo,
        description: item.descricao || '-',
        quantity: item.quantidade,
        created_date: formattedDate,
        created_time: formattedTime,
        status: 'Ag. Pagamento'
      }));
      
      const { error: itemsError } = await supabase
        .from('nt_items')
        .insert(itemsToInsert);
      
      if (itemsError) throw itemsError;
      
      // Show a single toast with the NT number and number of items
      showToast(
        `NT ${ntNumber} criada com ${items.length} ${items.length === 1 ? 'item' : 'itens'}`,
        'success',
        5000
      );
      
      // Reset form
      setNtNumber('');
      setItems([{ codigo: '', descricao: '', quantidade: '', item_number: 1 }]);
      
      // Notificar o componente pai que a operação foi concluída
      // A UI será atualizada automaticamente via listener em tempo real
      onNTAdded();
      
    } catch (error) {
      console.error('Error adding NT:', error);
      setError('Erro ao adicionar NT. Por favor, tente novamente.');
      
      // Clear the flag if there's an error
      localStorage.removeItem('new_nt_with_items');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm opacity-100 transition-opacity duration-300" onClick={onClose}></div>
      
      <div 
        ref={modalRef}
        className="relative bg-white dark:bg-gray-800/95 rounded-xl shadow-xl w-full max-w-3xl border border-gray-200/50 dark:border-gray-700/30 opacity-100 transform-gpu scale-100 transition-all duration-300 animate-fade-scale-in"
      >
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <PlusIcon className="h-4 w-4" />
            </span>
            Adicionar Nova NT
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
            aria-label="Fechar"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-700/50 flex items-start gap-2">
              <svg className="h-5 w-5 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          <div className="mb-6">
            <label htmlFor="nt-number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Número da NT
            </label>
            <input
              ref={firstInputRef}
              type="text"
              id="nt-number"
              value={ntNumber}
              onChange={(e) => setNtNumber(e.target.value)}
              placeholder="Ex: 604560"
              className="w-full px-3.5 py-2.5 
                bg-white dark:bg-gray-700
                border border-gray-200 dark:border-gray-600 
                rounded-lg text-gray-900 dark:text-gray-100
                placeholder-gray-400 dark:placeholder-gray-400
                focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
                focus:border-transparent transition-colors
                shadow-sm"
            />
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                Itens da NT
                <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs font-medium px-2 py-0.5 rounded-full">
                  {items.length} {items.length === 1 ? 'item' : 'itens'}
                </span>
              </h4>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkInput(!showBulkInput)}
                  className="px-3 py-1.5 text-xs font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 
                          rounded-md hover:bg-purple-100 dark:hover:bg-purple-800/40 transition-colors shadow-sm 
                          border border-purple-200/50 dark:border-purple-700/30 flex items-center gap-1.5
                          focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
                >
                  <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                  {showBulkInput ? 'Voltar para Formulário' : 'Colar Lista'}
                </button>
                {!showBulkInput && (
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-3 py-1.5 text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400
                            rounded-md hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors shadow-sm
                            border border-blue-200/50 dark:border-blue-700/30 flex items-center gap-1.5
                            focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                    Adicionar Item
                  </button>
                )}
              </div>
            </div>
            
            {showBulkInput ? (
              <div className="mb-4 animate-fade-in">
                <div className="mb-3 bg-gray-50/80 dark:bg-gray-800/50 rounded-lg border border-gray-200/70 dark:border-gray-700/30 p-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">
                      Cole a lista de itens abaixo
                    </label>
                    <span className="text-xs text-blue-500 dark:text-blue-400">
                      Formato: código [tab] descrição [tab] quantidade
                    </span>
                  </div>
                  <textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder="010228&#9;DIOXIDO TITANIO&#9;24
010241&#9;EDTA DISSODICO DIH(EDETATO DE SODIO)&#9;10
010018&#9;ACIDO CITRICO ANIDRO&#9;14"
                    className="w-full px-3.5 py-2.5 h-48 
                      bg-white dark:bg-gray-700
                      border border-gray-200 dark:border-gray-600 
                      rounded-lg text-gray-900 dark:text-gray-100
                      placeholder-gray-400 dark:placeholder-gray-400
                      focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
                      focus:border-transparent transition-colors text-sm
                      font-mono shadow-sm"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Dica: cole diretamente do Excel ou planilhas
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Exemplo: 010228 DIOXIDO TITANIO 24
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={processBulkText}
                  disabled={!bulkText.trim()}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 
                          transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800
                          flex items-center justify-center gap-2"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  Processar Lista
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                {items.map((item, index) => (
                  <div 
                    key={index} 
                    className="bg-gray-50/80 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200/70 dark:border-gray-700/30 shadow-sm hover:shadow-md transition-all duration-200 transform-gpu animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-medium">
                          {item.item_number}
                        </span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Item #{item.item_number}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                        disabled={items.length === 1}
                        title="Remover item"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-6 gap-3">
                      <div className="col-span-1">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Código
                        </label>
                        <input
                          type="text"
                          value={item.codigo}
                          onChange={(e) => handleItemChange(index, 'codigo', e.target.value)}
                          placeholder="Ex: 10228"
                          className="w-full px-3 py-2 
                            bg-white dark:bg-gray-700
                            border border-gray-200 dark:border-gray-600 
                            rounded-lg text-gray-900 dark:text-gray-100
                            placeholder-gray-400 dark:placeholder-gray-400
                            focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
                            focus:border-transparent transition-colors text-sm"
                        />
                      </div>
                      <div className="col-span-4">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Descrição do Material
                        </label>
                        <input
                          type="text"
                          value={item.descricao}
                          onChange={(e) => handleItemChange(index, 'descricao', e.target.value)}
                          placeholder="Ex: DIOXIDO TITANIO"
                          className="w-full px-3 py-2 
                            bg-white dark:bg-gray-700
                            border border-gray-200 dark:border-gray-600 
                            rounded-lg text-gray-900 dark:text-gray-100
                            placeholder-gray-400 dark:placeholder-gray-400
                            focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
                            focus:border-transparent transition-colors text-sm"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Quantidade
                        </label>
                        <input
                          type="text"
                          value={item.quantidade}
                          onChange={(e) => handleItemChange(index, 'quantidade', e.target.value)}
                          placeholder="Ex: 24"
                          className="w-full px-3 py-2 
                            bg-white dark:bg-gray-700
                            border border-gray-200 dark:border-gray-600 
                            rounded-lg text-gray-900 dark:text-gray-100
                            placeholder-gray-400 dark:placeholder-gray-400
                            focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
                            focus:border-transparent transition-colors text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3 mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                      bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                      rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700/80 transition-colors
                      focus:outline-none focus:ring-2 focus:ring-gray-400/50 dark:focus:ring-gray-600/50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 
                      rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors 
                      disabled:opacity-50 disabled:cursor-not-allowed shadow-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent border-white mr-2"></div>
                  Salvando...
                </div>
              ) : (
                'Salvar NT'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
