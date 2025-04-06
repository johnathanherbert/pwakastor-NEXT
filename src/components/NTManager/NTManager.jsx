import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import NTsList from './NTsList';
// ...existing code...

export default function NTManager() {
  const [nts, setNTs] = useState([]);
  const [ntItems, setNTItems] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showOverdueWarnings, setShowOverdueWarnings] = useState(true);
  // ...existing state...

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
  
  // Initial data load
  useEffect(() => {
    fetchData(true);
  }, [fetchData]);
  
  // Manual refresh handler - shows loading effect
  const handleRefresh = () => {
    fetchData(true); // Pass true to show loading effect
  };
  
  // Real-time subscription setup
  useEffect(() => {
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
  }, [fetchData]);

  // ...existing functions...

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gerenciamento de NTs
        </h1>
        <div className="flex gap-2">
          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 text-blue-600 dark:text-blue-400 rounded-md flex items-center gap-1.5 transition-colors"
            disabled={isLoading}
          >
            <RefreshIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar Dados
          </button>
          
          {/* Other buttons */}
          {/* ...existing code... */}
        </div>
      </div>
      
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
      {/* ...existing code... */}
    </div>
  );
}