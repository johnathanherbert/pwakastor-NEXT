import { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { XMarkIcon, PlusIcon, TrashIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';

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
      
      // Reset form and close modal
      setNtNumber('');
      setItems([{ codigo: '', descricao: '', quantidade: '', item_number: 1 }]);
      onNTAdded();
      
    } catch (error) {
      console.error('Error adding NT:', error);
      setError('Erro ao adicionar NT. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
        
        <div className="relative bg-white dark:bg-gray-800/95 rounded-lg shadow-xl w-full max-w-3xl">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Adicionar Nova NT
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
            
            <div className="mb-6">
              <label htmlFor="nt-number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Número da NT
              </label>
              <input
                type="text"
                id="nt-number"
                value={ntNumber}
                onChange={(e) => setNtNumber(e.target.value)}
                placeholder="Ex: 604560"
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
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Itens da NT
                </h4>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBulkInput(!showBulkInput)}
                    className="px-3 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-md hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors flex items-center gap-1"
                  >
                    <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                    {showBulkInput ? 'Voltar para Formulário' : 'Colar Lista'}
                  </button>
                  {!showBulkInput && (
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1"
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                      Adicionar Item
                    </button>
                  )}
                </div>
              </div>
              
              {showBulkInput ? (
                <div className="mb-4">
                  <div className="mb-2">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Cole a lista de itens abaixo
                    </label>
                    <textarea
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      placeholder="010228&#9;DIOXIDO TITANIO&#9;24
010241&#9;EDTA DISSODICO DIH(EDETATO DE SODIO)&#9;10
010018&#9;ACIDO CITRICO ANIDRO&#9;14"
                      className="w-full px-3 py-2 h-48 
                        bg-white dark:bg-gray-700
                        border border-gray-200 dark:border-gray-600 
                        rounded-lg text-gray-900 dark:text-gray-100
                        placeholder-gray-400 dark:placeholder-gray-400
                        focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
                        focus:border-transparent transition-colors text-sm
                        font-mono"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Formato: código, descrição, quantidade
                    </p>
                    <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                      Exemplo: 010228 DIOXIDO TITANIO 24
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={processBulkText}
                    className="px-3 py-2 text-sm bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                  >
                    Processar Lista
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {items.map((item, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700/50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Item {item.item_number}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
                          disabled={items.length === 1}
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
                  'Salvar NT'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
