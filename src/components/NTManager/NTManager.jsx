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
import Loading from '../ui/Loading';

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
      <Loading 
        fullScreen={true}
        message="Carregando notas técnicas..." 
      />
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
            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-md">
              <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-violet-600 dark:from-purple-500 dark:to-violet-400">
                Gerenciamento de NTs
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Controle e acompanhamento de notas técnicas
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="z-10 border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg" />
            
            <button
              onClick={handleRefresh}
              className="px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 
                        border border-gray-200 dark:border-gray-700 rounded-lg flex items-center gap-1.5 
                        shadow-sm hover:shadow hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
              disabled={isLoading}
              aria-label="Atualizar dados"
            >
              <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin text-blue-600 dark:text-blue-400' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
            
            <button
              onClick={toggleOverdueWarnings}
              className={`px-3 py-2 ${
                showOverdueWarnings 
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-700/50' 
                : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700'
              } border rounded-lg flex items-center gap-1.5 shadow-sm hover:shadow transition-all duration-200`}
              aria-label={showOverdueWarnings ? "Desativar alertas de atraso" : "Ativar alertas de atraso"}
            >
              <BellIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Alertas</span>
              <span className={`inline-flex h-2 w-2 rounded-full ${showOverdueWarnings ? 'bg-amber-500 animate-pulse' : 'bg-gray-400'}`}></span>
            </button>
            
            <button
              onClick={() => setStatsVisible(!statsVisible)}
              className={`px-3 py-2 ${
                statsVisible
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-700/50'
                : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700'
              } border rounded-lg flex items-center gap-1.5 shadow-sm hover:shadow transition-all duration-200`}
              aria-label={statsVisible ? "Ocultar estatísticas" : "Mostrar estatísticas"}
            >
              <ChartBarIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            
            <button
              onClick={handleAddNT}
              className="px-3 py-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white 
                        rounded-lg flex items-center gap-1.5 shadow-sm hover:shadow 
                        transition-all duration-200 transform hover:-translate-y-0.5"
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
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700 mb-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              <div className="bg-gray-50/80 dark:bg-gray-800/50 rounded-xl p-4 flex flex-col hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700/50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 mt-4 mr-4 text-gray-500 dark:text-gray-400 opacity-20 group-hover:opacity-30 transition-opacity">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total de NTs</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{stats.total}</p>
                <div className="h-1 w-16 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded mt-3 group-hover:w-20 transition-all"></div>
                <span className="mt-3 text-sm text-gray-600 dark:text-gray-400">{stats.itemCount} itens no total</span>
                <div className="absolute inset-0 bg-gradient-to-br from-gray-500 to-gray-600 opacity-0 group-hover:opacity-5 transition-opacity rounded-xl"></div>
              </div>
              
              <div className="bg-blue-50/80 dark:bg-blue-900/20 rounded-xl p-4 flex flex-col hover:shadow-md transition-all duration-300 border border-blue-100 dark:border-blue-800/30 relative overflow-hidden group">
                <div className="absolute top-0 right-0 mt-4 mr-4 text-blue-500 dark:text-blue-400 opacity-20 group-hover:opacity-30 transition-opacity">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Itens Pendentes</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{stats.pending}</p>
                <div className="h-1 w-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded mt-3 group-hover:w-20 transition-all"></div>
                <span className="mt-3 text-sm text-blue-600 dark:text-blue-400">Aguardando pagamento</span>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-0 group-hover:opacity-5 transition-opacity rounded-xl"></div>
              </div>
              
              <div className="bg-green-50/80 dark:bg-green-900/20 rounded-xl p-4 flex flex-col hover:shadow-md transition-all duration-300 border border-green-100 dark:border-green-800/30 relative overflow-hidden group">
                <div className="absolute top-0 right-0 mt-4 mr-4 text-green-500 dark:text-green-400 opacity-20 group-hover:opacity-30 transition-opacity">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Itens Finalizados</p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-300 mt-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">{stats.completed}</p>
                <div className="h-1 w-16 bg-gradient-to-r from-green-400 to-green-600 rounded mt-3 group-hover:w-20 transition-all"></div>
                <span className="mt-3 text-sm text-green-600 dark:text-green-400">Pagos com sucesso</span>
                <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 opacity-0 group-hover:opacity-5 transition-opacity rounded-xl"></div>
              </div>
              
              <div className="bg-amber-50/80 dark:bg-amber-900/20 rounded-xl p-4 flex flex-col hover:shadow-md transition-all duration-300 border border-amber-100 dark:border-amber-800/30 relative overflow-hidden group">
                <div className="absolute top-0 right-0 mt-4 mr-4 text-amber-500 dark:text-amber-400 opacity-20 group-hover:opacity-30 transition-opacity">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Itens em Atraso</p>
                <p className="text-3xl font-bold text-amber-700 dark:text-amber-300 mt-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{stats.overdue}</p>
                <div className="h-1 w-16 bg-gradient-to-r from-amber-400 to-amber-600 rounded mt-3 group-hover:w-20 transition-all"></div>
                <div className="mt-3 flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                  <span className="text-sm text-amber-600 dark:text-amber-400">Mais de 2h de espera</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-600 opacity-0 group-hover:opacity-5 transition-opacity rounded-xl"></div>
              </div>
              
              <div className="bg-purple-50/80 dark:bg-purple-900/20 rounded-xl p-4 flex flex-col hover:shadow-md transition-all duration-300 border border-purple-100 dark:border-purple-800/30 relative overflow-hidden group">
                <div className="absolute top-0 right-0 mt-4 mr-4 text-purple-500 dark:text-purple-400 opacity-20 group-hover:opacity-30 transition-opacity">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Taxa de Conclusão</p>
                <p className="text-3xl font-bold text-purple-700 dark:text-purple-300 mt-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {stats.itemCount > 0 ? Math.round((stats.completed / stats.itemCount) * 100) : 0}%
                </p>
                <div className="h-1 w-16 bg-gradient-to-r from-purple-400 to-purple-600 rounded mt-3 group-hover:w-20 transition-all"></div>
                <div className="mt-3 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-violet-600 h-1.5 rounded-full transition-all duration-1000" 
                    style={{ width: `${stats.itemCount > 0 ? (stats.completed / stats.itemCount) * 100 : 0}%` }}
                  ></div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-0 group-hover:opacity-5 transition-opacity rounded-xl"></div>
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