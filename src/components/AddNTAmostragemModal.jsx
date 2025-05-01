'use client';
import { useState, useEffect, useRef } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/supabaseClient';
import { showToast } from '@/components/Toast/ToastContainer';
import Modal from './Modal';

const AddNTAmostragemModal = ({ isOpen, onClose, onNTAdded }) => {
  // Referência para o primeiro input (usado para foco automático)
  const firstInputRef = useRef(null);
  const pasteAreaRef = useRef(null);

  // Estados para gerenciar o formulário
  const [ntNumber, setNtNumber] = useState('');
  const [items, setItems] = useState([
    { id: 1, code: '', description: '', quantity: '', batch: '' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [pasteContent, setPasteContent] = useState('');

  // Foco no primeiro input quando o modal é aberto
  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      setTimeout(() => {
        firstInputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  // Foco na área de colagem quando ela é exibida
  useEffect(() => {
    if (showPasteArea && pasteAreaRef.current) {
      setTimeout(() => {
        pasteAreaRef.current.focus();
      }, 100);
    }
  }, [showPasteArea]);

  // Resetar formulário quando o modal é fechado
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Funções para gerenciar itens
  const handleAddItem = () => {
    const newId = items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1;
    setItems([...items, { id: newId, code: '', description: '', quantity: '', batch: '' }]);
  };

  const handleRemoveItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    } else {
      showToast('A NT deve ter pelo menos um item', 'warning');
    }
  };

  const handleItemChange = (id, field, value) => {
    setItems(
      items.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  // Processar dados colados
  const processPastedData = () => {
    if (!pasteContent.trim()) {
      showToast('Por favor, cole algum conteúdo', 'warning');
      return;
    }

    try {
      // Dividir o conteúdo em linhas
      const lines = pasteContent.trim().split('\n');
      
      const newItems = [];
      let nextId = 1;
      
      lines.forEach(line => {
        // Ignora linhas vazias
        if (!line.trim()) return;
        
        // Primeiro tentamos dividir por tab, que é o mais comum quando se cola do Excel
        let parts = line.split('\t');
        
        // Se não funcionou bem (menos de 2 partes significativas), tentamos por espaço
        // Mas precisamos ser cuidadosos com descrições que contêm espaços
        if (parts.length < 2) {
          const spaceParts = line.trim().split(/\s+/);
          
          // Se temos pelo menos 3 partes ao dividir por espaço, podemos tentar processar
          if (spaceParts.length >= 3) {
            // Assumimos que o primeiro item é o código
            const code = spaceParts[0];
            
            // O último ou os dois últimos itens podem ser quantidade e lote
            // Verificamos se o penúltimo parece ser um número (pode ter vírgula decimal)
            let quantity = '1';
            let batch = '';
            let description = '';
            
            // Verifica se o penúltimo item parece ser um número (com , ou . como separador decimal)
            const potentialQuantity = spaceParts[spaceParts.length - 2];
            const isQuantity = /^\d+[,.]?\d*$/.test(potentialQuantity);
            
            if (isQuantity) {
              // Se o penúltimo elemento é um número, então é a quantidade
              quantity = potentialQuantity;
              batch = spaceParts[spaceParts.length - 1]; // O último é o lote
              // A descrição é tudo entre o código e a quantidade
              description = spaceParts.slice(1, spaceParts.length - 2).join(' ');
            } else {
              // Se não, assumimos que o último é o lote e definimos quantidade padrão
              batch = spaceParts[spaceParts.length - 1];
              // A descrição é tudo entre o código e o lote
              description = spaceParts.slice(1, spaceParts.length - 1).join(' ');
            }
            
            // Agora temos todas as partes extraídas do texto com espaços
            parts = [code, description, quantity, batch];
          }
        }
        
        // Se não funcionou, tentamos por ponto e vírgula (comum em CSV)
        if (parts.length < 2) {
          parts = line.split(';');
        }
        
        // Se ainda não funcionou, tentamos vírgula
        if (parts.length < 2) {
          parts = line.split(',');
        }
        
        // Se temos pelo menos 2 partes, consideramos uma linha válida
        if (parts.length >= 2) {
          // Extrair as partes, com valores padrão se necessário
          let [code, description, quantity = '1', batch = ''] = parts.map(p => p?.trim() || '');
          
          // Se a quantidade tem vírgula como separador decimal, substituir por ponto
          if (quantity && quantity.includes(',')) {
            quantity = quantity.replace(',', '.');
          }
          
          if (code && description) {
            newItems.push({
              id: nextId++,
              code,
              description,
              quantity: quantity || '1',
              batch: batch || code // Se não houver lote, usa o código como padrão
            });
          }
        }
      });
      
      if (newItems.length === 0) {
        showToast('Não foi possível identificar itens no conteúdo colado', 'error');
        return;
      }
      
      // Substituir os itens atuais pelos novos
      setItems(newItems);
      setShowPasteArea(false);
      setPasteContent('');
      showToast(`${newItems.length} item(ns) processado(s) com sucesso`, 'success');
    } catch (error) {
      console.error('Erro ao processar dados colados:', error);
      showToast('Erro ao processar o conteúdo colado', 'error');
    }
  };

  // Validar formulário
  const validateForm = () => {
    setError('');

    if (!ntNumber.trim()) {
      setError('O número da NT é obrigatório');
      return false;
    }

    for (const item of items) {
      if (!item.code.trim()) {
        setError('Todos os itens devem ter um código');
        return false;
      }
      if (!item.description.trim()) {
        setError('Todos os itens devem ter uma descrição');
        return false;
      }
      if (!item.quantity.trim() || isNaN(parseFloat(item.quantity)) || parseFloat(item.quantity) <= 0) {
        setError('Todos os itens devem ter uma quantidade válida');
        return false;
      }
      if (!item.batch.trim()) {
        setError('Todos os itens devem ter um lote');
        return false;
      }
    }

    return true;
  };

  // Resetar formulário
  const resetForm = () => {
    setNtNumber('');
    setItems([{ id: 1, code: '', description: '', quantity: '', batch: '' }]);
    setError('');
    setShowPasteArea(false);
    setPasteContent('');
  };

  // Submeter formulário
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const now = new Date();
      const formattedDate = now.toLocaleDateString('pt-BR');
      const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      // Criar a NT principal
      const { data: nt, error: ntError } = await supabase
        .from('nts_amostragem')
        .insert({
          nt_number: ntNumber,
          created_date: formattedDate,
          created_time: formattedTime,
          status: 'Ag. Amostragem'
        })
        .select('id')
        .single();

      if (ntError) throw ntError;

      // Criar os itens da NT
      const itemsToInsert = items.map((item, index) => ({
        nt_id: nt.id,
        item_number: index + 1, // Adicionando o campo item_number obrigatório
        code: item.code,
        description: item.description,
        quantity: parseFloat(item.quantity), // Usando parseFloat para preservar decimais
        batch: item.batch,
        created_date: formattedDate,
        created_time: formattedTime,
        status: 'Ag. Amostragem'
      }));

      const { error: itemsError } = await supabase
        .from('nts_amostragem_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      showToast('NT de amostragem criada com sucesso', 'success');
      
      if (onNTAdded) {
        onNTAdded();
      }
      
      resetForm();
      onClose();
    } catch (error) {
      console.error('Erro ao criar NT:', error);
      setError('Ocorreu um erro ao criar a NT. Por favor, tente novamente.');
      showToast('Erro ao criar NT', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden max-w-md w-full">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Nova NT de Amostragem
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5">
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          
          <div className="mb-5">
            <label htmlFor="nt-number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Número da NT
            </label>
            <input
              type="text"
              id="nt-number"
              ref={firstInputRef}
              value={ntNumber}
              onChange={(e) => setNtNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 
                bg-white dark:bg-gray-700 
                border border-gray-300 dark:border-gray-600 
                rounded-lg shadow-sm text-gray-900 dark:text-gray-100 
                focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              placeholder="Digite o número da NT"
            />
          </div>
          
          {showPasteArea ? (
            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Cole os dados dos itens
                </h4>
                <button
                  type="button"
                  onClick={() => setShowPasteArea(false)}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  Cancelar
                </button>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Cole os dados do Excel ou outro formato tabulado. O sistema tentará identificar automaticamente código, descrição, quantidade e lote.
                </p>
                
                <textarea
                  ref={pasteAreaRef}
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  className="w-full h-32 px-3 py-2 
                    bg-white dark:bg-gray-700 
                    border border-gray-300 dark:border-gray-600 
                    rounded-md shadow-sm text-sm text-gray-900 dark:text-gray-100 
                    focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  placeholder="Cole aqui os dados copiados do Excel ou outra planilha (código, descrição, quantidade, lote)"
                />
                
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={processPastedData}
                    className="px-3 py-1.5 text-xs font-medium text-white 
                            bg-blue-600 dark:bg-blue-500 
                            rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 
                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Processar Dados
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Itens da NT
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPasteArea(true)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 rounded-md text-xs hover:bg-gray-100 dark:hover:bg-gray-600/80 transition-colors"
                  >
                    <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                    Colar Dados
                  </button>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md text-xs hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                    Adicionar Item
                  </button>
                </div>
              </div>
              
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Item #{item.id}
                      </h5>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-1">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Código
                        </label>
                        <input
                          type="text"
                          value={item.code}
                          onChange={(e) => handleItemChange(item.id, 'code', e.target.value)}
                          className="w-full px-2.5 py-1.5 
                            bg-white dark:bg-gray-700 
                            border border-gray-300 dark:border-gray-600 
                            rounded-md shadow-sm text-sm text-gray-900 dark:text-gray-100 
                            focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                          placeholder="Código do item"
                        />
                      </div>
                      
                      <div className="col-span-1">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Lote
                        </label>
                        <input
                          type="text"
                          value={item.batch}
                          onChange={(e) => handleItemChange(item.id, 'batch', e.target.value)}
                          className="w-full px-2.5 py-1.5 
                            bg-white dark:bg-gray-700 
                            border border-gray-300 dark:border-gray-600 
                            rounded-md shadow-sm text-sm text-gray-900 dark:text-gray-100 
                            focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                          placeholder="Número do lote"
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Descrição
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                          className="w-full px-2.5 py-1.5 
                            bg-white dark:bg-gray-700 
                            border border-gray-300 dark:border-gray-600 
                            rounded-md shadow-sm text-sm text-gray-900 dark:text-gray-100 
                            focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                          placeholder="Descrição do item"
                        />
                      </div>
                      
                      <div className="col-span-1">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Quantidade
                        </label>
                        <input
                          type="text"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                          className="w-full px-2.5 py-1.5 
                            bg-white dark:bg-gray-700 
                            border border-gray-300 dark:border-gray-600 
                            rounded-md shadow-sm text-sm text-gray-900 dark:text-gray-100 
                            focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                          placeholder="Quantidade"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-3 pt-3 border-t border-gray-200 dark:border-gray-700 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                      bg-white dark:bg-gray-800 
                      border border-gray-300 dark:border-gray-600 
                      rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white 
                      bg-blue-600 dark:bg-blue-500 
                      rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800
                      disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {isLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isLoading ? 'Salvando...' : 'Salvar NT'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default AddNTAmostragemModal;