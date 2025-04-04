import { useState, useEffect } from 'react';
import { ExclamationTriangleIcon, ClockIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../supabaseClient';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { setupRealtimeSubscription, removeSubscription } from '../../utils/supabaseRealtime';

export default function RobotAlertBanner() {
  const [alerts, setAlerts] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Fetch alerts on component mount and set up subscription
  useEffect(() => {
    fetchAlerts();
    
    const sub = setupRealtimeSubscription('robot_alerts', handleRobotAlertChange);
    setSubscription(sub);
    
    // Update time every minute for "time ago" calculations
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => {
      if (subscription) {
        removeSubscription(subscription);
      }
      clearInterval(timer);
    };
  }, []);
  
  // Update visibility when alerts change
  useEffect(() => {
    setIsVisible(alerts.length > 0);
  }, [alerts]);
  
  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('robot_alerts')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAlerts(data);
    } catch (error) {
      console.error('Error fetching robot alerts:', error);
    }
  };
  
  const handleRobotAlertChange = (payload) => {
    console.log('Robot alert change:', payload);
    fetchAlerts(); // Refresh alerts list
  };
  
  const calculateInactiveTime = (timestamp) => {
    if (!timestamp) return 'tempo desconhecido';
    
    try {
      const date = new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: false, locale: ptBR });
    } catch (error) {
      return 'tempo inválido';
    }
  };
  
  const formatDateTime = (dateTimeString) => {
    try {
      const date = new Date(dateTimeString);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (error) {
      return 'data inválida';
    }
  };
  
  if (!isVisible || alerts.length === 0) return null;
  
  // Display the most recent alert
  const alert = alerts[0];
  
  return (
    <div className="mb-6 animate-fadeIn">
      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-lg p-4">
        <div className="flex flex-col md:flex-row">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 dark:text-orange-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800 dark:text-orange-300">
                Robô {alert.robot_number} parado!
              </h3>
              <div className="mt-1 text-sm text-orange-700 dark:text-orange-300">
                {alert.description || "Sem descrição disponível"}
              </div>
            </div>
          </div>
          
          <div className="mt-3 md:mt-0 md:ml-auto flex flex-wrap gap-4 items-center text-xs">
            <div className="flex items-center bg-white/50 dark:bg-gray-800/50 px-2 py-1 rounded">
              <DocumentTextIcon className="h-3 w-3 mr-1 text-orange-500 dark:text-orange-400" />
              <span className="text-orange-800 dark:text-orange-300">OS: {alert.os_number || "N/A"}</span>
            </div>
            
            <div className="flex items-center bg-white/50 dark:bg-gray-800/50 px-2 py-1 rounded">
              <ClockIcon className="h-3 w-3 mr-1 text-orange-500 dark:text-orange-400" />
              <span className="text-orange-800 dark:text-orange-300">
                Previsão: {formatDateTime(alert.estimated_resolution)}
              </span>
            </div>
            
            <div className="flex items-center bg-white/50 dark:bg-gray-800/50 px-2 py-1 rounded">
              <ClockIcon className="h-3 w-3 mr-1 text-orange-500 dark:text-orange-400" />
              <span className="text-orange-800 dark:text-orange-300">
                Parado há {calculateInactiveTime(alert.created_at)}
              </span>
            </div>
          </div>
        </div>
        
        {alerts.length > 1 && (
          <div className="mt-2 pt-2 border-t border-orange-200 dark:border-orange-800/50 text-xs text-orange-700 dark:text-orange-300">
            {alerts.length - 1} {alerts.length - 1 === 1 ? 'outro robô está' : 'outros robôs estão'} parados
          </div>
        )}
      </div>
    </div>
  );
}
