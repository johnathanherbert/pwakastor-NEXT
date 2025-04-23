import { useState, useEffect, useRef } from 'react';
import { XMarkIcon, PencilIcon, TagIcon, DocumentIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import Loading from '../ui/Loading';

export default function EditItemModal({ isOpen, onClose, onItemUpdated, item, nt }) {
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    quantity: '',
    batch: '',
    priority: false
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef(null);
  const firstInputRef = useRef(null);
  
  // Update form data when item changes or modal opens
  useEffect(() => {
    if (item && isOpen) {
      setFormData({
        code: item.code || '',
        description: item.description || '',
        quantity: item.quantity || '',
        batch: item.batch || '',
        priority: item.priority || false
      });
      setError('');
      
      // Focus first input after a short delay to ensure the modal is visible
      setTimeout(() => {
        if (firstInputRef.current) {
          firstInputRef.current.focus();
        }
      }, 100);
    }
  }, [item, isOpen]);
  
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
  
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    // Validate form
    if (!formData.code.trim() || !formData.quantity.trim()) {
      setError('Código e quantidade são obrigatórios.');
      return;
    }
    
    setIsSubmitting(true);
    
    // Call parent handler with a short delay to show loading state
    setTimeout(() => {
      onItemUpdated(formData);
      setIsSubmitting(false);
    }, 300);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm opacity-100 transition-opacity duration-300" onClick={onClose}></div>
      
      <div 
        ref={modalRef}
        className="relative bg-white dark:bg-gray-800/95 rounded-xl shadow-xl w-full max-w-lg border border-gray-200/50 dark:border-gray-700/30 opacity-100 transform-gpu scale-100 transition-all duration-300 animate-fade-scale-in"
      >
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <PencilIcon className="h-3.5 w-3.5" />
            </span>
            Editar Item 
            <span className="inline-flex items-center gap-1 text-base text-gray-600 dark:text-gray-400">
              #{item.item_number}
              <span className="text-sm font-normal px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700/70 text-gray-600 dark:text-gray-300">
                NT {nt.nt_number}
              </span>
            </span>
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
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                  <TagIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  Código
                </label>
                <input
                  ref={firstInputRef}
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors shadow-sm"
                  placeholder="Ex: 010228"
                />
              </div>
              
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                  <DocumentIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  Descrição do Material
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors shadow-sm"
                  placeholder="Ex: DIOXIDO TITANIO"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Quantidade
                </label>
                <input
                  type="text"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', e.target.value)}
                  placeholder="Ex: 24"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors shadow-sm"
                />
              </div>
              
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                  <ArchiveBoxIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  Lote
                </label>
                <input
                  type="text"
                  value={formData.batch}
                  onChange={(e) => handleChange('batch', e.target.value)}
                  placeholder="Ex: L12345"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors shadow-sm"
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-2 cursor-pointer group py-2">
                  <div className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${formData.priority ? 'bg-amber-500 dark:bg-amber-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.priority ? 'translate-x-5' : 'translate-x-1'}`} />
                    <input
                      type="checkbox"
                      checked={formData.priority}
                      onChange={(e) => handleChange('priority', e.target.checked)}
                      className="sr-only"
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    Marcar como prioritário
                  </span>
                </label>
                
                <div className={`${formData.priority ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${formData.priority ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' : 'bg-gray-100 dark:bg-gray-800/40 text-gray-700 dark:text-gray-300'}`}>
                    <StarIcon className="h-3 w-3" />
                    Item prioritário
                  </span>
                </div>
              </div>
              
              {formData.priority && (
                <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-900/20 rounded-lg p-2.5 border border-amber-100 dark:border-amber-800/30 flex items-start gap-1.5">
                  <svg className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" stroke="none">
                    <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                  </svg>
                  <span>
                    Itens prioritários são destacados visualmente e podem ser filtrados rapidamente na tela principal
                  </span>
                </div>
              )}
            </div>
            
            <div className="mt-2 px-3 py-2 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800/30 text-xs text-blue-600 dark:text-blue-400">
              <p className="flex items-start gap-1.5">
                <svg className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Ao editar os detalhes do item, não há alteração no status ou em registros de tempo do mesmo.</span>
              </p>
            </div>
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
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800
                      flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loading 
                    size="small" 
                    message="" 
                    logoVisible={false} 
                    className="min-h-0 bg-transparent"
                  />
                  <span className="ml-2">Salvando...</span>
                </>
              ) : (
                <>
                  <PencilIcon className="h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
