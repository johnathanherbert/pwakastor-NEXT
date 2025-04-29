import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  XMarkIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  PlusCircleIcon,
  ArrowPathIcon,
  CheckIcon,
  ChartBarIcon,
  ArrowLongDownIcon,
  CalendarIcon,
  DocumentTextIcon,
  WrenchIcon,
  CubeIcon,
  ClipboardDocumentIcon,
  EllipsisVerticalIcon,
  FireIcon,
  BoltIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { FireIcon as FireIconSolid } from '@heroicons/react/24/solid';
import { setupRealtimeSubscription, removeSubscription } from '../../utils/supabaseRealtime';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { showToast } from '../../components/Toast/ToastContainer';

export default function RobotStatusModal({ isOpen, onClose, alerts = [], selectedAlert = null, onResolve, onRefresh }) {
  const [tab, setTab] = useState('active');
  const [resolvedAlerts, setResolvedAlerts] = useState([]);
  const [isAddingAlert, setIsAddingAlert] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [robotStatus, setRobotStatus] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedRobot, setSelectedRobot] = useState('all');
  const [statsVisible, setStatsVisible] = useState(false);
  const [stats, setStats] = useState({
    totalAlerts: 0,
    criticalAlerts: 0,
    warningAlerts: 0,
    avgResolutionTime: 0,
    mostFrequentIssue: '',
    equipmentStats: {}
  });
  const modalRef = useRef(null);
  
  const [newAlert, setNewAlert] = useState({
    robot_number: '1',
    os_number: '',
    status: 'warning',
    description: '',
    estimated_resolution: '',
    common_problem: ''
  });

  // Função para determinar o tipo de equipamento com base no número
  const getEquipmentType = (robotNumber) => {
    // Converte para número para garantir a comparação correta
    const number = parseInt(robotNumber, 10);
    
    if (number === 3 || number === 4) {
      // Para 3 = Lançadeira 1, 4 = Lançadeira 2
      return {
        type: 'Lançadeira',
        number: number - 2, // Converte 3->1 e 4->2
        gender: 'feminino',  // Para concordância gramatical em português
        icon: <CubeIcon className="h-5 w-5" />
      };
    } else {
      // Para 1 = Robô 1, 2 = Robô 2
      return {
        type: 'Robô',
        number: number,
        gender: 'masculino',
        icon: <WrenchIcon className="h-5 w-5" />
      };
    }
  };

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

  useEffect(() => {
    if (isOpen) {
      computeStats();
    }
  }, [isOpen, alerts, resolvedAlerts]);

  // Generate statistics from alerts data
  const computeStats = () => {
    const allAlerts = [...alerts, ...resolvedAlerts];
    
    if (allAlerts.length === 0) return;
    
    // Count alerts by type
    const criticalCount = allAlerts.filter(a => a.status === 'critical').length;
    const warningCount = allAlerts.filter(a => a.status === 'warning').length;
    
    // Calculate average resolution time for resolved alerts
    let totalResolutionTime = 0;
    let resolvedCount = 0;
    
    resolvedAlerts.forEach(alert => {
      if (alert.created_at && alert.resolved_at) {
        const startTime = new Date(alert.created_at);
        const endTime = new Date(alert.resolved_at);
        const minutes = Math.round((endTime - startTime) / (1000 * 60));
        
        if (!isNaN(minutes) && minutes >= 0) {
          totalResolutionTime += minutes;
          resolvedCount++;
        }
      }
    });
    
    const avgTime = resolvedCount > 0 ? Math.round(totalResolutionTime / resolvedCount) : 0;
    
    // Find most frequent issue
    const problemCounts = {};
    allAlerts.forEach(alert => {
      if (alert.common_problem) {
        problemCounts[alert.common_problem] = (problemCounts[alert.common_problem] || 0) + 1;
      } else if (alert.description) {
        problemCounts[alert.description.substring(0, 30)] = (problemCounts[alert.description.substring(0, 30)] || 0) + 1;
      }
    });
    
    let mostFrequentIssue = '';
    let highestCount = 0;
    
    Object.entries(problemCounts).forEach(([problem, count]) => {
      if (count > highestCount) {
        highestCount = count;
        mostFrequentIssue = problem;
      }
    });
    
    // Stats by equipment
    const equipmentStats = {};
    
    for (let i = 1; i <= 4; i++) {
      const equipment = getEquipmentType(i.toString());
      const alertsForEquipment = allAlerts.filter(alert => parseInt(alert.robot_number) === i);
      
      equipmentStats[i] = {
        name: `${equipment.type} ${equipment.number}`,
        alertCount: alertsForEquipment.length,
        activeCount: alerts.filter(alert => parseInt(alert.robot_number) === i).length,
        resolvedCount: resolvedAlerts.filter(alert => parseInt(alert.robot_number) === i).length,
        downTime: calculateTotalDowntime(alertsForEquipment),
        gender: equipment.gender
      };
    }
    
    setStats({
      totalAlerts: allAlerts.length,
      criticalAlerts: criticalCount,
      warningAlerts: warningCount,
      avgResolutionTime: avgTime,
      mostFrequentIssue: mostFrequentIssue || 'N/A',
      equipmentStats
    });
  };
  
  const calculateTotalDowntime = (equipmentAlerts) => {
    let totalMinutes = 0;
    
    equipmentAlerts.forEach(alert => {
      if (alert.resolved_at && alert.created_at) {
        const startTime = new Date(alert.created_at);
        const endTime = new Date(alert.resolved_at);
        const minutes = Math.round((endTime - startTime) / (1000 * 60));
        
        if (!isNaN(minutes) && minutes >= 0) {
          totalMinutes += minutes;
        }
      } else if (alert.active && alert.created_at) {
        // For active alerts, calculate time until now
        const startTime = new Date(alert.created_at);
        const endTime = new Date();
        const minutes = Math.round((endTime - startTime) / (1000 * 60));
        
        if (!isNaN(minutes) && minutes >= 0) {
          totalMinutes += minutes;
        }
      }
    });
    
    return totalMinutes;
  };

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
      showToast('Erro ao buscar alertas resolvidos', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const addAlert = useCallback(async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      if (!newAlert.estimated_resolution) {
        showToast('Defina uma previsão de retorno', 'warning');
        setLoading(false);
        return;
      }

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
      
      const equipment = getEquipmentType(newAlert.robot_number);
      showToast(
        `Parada de ${equipment.type} ${equipment.number} registrada com sucesso`,
        'success'
      );
      
      setNewAlert({
        robot_number: '1',
        os_number: '',
        status: 'warning',
        description: '',
        estimated_resolution: '',
        common_problem: ''
      });
      setIsAddingAlert(false);
      onRefresh();
    } catch (error) {
      console.error('Error adding alert:', error);
      showToast('Erro ao registrar parada', 'error');
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

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMins = minutes % 60;
      return remainingMins > 0 ? `${hours}h ${remainingMins}min` : `${hours}h`;
    }
  };

  const CopyButton = ({ text }) => {
    const handleCopy = () => {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Informações copiadas para área de transferência', 'success');
      });
    };
    
    return (
      <button
        onClick={handleCopy}
        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        title="Copiar informações"
      >
        <ClipboardDocumentIcon className="h-4 w-4" />
      </button>
    );
  };

  const AlertCard = useCallback(({ alert, isResolved = false, showActions = true }) => {
    const isWarning = alert.status === 'warning';
    const statusColor = isWarning 
      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
    
    const equipment = getEquipmentType(alert.robot_number);
    
    // Calculate duration
    let duration = '';
    if (isResolved && alert.created_at && alert.resolved_at) {
      const startTime = new Date(alert.created_at);
      const endTime = new Date(alert.resolved_at);
      const minutes = Math.round((endTime - startTime) / (1000 * 60));
      
      if (!isNaN(minutes) && minutes >= 0) {
        duration = formatDuration(minutes);
      }
    } else if (alert.created_at) {
      const startTime = new Date(alert.created_at);
      const endTime = new Date();
      const minutes = Math.round((endTime - startTime) / (1000 * 60));
      
      if (!isNaN(minutes) && minutes >= 0) {
        duration = formatDuration(minutes);
      }
    }
    
    // Generate copy text
    const copyText = `
${equipment.type} ${equipment.number} - ${alert.status === 'warning' ? 'Alerta' : 'Crítico'}
OS: ${alert.os_number || 'N/A'}
Início: ${formatDateTime(alert.created_at)}
${isResolved ? `Resolvido: ${formatDateTime(alert.resolved_at)}` : `Previsão: ${formatDateTime(alert.estimated_resolution)}`}
${duration ? `Duração: ${duration}` : ''}
Problema: ${alert.common_problem || ''}
Descrição: ${alert.description || ''}
    `.trim();

    return (
      <div className="mb-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-full flex-shrink-0 ${
                isWarning 
                  ? 'bg-amber-100 dark:bg-amber-900/30' 
                  : 'bg-red-100 dark:bg-red-900/30'
              }`}>
                {isWarning 
                  ? <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" /> 
                  : <FireIconSolid className="h-5 w-5 text-red-600 dark:text-red-400" />
                }
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                    <span className="flex items-center">
                      {equipment.icon}
                      <span className="ml-1">
                        {equipment.type} {equipment.number}
                      </span>
                    </span>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${statusColor}`}>
                      {alert.status === 'warning' ? 'Alerta' : 'Crítico'}
                    </span>
                  </h3>
                </div>
                
                {alert.os_number && (
                  <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center">
                    <DocumentTextIcon className="h-3.5 w-3.5 mr-1 inline" />
                    OS: {alert.os_number}
                  </p>
                )}
                
                {alert.common_problem && (
                  <div className="my-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400">
                      <WrenchScrewdriverIcon className="h-3.5 w-3.5 mr-1" />
                      {alert.common_problem}
                    </span>
                  </div>
                )}
                
                {alert.description && (
                  <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {alert.description}
                  </p>
                )}

                <div className="mt-2 grid grid-cols-2 gap-1">
                  <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                    <CalendarIcon className="h-3.5 w-3.5 mr-1 text-gray-500 dark:text-gray-400" />
                    <span>Início: {formatDateTime(alert.created_at)}</span>
                  </div>

                  {isResolved && alert.resolved_at ? (
                    <div className="text-xs text-green-600 dark:text-green-400 flex items-center">
                      <CheckCircleIcon className="h-3.5 w-3.5 mr-1" />
                      <span>Resolvido: {formatDateTime(alert.resolved_at)}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center">
                      <ClockIcon className="h-3.5 w-3.5 mr-1" />
                      <span>Previsão: {formatDateTime(alert.estimated_resolution)}</span>
                    </div>
                  )}
                </div>
                
                {duration && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                      <ClockIcon className="h-3.5 w-3.5 mr-1" />
                      {isResolved ? 'Duração' : 'Parado há'}: {duration}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-start space-x-1">
              <CopyButton text={copyText} />
              
              {showActions && !isResolved && (
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
      </div>
    );
  }, [formatDateTime, onResolve]);

  const EquipmentStatusCard = useCallback(({ robotNumber }) => {
    const equipment = getEquipmentType(robotNumber);
    const activeAlerts = alerts.filter(a => parseInt(a.robot_number) === parseInt(robotNumber));
    const isActive = activeAlerts.length === 0;
    
    const equipmentStat = stats.equipmentStats[robotNumber];
    
    const bgColorClass = isActive 
      ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/10 dark:to-green-900/20 border-green-200 dark:border-green-900/30' 
      : 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/10 dark:to-red-900/20 border-red-200 dark:border-red-900/30';
    
    const iconColorClass = isActive 
      ? 'text-green-500 dark:text-green-400' 
      : 'text-red-500 dark:text-red-400';
    
    return (
      <div 
        className={`rounded-lg border ${bgColorClass} p-4 transition-all hover:shadow-md cursor-pointer`}
        onClick={() => setSelectedRobot(activeAlerts.length > 0 ? robotNumber : selectedRobot)}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full bg-white dark:bg-gray-800 ${iconColorClass}`}>
              {equipment.icon}
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                {equipment.type} {equipment.number}
              </h3>
              <p className={`text-sm ${isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {isActive ? 'Operacional' : `${activeAlerts.length} ${activeAlerts.length === 1 ? 'parada' : 'paradas'}`}
              </p>
            </div>
          </div>
          
          {equipmentStat && (
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {equipmentStat.alertCount > 0 && (
                  <div className="flex items-center justify-end">
                    <span className="text-xs mr-1">Total:</span>
                    <span className="font-semibold">{equipmentStat.alertCount}</span>
                  </div>
                )}
                {equipmentStat.downTime > 0 && (
                  <div className="flex items-center justify-end">
                    <span className="text-xs mr-1">Tempo:</span>
                    <span className="font-semibold">{formatDuration(equipmentStat.downTime)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }, [alerts, stats, selectedRobot]);

  const AddAlertForm = useMemo(() => {
    return (
      <form onSubmit={addAlert} className="space-y-4 mt-4 border-t dark:border-gray-700 pt-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Registrar Nova Parada</h3>
          <button
            type="button"
            onClick={() => setIsAddingAlert(false)}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Equipamento
            </label>
            <select
              name="robot_number"
              value={newAlert.robot_number}
              onChange={handleInputChange}
              className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm transition-colors focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              required
              autoComplete="off"
            >
              <option value="1">Robô 1</option>
              <option value="2">Robô 2</option>
              <option value="3">Lançadeira 1</option>
              <option value="4">Lançadeira 2</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Número OS
            </label>
            <div className="relative">
              <input
                type="text"
                name="os_number"
                value={newAlert.os_number}
                onChange={handleInputChange}
                placeholder="25789"
                className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm transition-colors focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                required
                autoComplete="off"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setNewAlert(prev => ({ ...prev, os_number: 'N/A' }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[10px] bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-500"
              >
                N/A
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Prioridade
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input 
                type="radio" 
                name="status"
                value="warning"
                checked={newAlert.status === 'warning'}
                onChange={handleInputChange}
                className="mr-2 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1 text-amber-500" />
                Alerta
              </span>
            </label>
            <label className="flex items-center">
              <input 
                type="radio" 
                name="status"
                value="critical"
                checked={newAlert.status === 'critical'}
                onChange={handleInputChange}
                className="mr-2 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                <FireIcon className="h-4 w-4 mr-1 text-red-500" />
                Crítico
              </span>
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
            className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm transition-colors focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            required
            autoComplete="off"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Problema Recorrente
          </label>
          <select
            name="common_problem"
            value={newAlert.common_problem}
            onChange={handleInputChange}
            className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm transition-colors focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            autoComplete="off"
          >
            <option value="">Selecione um problema</option>
            <option value="Palete empurrado">Palete empurrado</option>
            <option value="Pani elétrica">Pani elétrica</option>
            <option value="Pani mecânica">Pani mecânica</option>
            <option value="Falha de comunicação">Falha de comunicação</option>
            <option value="Falha de sensor">Falha de sensor</option>
            <option value="Palete quebrado">Palete quebrado</option>
          </select>
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
            className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm transition-colors focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            autoComplete="off"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => setIsAddingAlert(false)}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Salvando...
              </span>
            ) : 'Registrar Parada'}
          </button>
        </div>
      </form>
    );
  }, [newAlert, handleInputChange, addAlert, loading]);

  // Setup realtime subscription for robot_alerts and robot_status
  useEffect(() => {
    if (isOpen) {
      const alertsSub = setupRealtimeSubscription('robot_alerts', handleRobotAlertChange);
      const statusSub = setupRealtimeSubscription('robot_status', handleRobotStatusChange);
      
      // Store subscriptions to clean up later
      setSubscription({ alerts: alertsSub, status: statusSub });
      
      // Fetch current robot status
      fetchRobotStatus();
      
      // Update time every minute for "time ago" calculations
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 60000);
      
      return () => {
        if (subscription) {
          removeSubscription(subscription.alerts);
          removeSubscription(subscription.status);
        }
        clearInterval(timer);
      };
    }
  }, [isOpen]);

  const fetchRobotStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('robot_status')
        .select('*');
      
      if (error) throw error;
      
      // Convert array to object with robot_id as key
      const statusMap = {};
      data.forEach(status => {
        statusMap[status.robot_id] = status;
      });
      
      setRobotStatus(statusMap);
    } catch (error) {
      console.error('Error fetching robot status:', error);
    }
  };

  const handleRobotAlertChange = (payload) => {
    console.log('Robot alert change:', payload);
    onRefresh(); // Refresh alerts list
  };

  const handleRobotStatusChange = (payload) => {
    console.log('Robot status change:', payload);
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    if (eventType === 'INSERT' || eventType === 'UPDATE') {
      setRobotStatus(prev => ({
        ...prev,
        [newRecord.robot_id]: newRecord
      }));
    }
  };

  const calculateInactiveTime = (lastActiveTime) => {
    if (!lastActiveTime) return 'Tempo desconhecido';
    
    try {
      const lastActive = new Date(lastActiveTime);
      return formatDistanceToNow(lastActive, { addSuffix: true, locale: ptBR });
    } catch (error) {
      return 'Tempo inválido';
    }
  };

  // Handle click outside to close modal with animation
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const filteredAlerts = useMemo(() => {
    if (selectedRobot === 'all') return alerts;
    return alerts.filter(alert => parseInt(alert.robot_number) === parseInt(selectedRobot));
  }, [alerts, selectedRobot]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div 
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity duration-200" 
          onClick={onClose}
        ></div>
        
        <div 
          ref={modalRef}
          className="relative bg-white dark:bg-gray-900 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-2xl w-full max-w-4xl transform transition-all duration-200 animate-fade-scale-in"
        >
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                <WrenchIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Status dos Equipamentos
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Gerenciamento de paradas de robôs e lançadeiras
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setStatsVisible(!statsVisible)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Estatísticas"
              >
                <ChartBarIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => fetchResolvedAlerts()}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Atualizar dados"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
              <button 
                onClick={onClose} 
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {statsVisible && (
              <div className="mb-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800/90 dark:to-gray-900/90 shadow-md rounded-xl border border-gray-200/80 dark:border-gray-700/50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Total de paradas
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                          {stats.totalAlerts}
                        </p>
                      </div>
                      <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg shadow-md flex items-center justify-center">
                        <WrenchIcon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800/90 dark:to-gray-900/90 shadow-md rounded-xl border border-gray-200/80 dark:border-gray-700/50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Paradas críticas
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                          <span className="text-red-600 dark:text-red-400">{stats.criticalAlerts}</span>
                        </p>
                      </div>
                      <div className="h-10 w-10 bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 rounded-lg shadow-md flex items-center justify-center">
                        <FireIcon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800/90 dark:to-gray-900/90 shadow-md rounded-xl border border-gray-200/80 dark:border-gray-700/50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Tempo médio
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                          <span className="text-amber-600 dark:text-amber-400">
                            {stats.avgResolutionTime > 0 
                              ? formatDuration(stats.avgResolutionTime)
                              : '-'}
                          </span>
                        </p>
                      </div>
                      <div className="h-10 w-10 bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 rounded-lg shadow-md flex items-center justify-center">
                        <ClockIcon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800/90 dark:to-gray-900/90 shadow-md rounded-xl border border-gray-200/80 dark:border-gray-700/50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Problema comum
                        </p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white mt-1 truncate max-w-[180px]">
                          <span className="text-purple-600 dark:text-purple-400">{stats.mostFrequentIssue}</span>
                        </p>
                      </div>
                      <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-lg shadow-md flex items-center justify-center">
                        <BoltIcon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <EquipmentStatusCard robotNumber="1" />
                  <EquipmentStatusCard robotNumber="2" />
                  <EquipmentStatusCard robotNumber="3" />
                  <EquipmentStatusCard robotNumber="4" />
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-2/3">
                <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg mb-4">
                  <button
                    onClick={() => setTab('active')}
                    className={`flex-1 text-sm py-2 rounded-md ${
                      tab === 'active'
                        ? 'bg-white dark:bg-gray-700 shadow-sm font-medium text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    Paradas Ativas
                  </button>
                  <button
                    onClick={() => setTab('resolved')}
                    className={`flex-1 text-sm py-2 rounded-md ${
                      tab === 'resolved'
                        ? 'bg-white dark:bg-gray-700 shadow-sm font-medium text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    Histórico
                  </button>
                </div>

                {tab === 'active' && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Paradas em andamento
                        </h3>
                        {selectedRobot !== 'all' && (
                          <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium px-2.5 py-0.5 rounded">
                            Filtrado
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <select 
                          value={selectedRobot} 
                          onChange={(e) => setSelectedRobot(e.target.value)}
                          className="text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg py-1 px-2"
                        >
                          <option value="all">Todos Equipamentos</option>
                          <option value="1">Robô 1</option>
                          <option value="2">Robô 2</option>
                          <option value="3">Lançadeira 1</option>
                          <option value="4">Lançadeira 2</option>
                        </select>
                      </div>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                      {filteredAlerts.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                          <div className="inline-flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 rounded-full mb-4">
                            <CheckCircleIcon className="h-8 w-8" />
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 mb-2">
                            Todos os equipamentos estão operacionais!
                          </p>
                          <p className="text-sm text-gray-400 dark:text-gray-500">
                            Não há paradas ativas neste momento.
                          </p>
                        </div>
                      ) : (
                        filteredAlerts.map(alert => (
                          <AlertCard key={alert.id} alert={alert} />
                        ))
                      )}
                    </div>
                  </div>
                )}

                {tab === 'resolved' && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Paradas resolvidas
                    </h3>

                    <div className="max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                      {loading ? (
                        <div className="flex flex-col justify-center items-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                          <div className="relative h-12 w-12 mb-4">
                            <div className="absolute inset-0 rounded-full border-t-2 border-blue-500 dark:border-blue-400 animate-spin"></div>
                            <div className="absolute inset-1 rounded-full border-r-2 border-indigo-500 dark:border-indigo-400 animate-spin animation-delay-150"></div>
                            <div className="absolute inset-2 rounded-full border-b-2 border-purple-500 dark:border-purple-400 animate-spin animation-delay-300"></div>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300">Carregando histórico...</p>
                        </div>
                      ) : resolvedAlerts.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                          <div className="inline-flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full mb-4">
                            <ClockIcon className="h-8 w-8" />
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 mb-2">
                            Nenhum registro encontrado
                          </p>
                          <p className="text-sm text-gray-400 dark:text-gray-500">
                            Não há histórico de paradas resolvidas.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              Últimas {resolvedAlerts.length} ocorrências resolvidas
                            </h4>
                            <button 
                              onClick={fetchResolvedAlerts}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                              title="Atualizar histórico"
                            >
                              <ArrowPathIcon className="h-4 w-4" />
                            </button>
                          </div>
                          {resolvedAlerts.map(alert => (
                            <AlertCard key={alert.id} alert={alert} isResolved={true} />
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="w-full md:w-1/3">
                {tab === 'active' && !isAddingAlert ? (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-100 dark:border-blue-800/30 rounded-lg p-6 text-center">
                    <WrenchIcon className="h-12 w-12 text-blue-500 dark:text-blue-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Registrar nova parada
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      Adicione um registro de parada para um robô ou lançadeira para acompanhamento.
                    </p>
                    <button
                      onClick={() => setIsAddingAlert(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                    >
                      <PlusCircleIcon className="h-5 w-5" />
                      Registrar Nova Parada
                    </button>
                  </div>
                ) : tab === 'active' && isAddingAlert && (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    {AddAlertForm}
                  </div>
                )}

                {tab === 'resolved' && (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Resumo do histórico
                    </h3>
                    
                    {resolvedAlerts.length > 0 ? (
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center text-sm mb-1">
                            <span className="text-gray-500 dark:text-gray-400">Resolvidas hoje:</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {resolvedAlerts.filter(a => {
                                const date = new Date(a.resolved_at);
                                const today = new Date();
                                return date.toDateString() === today.toDateString();
                              }).length}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center text-sm mb-1">
                            <span className="text-gray-500 dark:text-gray-400">Críticas resolvidas:</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {resolvedAlerts.filter(a => a.status === 'critical').length}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center text-sm mb-1">
                            <span className="text-gray-500 dark:text-gray-400">Tempo médio:</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {stats.avgResolutionTime > 0 
                                ? formatDuration(stats.avgResolutionTime)
                                : '-'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Histórico por equipamento:
                          </h4>
                          
                          {Object.entries(stats.equipmentStats).map(([robotNumber, stat]) => (
                            <div key={robotNumber} className="flex justify-between items-center text-sm mb-1.5">
                              <span className="text-gray-600 dark:text-gray-400 flex items-center">
                                <span className="inline-block w-2 h-2 mr-1.5 rounded-full bg-blue-500"></span>
                                {stat.name}:
                              </span>
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                {stat.resolvedCount} parada{stat.resolvedCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Nenhum dado disponível
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
