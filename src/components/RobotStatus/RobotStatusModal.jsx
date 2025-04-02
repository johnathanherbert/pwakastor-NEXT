import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  XMarkIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  PlusCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function RobotStatusModal({ isOpen, onClose, alerts = [], selectedAlert = null, onResolve, onRefresh }) {
  const [tab, setTab] = useState('active');
  const [resolvedAlerts, setResolvedAlerts] = useState([]);
  const [isAddingAlert, setIsAddingAlert] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [newAlert, setNewAlert] = useState({
    robot_number: '1',
    os_number: '',
    status: 'warning',
    description: '',
    estimated_resolution: '',
  });

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setNewAlert(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  useEffect(() => {
    if (isOpen && tab === 'resolved') {
      fetchResolvedAlerts();
    }
  }, [isOpen, tab]);

  const fetchResolvedAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('robot_alerts')
        .select('*')
        .eq('active', false)
        .order('resolved_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setResolvedAlerts(data || []);
    } catch (error) {
      console.error('Error fetching resolved alerts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addAlert = useCallback(async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      let formattedAlert = {
        ...newAlert,
        active: true,
        created_at: new Date().toISOString(),
      };

      if (formattedAlert.estimated_resolution) {
        const estResolutionDate = new Date(formattedAlert.estimated_resolution);
        formattedAlert.estimated_resolution = estResolutionDate.toISOString();
      }

      const { error } = await supabase
        .from('robot_alerts')
        .insert([formattedAlert]);

      if (error) throw error;
      
      setNewAlert({
        robot_number: '1',
        os_number: '',
        status: 'warning',
        description: '',
        estimated_resolution: '',
      });
      setIsAddingAlert(false);
      onRefresh();
    } catch (error) {
      console.error('Error adding alert:', error);
    } finally {
      setLoading(false);
    }
  }, [newAlert, onRefresh]);

  const formatDateTime = useCallback((dateTimeString) => {
    try {
      const date = new Date(dateTimeString);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (error) {
      return dateTimeString;
    }
  }, []);

  const AlertCard = useCallback(({ alert, isResolved = false }) => {
    const isWarning = alert.status === 'warning';
    const statusColor = isWarning 
      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';

    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded mb-2">
        <div className="p-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor}`}>
                  {alert.status === 'warning' ? 'Alerta' : 'Crítico'}
                </span>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Robô {alert.robot_number}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  OS: {alert.os_number}
                </span>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-400">
                <span>Início: {formatDateTime(alert.created_at)}</span>
                {isResolved && alert.resolved_at && (
                  <span className="ml-2 text-green-600 dark:text-green-400">
                    • Resolvido: {formatDateTime(alert.resolved_at)}
                  </span>
                )}
              </p>

              {alert.description && (
                <p className="text-xs mt-1 text-gray-700 dark:text-gray-300">
                  {alert.description}
                </p>
              )}

              <p className="text-xs mt-1 flex items-center gap-1">
                <ClockIcon className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  Previsão: {formatDateTime(alert.estimated_resolution)}
                </span>
              </p>
            </div>

            {!isResolved && (
              <button
                onClick={() => onResolve(alert.id)}
                className="p-1.5 rounded bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400"
                title="Marcar como resolvido"
              >
                <CheckCircleIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }, [formatDateTime, onResolve]);

  const AddAlertForm = useMemo(() => {
    return (
      <form onSubmit={addAlert} className="space-y-4 mt-4 border-t dark:border-gray-700 pt-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Registrar Nova Parada</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Robô
            </label>
            <select
              name="robot_number"
              value={newAlert.robot_number}
              onChange={handleInputChange}
              className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-sm"
              required
              autoComplete="off"
            >
              <option value="1">Robô 1</option>
              <option value="2">Robô 2</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Número OS
            </label>
            <input
              type="text"
              name="os_number"
              value={newAlert.os_number}
              onChange={handleInputChange}
              placeholder="25789"
              className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-sm"
              required
              autoComplete="off"
              autoFocus
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Tipo
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input 
                type="radio" 
                name="status"
                value="warning"
                checked={newAlert.status === 'warning'}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Alerta</span>
            </label>
            <label className="flex items-center">
              <input 
                type="radio" 
                name="status"
                value="critical"
                checked={newAlert.status === 'critical'}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Crítico</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Previsão de Retorno
          </label>
          <input
            type="datetime-local"
            name="estimated_resolution"
            value={newAlert.estimated_resolution}
            onChange={handleInputChange}
            className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-sm"
            required
            autoComplete="off"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Descrição do Problema
          </label>
          <textarea
            name="description"
            value={newAlert.description}
            onChange={handleInputChange}
            rows="3"
            placeholder="Descreva o motivo da parada..."
            className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-sm"
            autoComplete="off"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setIsAddingAlert(false)}
            className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-1.5 text-xs bg-blue-600 dark:bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    );
  }, [newAlert, handleInputChange, addAlert, loading]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
        
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
          <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Status dos Robôs
            </h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          
          <div className="p-4">
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700/50 p-0.5 rounded-md mb-4">
              <button
                onClick={() => setTab('active')}
                className={`flex-1 text-xs py-1.5 rounded ${
                  tab === 'active'
                    ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-800 dark:text-gray-100'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                Em Aberto
              </button>
              <button
                onClick={() => setTab('resolved')}
                className={`flex-1 text-xs py-1.5 rounded ${
                  tab === 'resolved'
                    ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-800 dark:text-gray-100'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                Resolvidos
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto pr-1">
              {tab === 'active' ? (
                <>
                  {alerts.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Não há robôs parados no momento.
                      </p>
                    </div>
                  ) : (
                    alerts.map(alert => (
                      <AlertCard key={alert.id} alert={alert} />
                    ))
                  )}
                </>
              ) : (
                <>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-300 dark:border-gray-600"></div>
                    </div>
                  ) : resolvedAlerts.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Não há registros de paradas resolvidas.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Últimas 20 ocorrências
                        </h4>
                        <button 
                          onClick={fetchResolvedAlerts}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                        >
                          <ArrowPathIcon className="h-4 w-4" />
                        </button>
                      </div>
                      {resolvedAlerts.map(alert => (
                        <AlertCard key={alert.id} alert={alert} isResolved={true} />
                      ))}
                    </>
                  )}
                </>
              )}
            </div>

            {tab === 'active' && !isAddingAlert && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => setIsAddingAlert(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                >
                  <PlusCircleIcon className="h-4 w-4" />
                  Registrar Nova Parada
                </button>
              </div>
            )}

            {tab === 'active' && isAddingAlert && AddAlertForm}
          </div>
        </div>
      </div>
    </div>
  );
}
