import { useState, useEffect } from 'react';
import { ExclamationTriangleIcon, XMarkIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../supabaseClient';
import RobotStatusModal from './RobotStatusModal';

export default function RobotAlertBanner() {
  const [alerts, setAlerts] = useState([]);
  const [showBanner, setShowBanner] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);

  useEffect(() => {
    fetchAlerts();
    setupRealtimeSubscription();

    return () => {
      const subscription = supabase.getChannels().find(channel => channel.topic === 'robot_alerts');
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('robot_alerts')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching robot alerts:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    const robotChannel = supabase
      .channel('robot_alerts')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'robot_alerts' }, 
        () => {
          console.log('Robot alerts changed, refreshing data');
          fetchAlerts();
        }
      )
      .subscribe();
  };

  const resolveAlert = async (alertId) => {
    try {
      const { error } = await supabase
        .from('robot_alerts')
        .update({ active: false, resolved_at: new Date().toISOString() })
        .eq('id', alertId);

      if (error) throw error;
      fetchAlerts();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const handleUpdateStatus = (alert) => {
    setSelectedAlert(alert);
    setShowStatusModal(true);
  };

  if (alerts.length === 0 || !showBanner) return null;

  return (
    <>
      <div className="mb-4">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                <ExclamationTriangleIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {alerts.length === 1 ? '1 robô inativo' : `${alerts.length} robôs inativos`}
              </span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowStatusModal(true)}
                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-1"
              >
                <AdjustmentsHorizontalIcon className="h-3.5 w-3.5" />
                <span>Gerenciar</span>
              </button>
              <button
                onClick={() => setShowBanner(false)}
                className="p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <RobotStatusModal 
        isOpen={showStatusModal} 
        onClose={() => {
          setShowStatusModal(false); 
          setSelectedAlert(null);
        }}
        alerts={alerts}
        selectedAlert={selectedAlert}
        onResolve={resolveAlert}
        onRefresh={fetchAlerts}
      />
    </>
  );
}
