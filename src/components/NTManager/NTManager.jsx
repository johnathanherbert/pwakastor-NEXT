import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { useRouter } from 'next/navigation';
import NTsList from './NTsList';
import Clock from '../Clock/Clock';
import { 
  ArrowPathIcon, 
  PlusCircleIcon, 
  BellIcon, 
  AdjustmentsHorizontalIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import AddNTModal from './AddNTModal';
import EditNTModal from './EditNTModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { showToast } from '../Toast/ToastContainer';
import { motion } from 'framer-motion';

export default function NTManager() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [nts, setNTs] = useState([]);
  const [ntItems, setNTItems] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showOverdueWarnings, setShowOverdueWarnings] = useState(true);
  const [showAddNTModal, setShowAddNTModal] = useState(false);
  const [showEditNTModal, setShowEditNTModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentNT, setCurrentNT] = useState(null);
  const [currentItem, setCurrentItem] = useState(null);
  const [deleteType, setDeleteType] = useState('');
  const [statsVisible, setStatsVisible] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    overdue: 0,
    itemCount: 0
  });

  // Verificar autenticação do usuário
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }
        setUser(user);
        setAuthChecked(true);
      } catch (error) {
        console.error('Erro ao verificar usuário:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  // Separate function for fetching data
  const fetchData = useCallback(async (showLoadingEffect = false) => {
    if (showLoadingEffect) {
      setIsLoading(true);
    }
    
    try {
      // Fetch NTs
      const { data: ntsData, error: ntsError } = await supabase
        .from('nts')
        .select('*')
        .order('created_date', { ascending: false })
        .order('created_time', { ascending: false });
      
      if (ntsError) throw ntsError;
      
      // Fetch all NT items
      const { data: itemsData, error: itemsError } = await supabase
        .from('nt_items')
        .select('*')
        .order('item_number', { ascending: true });
      
      if (itemsError) throw itemsError;
      
      // Organize items by NT
      const itemsByNT = {};
      itemsData.forEach(item => {
        if (!itemsByNT[item.nt_id]) {
          itemsByNT[item.nt_id] = [];
        }
        itemsByNT[item.nt_id].push(item);
      });
      
      // Update state with fetched data
      setNTs(ntsData);
      setNTItems(itemsByNT);

      // Calculate statistics
      calculateStatistics(ntsData, itemsByNT);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      if (showLoadingEffect) {
        // Small delay to ensure the loading indicator is visible at least briefly
        setTimeout(() => {
          setIsLoading(false);
        }, 300);
      }
    }
  }, []);
  
  // Calculate statistics for dashboard
  const calculateStatistics = (ntsData, itemsByNT) => {
    const now = new Date();
    const todayString = now.toLocaleDateString('pt-BR');
    
    let totalItems = 0;
    let pendingItems = 0;
    let completedItems = 0;
    let overdueItems = 0;
    
    // Count all items and their statuses
    Object.values(itemsByNT).forEach(items => {
      totalItems += items.length;
      
      items.forEach(item => {
        if (item.status === 'Pago') {
          completedItems++;
        } else {
          pendingItems++;
          
          // Check if overdue (more than 2 hours old and not paid)
          if (item.created_date && item.created_time) {
            try {
              const [day, month, year] = item.created_date.split('/').map(Number);
              const [hours, minutes] = item.created_time.split(':').map(Number);
              
              // Create date object
              const itemDate = new Date(2000 + year, month - 1, day, hours, minutes);
              const diffMs = now - itemDate;
              const diffHours = diffMs / (1000 * 60 * 60);
              
              if (diffHours > 2) {
                overdueItems++;
              }
            } catch (error) {
              console.error('Error calculating overdue status:', error);
            }
          }
        }
      });
    });
    
    setStats({
      total: ntsData.length,
      pending: pendingItems,
      completed: completedItems,
      overdue: overdueItems,
      itemCount: totalItems
    });
  };
  
  // Initial data load
  useEffect(() => {
    if (authChecked) {
      fetchData(true);
      
      // Set up interval to fetch data every 5 seconds without visual indication
      const intervalId = setInterval(() => {
        fetchData(false); // Don't show loading effect when auto-refreshing
      }, 5000);
      
      // Clean up interval on component unmount
      return () => clearInterval(intervalId);
    }
  }, [fetchData, authChecked]);
  
  // Manual refresh handler - shows loading effect
  const handleRefresh = () => {
    fetchData(true); // Pass true to show loading effect
  };
  
  // Real-time subscription setup
  useEffect(() => {
    if (!authChecked) return;

    // Subscribe to NT changes
    const ntsSubscription = supabase
      .channel('nts-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'nts' }, 
        () => {
          console.log('NT change detected via real-time');
          fetchData(false); // Update without showing loading effect
        }
      )
      .subscribe();
      
    // Subscribe to NT items changes
    const itemsSubscription = supabase
      .channel('nt-items-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'nt_items' }, 
        () => {
          console.log('NT item change detected via real-time');
          fetchData(false); // Update without showing loading effect
        }
      )
      .subscribe();
      
    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(ntsSubscription);
      supabase.removeChannel(itemsSubscription);
    };
  }, [fetchData, authChecked]);
  
  // Se ainda estiver verificando autenticação ou não estiver autenticado, mostra indicador de carregamento
  if (!authChecked) {
    return (
      <div className="container mx-auto px-4 py-6 flex items-center justify-center h-screen">
        <div className="bg-white dark:bg-gray-800/90 rounded-xl shadow-md p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <h2 className="text-xl font-medium text-gray-700 dark:text-gray-300">Verificando autenticação...</h2>
        </div>
      </div>
    );
  }

  const toggleOverdueWarnings = () => {
    setShowOverdueWarnings(!showOverdueWarnings);
    showToast(
      `Alertas de atraso ${!showOverdueWarnings ? 'ativados' : 'desativados'}`,
      'info'
    );
  };
  
  const updateItemStatus = async (itemId, newStatus, ntId) => {
    try {
      let paymentTime = null;
      let paymentDate = null;
      
      // If setting to Pago or Pago Parcial, record the payment time
      if (newStatus === 'Pago' || newStatus === 'Pago Parcial') {
        const now = new Date();
        paymentTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        paymentDate = now.toLocaleDateString('pt-BR');
      }
      
      const { error } = await supabase
        .from('nt_items')
        .update({ 
          status: newStatus,
          payment_time: paymentTime,
          payment_date: paymentDate
        })
        .eq('id', itemId);
      
      if (error) throw error;
      
      // Data will be updated via real-time subscription
      showToast(`Status alterado para ${newStatus}`, 'success');
    } catch (error) {
      console.error('Error updating item status:', error);
      showToast('Erro ao atualizar status', 'error');
    }
  };
  
  const handleAddNT = () => {
    setShowAddNTModal(true);
  };
  
  const handleNTAdded = () => {
    setShowAddNTModal(false);
    // Data will be updated via real-time subscription
  };
  
  const handleEditNT = (nt) => {
    setCurrentNT(nt);
    setShowEditNTModal(true);
  };
  
  const handleNTEdited = () => {
    setShowEditNTModal(false);
    // Data will be updated via real-time subscription
  };
  
  const handleDeleteNT = (nt) => {
    setCurrentNT(nt);
    setDeleteType('nt');
    setShowDeleteModal(true);
  };
  
  const handleDeleteItem = (item, ntId) => {
    // Find the NT this item belongs to
    const nt = nts.find(nt => nt.id === ntId);
    setCurrentNT(nt);
    setCurrentItem(item);
    setDeleteType('item');
    setShowDeleteModal(true);
  };
  
  const confirmDelete = async () => {
    try {
      if (deleteType === 'nt') {
        // Delete the NT and all its items
        const { error } = await supabase
          .from('nts')
          .delete()
          .eq('id', currentNT.id);
        
        if (error) throw error;
        
        showToast(`NT ${currentNT.nt_number} excluída com sucesso`, 'success');
      } else if (deleteType === 'item') {
        // Delete just the item
        const { error } = await supabase
          .from('nt_items')
          .delete()
          .eq('id', currentItem.id);
        
        if (error) throw error;
        
        showToast(`Item #${currentItem.item_number} excluído com sucesso`, 'success');
      }
      
      // Close modal
      setShowDeleteModal(false);
      
      // Data will be updated via real-time subscription
    } catch (error) {
      console.error('Error deleting:', error);
      showToast('Erro ao excluir', 'error');
    }
  };
  
  const handleAddItem = async (ntId, newItem) => {
    try {
      // Find the highest item_number for this NT
      const items = ntItems[ntId] || [];
      const maxItemNumber = items.length > 0
        ? Math.max(...items.map(item => item.item_number))
        : 0;
      
      const now = new Date();
      const formattedDate = now.toLocaleDateString('pt-BR');
      const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      // Insert the new item
      const { error } = await supabase
        .from('nt_items')
        .insert([
          {
            nt_id: ntId,
            item_number: maxItemNumber + 1,
            code: newItem.codigo,
            description: newItem.descricao || '-',
            quantity: newItem.quantidade,
            batch: newItem.lote || '',
            created_date: formattedDate,
            created_time: formattedTime,
            status: 'Ag. Pagamento'
          }
        ]);
      
      if (error) throw error;
      
      // Check if there are more items to add (from bulk paste)
      const remainingItemsData = localStorage.getItem('remaining_items_to_add');
      if (remainingItemsData) {
        try {
          const { ntId: storedNtId, items: remainingItems } = JSON.parse(remainingItemsData);
          
          if (storedNtId === ntId && Array.isArray(remainingItems) && remainingItems.length > 0) {
            // Get the next item to add
            const nextItem = remainingItems.shift();
            
            // Update localStorage with the remaining items
            if (remainingItems.length > 0) {
              localStorage.setItem('remaining_items_to_add', JSON.stringify({
                ntId,
                items: remainingItems
              }));
            } else {
              // No more items, clear localStorage
              localStorage.removeItem('remaining_items_to_add');
              showToast('Todos os itens foram adicionados!', 'success');
            }
            
            // Add the next item automatically
            if (nextItem) {
              await handleAddItem(ntId, nextItem);
            }
          }
        } catch (error) {
          console.error("Error processing remaining items:", error);
          localStorage.removeItem('remaining_items_to_add');
        }
      } else {
        showToast(`Item adicionado à NT com sucesso`, 'success');
      }
      
      // Data will be updated via real-time subscription
    } catch (error) {
      console.error('Error adding item:', error);
      showToast('Erro ao adicionar item à NT', 'error');
    }
  };
  
  const handleEditItem = async (itemId, updates, ntId) => {
    try {
      const { error } = await supabase
        .from('nt_items')
        .update({
          code: updates.code,
          description: updates.description,
          quantity: updates.quantity,
          batch: updates.batch,
          priority: updates.priority !== undefined ? updates.priority : undefined
        })
        .eq('id', itemId);
      
      if (error) throw error;
      
      // Show toast if it's a priority update
      if (updates.priority !== undefined) {
        showToast(
          updates.priority ? 'Item marcado como prioritário' : 'Prioridade removida do item', 
          updates.priority ? 'warning' : 'info'
        );
      } else {
        showToast('Item atualizado com sucesso', 'success');
      }
      
      // Data will be updated via real-time subscription
    } catch (error) {
      console.error('Error updating item:', error);
      showToast('Erro ao atualizar item', 'error');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header with stats dashboard */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-sm shadow-blue-500/20 dark:shadow-blue-500/10">
              <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Gerenciamento de NTs
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Controle e acompanhamento de notas técnicas
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="z-10 border border-gray-200 dark:border-gray-700/50 shadow-sm rounded-lg" />
            
            <button
              onClick={handleRefresh}
              className="px-3 py-2 hover-lift bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 
                        border border-gray-200 dark:border-gray-700/50 rounded-lg flex items-center gap-1.5 
                        shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              disabled={isLoading}
              aria-label="Atualizar dados"
            >
              <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin text-blue-600 dark:text-blue-400' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
            
            <button
              onClick={toggleOverdueWarnings}
              className={`px-3 py-2 hover-lift ${
                showOverdueWarnings 
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-700/50' 
                : 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700/50'
              } border rounded-lg flex items-center gap-1.5 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40`}
              aria-label={showOverdueWarnings ? "Desativar alertas de atraso" : "Ativar alertas de atraso"}
            >
              <BellIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Alertas</span>
              <span className={`inline-flex h-2 w-2 rounded-full ${showOverdueWarnings ? 'bg-amber-500' : 'bg-gray-400'}`}></span>
            </button>
            
            <button
              onClick={() => setStatsVisible(!statsVisible)}
              className="px-3 py-2 hover-lift bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 
                        border border-gray-200 dark:border-gray-700/50 rounded-lg flex items-center gap-1.5 
                        shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              aria-label={statsVisible ? "Ocultar estatísticas" : "Mostrar estatísticas"}
            >
              <ChartBarIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            
            <button
              onClick={handleAddNT}
              className="px-3 py-2 hover-lift bg-gradient-to-r from-blue-600 to-indigo-600 text-white 
                        rounded-lg flex items-center gap-1.5 shadow-sm hover:shadow 
                        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              aria-label="Adicionar nova NT"
            >
              <PlusCircleIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Nova NT</span>
            </button>
          </div>
        </div>
        
        {/* Statistics Dashboard */}
        {statsVisible && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-md p-4 border border-gray-200/50 dark:border-gray-700/30 mb-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 flex flex-col hover-lift">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total de NTs</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</span>
                <span className="mt-2 text-xs text-gray-500 dark:text-gray-400">{stats.itemCount} itens</span>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 flex flex-col hover-lift">
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Itens Pendentes</span>
                <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.pending}</span>
                <div className="mt-2 flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-blue-600 dark:text-blue-400">Aguardando pagamento</span>
                </div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 flex flex-col hover-lift">
                <span className="text-xs font-medium text-green-600 dark:text-green-400">Itens Finalizados</span>
                <span className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.completed}</span>
                <div className="mt-2 flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                  <span className="text-xs text-green-600 dark:text-green-400">Pagos</span>
                </div>
              </div>
              
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 flex flex-col hover-lift">
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Itens em Atraso</span>
                <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.overdue}</span>
                <div className="mt-2 flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                  <span className="text-xs text-amber-600 dark:text-amber-400">Mais de 2h de espera</span>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 flex flex-col hover-lift">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Taxa de Conclusão</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.itemCount > 0 ? Math.round((stats.completed / stats.itemCount) * 100) : 0}%
                </span>
                <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-1.5 rounded-full" 
                    style={{ width: `${stats.itemCount > 0 ? (stats.completed / stats.itemCount) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* NTs List Component */}
      <NTsList
        nts={nts}
        ntItems={ntItems}
        updateItemStatus={updateItemStatus}
        onEditNT={handleEditNT}
        onDeleteNT={handleDeleteNT}
        onDeleteItem={handleDeleteItem}
        onEditItem={handleEditItem}
        onAddItem={handleAddItem}
        isLoading={isLoading}
        showOverdueWarnings={showOverdueWarnings}
      />
      
      {/* Modals */}
      <AddNTModal 
        isOpen={showAddNTModal} 
        onClose={() => setShowAddNTModal(false)} 
        onNTAdded={handleNTAdded} 
      />
      
      <EditNTModal
        isOpen={showEditNTModal}
        onClose={() => setShowEditNTModal(false)}
        onNTEdited={handleNTEdited}
        nt={currentNT}
        ntItems={currentNT ? ntItems[currentNT.id] || [] : []}
      />
      
      <DeleteConfirmationModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        type={deleteType}
        item={currentItem}
        nt={currentNT}
      />
    </div>
  );
}