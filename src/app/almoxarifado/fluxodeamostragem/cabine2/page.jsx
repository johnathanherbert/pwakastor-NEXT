'use client';
import { useState, useEffect, useRef } from "react";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/supabaseClient";
import { 
  XMarkIcon, 
  PlayIcon, 
  PauseIcon, 
  ArrowPathIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import { showToast } from '@/components/Toast/ToastContainer';
import Loading from '@/components/ui/Loading';

export default function OEECabine2() {
  // Estado para controlar a sidebar
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Usando o hook useTheme para acessar o dark mode global
  const { darkMode } = useTheme();

  // Estados para gerenciamento de dados
  const [ntsDisponiveis, setNtsDisponiveis] = useState([]);
  const [ntSelecionada, setNtSelecionada] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [operadorId, setOperadorId] = useState("");
  const [showOperadorInput, setShowOperadorInput] = useState(false);
  
  // Estados para OEE
  const [oeeEmAndamento, setOeeEmAndamento] = useState(false);
  const [tempoInicio, setTempoInicio] = useState(null);
  const [tempoDecorrido, setTempoDecorrido] = useState(0);
  const [statusAtual, setStatusAtual] = useState("aguardando"); // aguardando, em_andamento, pausado, finalizado
  const [motivoPausa, setMotivoPausa] = useState("");
  const [showPausaModal, setShowPausaModal] = useState(false);
  const [historicoParadas, setHistoricoParadas] = useState([]);
  
  // Referência para intervalo do temporizador
  const timerRef = useRef(null);
  
  // Carregar dados ao montar o componente
  useEffect(() => {
    fetchNTsDisponiveis();
    
    // Verificar se há alguma NT já em andamento na cabine 2
    verificarNTEmAndamento();
    
    // Configurar listeners para atualizações em tempo real
    const ntChannel = supabase
      .channel('cabine2-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'nts_amostragem_items' }, (payload) => {
        if (payload.new && payload.new.cabine === 'Cabine 2') {
          fetchNTsDisponiveis();
          verificarNTEmAndamento();
        }
      })
      .subscribe();
      
    // Limpar listeners e timer ao desmontar
    return () => {
      supabase.removeChannel(ntChannel);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Iniciar timer quando OEE estiver em andamento
  useEffect(() => {
    if (oeeEmAndamento && statusAtual === 'em_andamento') {
      timerRef.current = setInterval(() => {
        setTempoDecorrido(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [oeeEmAndamento, statusAtual]);

  // Formatar tempo decorrido
  const formatarTempo = (segundos) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };

  // Função para buscar NTs disponíveis para amostragem
  const fetchNTsDisponiveis = async () => {
    setIsLoading(true);
    try {
      // Buscar apenas NTs que não estão em uma cabine
      const { data: ntsItems, error } = await supabase
        .from('nts_amostragem_items')
        .select(`
          id,
          nt_id,
          code,
          description,
          quantity,
          batch,
          created_date,
          created_time,
          status,
          nts_amostragem (
            id,
            nt_number,
            created_date,
            created_time,
            status
          )
        `)
        .is('cabine', null)
        .eq('status', 'Ag. Amostragem');
        
      if (error) throw error;
      
      // Agrupar itens por NT
      const ntsAgrupadas = ntsItems.reduce((acc, item) => {
        if (!acc[item.nt_id]) {
          acc[item.nt_id] = {
            id: item.nt_id,
            nt_number: item.nts_amostragem.nt_number,
            created_date: item.nts_amostragem.created_date,
            created_time: item.nts_amostragem.created_time,
            status: item.nts_amostragem.status,
            itens: []
          };
        }
        acc[item.nt_id].itens.push(item);
        return acc;
      }, {});
      
      // Converter para array
      const ntsArray = Object.values(ntsAgrupadas);
      setNtsDisponiveis(ntsArray);
    } catch (error) {
      console.error("Erro ao buscar NTs disponíveis:", error);
      showToast("Erro ao carregar NTs disponíveis", "error");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para verificar se há uma NT já em andamento na cabine
  const verificarNTEmAndamento = async () => {
    try {
      const { data: emAndamento, error } = await supabase
        .from('nts_amostragem_items')
        .select(`
          id,
          nt_id,
          code,
          description,
          quantity,
          batch,
          created_date,
          created_time,
          status,
          cabine,
          sample_start_time,
          sample_operator_id,
          oee_status,
          oee_elapsed_time,
          nts_amostragem (
            id,
            nt_number,
            created_date,
            created_time,
            status
          )
        `)
        .eq('cabine', 'Cabine 2')
        .not('status', 'eq', 'Finalizado');
      
      if (error) throw error;
      
      if (emAndamento.length > 0) {
        // Agrupar itens por NT
        const ntItem = emAndamento[0];
        const nt = {
          id: ntItem.nt_id,
          nt_number: ntItem.nts_amostragem.nt_number,
          created_date: ntItem.nts_amostragem.created_date,
          created_time: ntItem.nts_amostragem.created_time,
          status: ntItem.nts_amostragem.status,
          itens: emAndamento
        };
        
        setNtSelecionada(nt);
        setOperadorId(ntItem.sample_operator_id || "");
        setOeeEmAndamento(true);
        setStatusAtual(ntItem.oee_status || 'em_andamento');
        setTempoDecorrido(ntItem.oee_elapsed_time || 0);
        
        // Buscar histórico de paradas
        buscarHistoricoParadas(nt.id);
      }
    } catch (error) {
      console.error("Erro ao verificar NT em andamento:", error);
    }
  };
  
  // Função para buscar histórico de paradas
  const buscarHistoricoParadas = async (ntId) => {
    try {
      const { data: paradas, error } = await supabase
        .from('nts_amostragem_oee_paradas')
        .select('*')
        .eq('nt_id', ntId)
        .eq('cabine', 'Cabine 2')
        .order('inicio_time', { ascending: false });
      
      if (error) throw error;
      
      setHistoricoParadas(paradas || []);
    } catch (error) {
      console.error("Erro ao buscar histórico de paradas:", error);
    }
  };
  
  // Selecionar uma NT para amostragem
  const handleSelecionarNT = async (nt) => {
    try {
      // Marcar todos os itens desta NT como "Em Seleção" para que não apareçam em outras cabines
      const { error } = await supabase
        .from('nts_amostragem_items')
        .update({
          cabine: 'Em Seleção',
          status: 'Em Seleção'
        })
        .eq('nt_id', nt.id);

      if (error) throw error;
      
      // Atualizar estado local
      setNtSelecionada(nt);
      setShowOperadorInput(true);
      
      // Atualizar lista de NTs disponíveis para remover esta NT
      fetchNTsDisponiveis();
      
    } catch (error) {
      console.error("Erro ao selecionar NT:", error);
      showToast("Erro ao selecionar NT", "error");
    }
  };
  
  // Iniciar processo de amostragem
  const handleIniciarAmostragem = async () => {
    if (!operadorId.trim()) {
      showToast("Por favor, informe o ID do operador", "error");
      return;
    }
    
    try {
      // Atualizar todos os itens da NT para status "Em Amostragem" e alocar para a cabine 2
      const now = new Date();
      const formattedDate = now.toLocaleDateString('pt-BR');
      const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      const { error } = await supabase
        .from('nts_amostragem_items')
        .update({
          cabine: 'Cabine 2',
          status: 'Em Amostragem',
          sample_start_date: formattedDate,
          sample_start_time: formattedTime,
          sample_operator_id: operadorId,
          oee_status: 'em_andamento',
          oee_elapsed_time: 0
        })
        .eq('nt_id', ntSelecionada.id);
      
      if (error) throw error;
      
      // Registrar início do OEE
      const { error: oeeError } = await supabase
        .from('nts_amostragem_oee')
        .insert({
          nt_id: ntSelecionada.id,
          operador_id: operadorId,
          cabine: 'Cabine 2',
          inicio_date: formattedDate,
          inicio_time: formattedTime,
          status: 'em_andamento'
        });
      
      if (oeeError) throw oeeError;
      
      setOeeEmAndamento(true);
      setTempoInicio(now);
      setStatusAtual('em_andamento');
      setTempoDecorrido(0);
      setShowOperadorInput(false);
      
      showToast("Amostragem iniciada com sucesso", "success");
      
      // Atualizar lista de NTs disponíveis
      fetchNTsDisponiveis();
    } catch (error) {
      console.error("Erro ao iniciar amostragem:", error);
      showToast("Erro ao iniciar amostragem", "error");
    }
  };
  
  // Pausar processo de amostragem
  const handlePausarAmostragem = async () => {
    setShowPausaModal(true);
  };
  
  // Confirmar pausa
  const handleConfirmarPausa = async (motivo) => {
    try {
      const now = new Date();
      const formattedDate = now.toLocaleDateString('pt-BR');
      const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      // Registrar parada na tabela de paradas
      const { error } = await supabase
        .from('nts_amostragem_oee_paradas')
        .insert({
          nt_id: ntSelecionada.id,
          cabine: 'Cabine 2',
          operador_id: operadorId,
          motivo: motivo,
          inicio_date: formattedDate,
          inicio_time: formattedTime,
          status: 'em_andamento'
        });
      
      if (error) throw error;
      
      // Atualizar status dos itens
      const { error: updateError } = await supabase
        .from('nts_amostragem_items')
        .update({
          oee_status: 'pausado',
          oee_elapsed_time: tempoDecorrido
        })
        .eq('nt_id', ntSelecionada.id)
        .eq('cabine', 'Cabine 2');
      
      if (updateError) throw updateError;
      
      // Atualizar estado local
      setStatusAtual('pausado');
      setMotivoPausa(motivo);
      setShowPausaModal(false);
      
      // Atualizar histórico de paradas
      buscarHistoricoParadas(ntSelecionada.id);
      
      showToast("Amostragem pausada: " + motivo, "info");
    } catch (error) {
      console.error("Erro ao pausar amostragem:", error);
      showToast("Erro ao pausar amostragem", "error");
    }
  };
  
  // Retomar processo de amostragem
  const handleRetomarAmostragem = async () => {
    try {
      const now = new Date();
      const formattedDate = now.toLocaleDateString('pt-BR');
      const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      // Finalizar parada atual
      const ultimaParada = historicoParadas.find(p => p.status === 'em_andamento');
      
      if (ultimaParada) {
        const { error } = await supabase
          .from('nts_amostragem_oee_paradas')
          .update({
            fim_date: formattedDate,
            fim_time: formattedTime,
            status: 'finalizado'
          })
          .eq('id', ultimaParada.id);
        
        if (error) throw error;
      }
      
      // Atualizar status dos itens
      const { error: updateError } = await supabase
        .from('nts_amostragem_items')
        .update({
          oee_status: 'em_andamento',
          oee_elapsed_time: tempoDecorrido
        })
        .eq('nt_id', ntSelecionada.id)
        .eq('cabine', 'Cabine 2');
      
      if (updateError) throw updateError;
      
      // Atualizar estado local
      setStatusAtual('em_andamento');
      setMotivoPausa("");
      
      // Atualizar histórico de paradas
      buscarHistoricoParadas(ntSelecionada.id);
      
      showToast("Amostragem retomada", "success");
    } catch (error) {
      console.error("Erro ao retomar amostragem:", error);
      showToast("Erro ao retomar amostragem", "error");
    }
  };
  
  // Finalizar processo de amostragem
  const handleFinalizarAmostragem = async () => {
    try {
      const now = new Date();
      const formattedDate = now.toLocaleDateString('pt-BR');
      const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      // Finalizar todas as paradas em andamento
      const paradasEmAndamento = historicoParadas.filter(p => p.status === 'em_andamento');
      
      for (const parada of paradasEmAndamento) {
        await supabase
          .from('nts_amostragem_oee_paradas')
          .update({
            fim_date: formattedDate,
            fim_time: formattedTime,
            status: 'finalizado'
          })
          .eq('id', parada.id);
      }
      
      // Atualizar registro de OEE
      const { error: oeeError } = await supabase
        .from('nts_amostragem_oee')
        .update({
          fim_date: formattedDate,
          fim_time: formattedTime,
          total_duration: tempoDecorrido,
          status: 'finalizado'
        })
        .eq('nt_id', ntSelecionada.id)
        .eq('cabine', 'Cabine 2')
        .is('fim_date', null);
      
      if (oeeError) throw oeeError;
      
      // Atualizar status dos itens para "Ag. Baixa"
      const { error: updateError } = await supabase
        .from('nts_amostragem_items')
        .update({
          status: 'Ag. Baixa',
          cabine: null, // Liberar a cabine removendo a associação
          sample_finish_date: formattedDate,
          sample_finish_time: formattedTime,
          oee_status: 'finalizado',
          oee_elapsed_time: tempoDecorrido
        })
        .eq('nt_id', ntSelecionada.id)
        .eq('cabine', 'Cabine 2');
      
      if (updateError) throw updateError;
      
      // Registrar resultados da amostragem (apenas como exemplo, pode ser expandido conforme necessário)
      const { error: resultadoError } = await supabase
        .from('nts_amostragem_resultados')
        .insert({
          nt_id: ntSelecionada.id,
          cabine: 'Cabine 2',
          operador_id: operadorId,
          data_finalizacao: formattedDate,
          hora_finalizacao: formattedTime,
          tempo_total: tempoDecorrido,
          observacoes: 'Amostragem finalizada com sucesso'
        });
      
      if (resultadoError && resultadoError.code !== '42P01') { // Ignora erro se a tabela não existir
        console.error('Erro ao registrar resultado:', resultadoError);
      }
      
      // Mostrar feedback visual
      showToast("Amostragem finalizada com sucesso. NT movida para área de baixa.", "success");
      
      // Resetar o estado da cabine
      setOeeEmAndamento(false);
      setNtSelecionada(null);
      setOperadorId("");
      setStatusAtual("aguardando");
      setTempoDecorrido(0);
      setHistoricoParadas([]);
      
      // Atualizar lista de NTs disponíveis
      fetchNTsDisponiveis();
      
      // Atualizar mensagem para o usuário
      showToast("Cabine 2 está disponível para nova amostragem", "info", 5000);
    } catch (error) {
      console.error("Erro ao finalizar amostragem:", error);
      showToast("Erro ao finalizar amostragem", "error");
    }
  };
  
  // Periodicamente atualizar o tempo decorrido na base de dados
  useEffect(() => {
    const atualizarTempoBD = async () => {
      if (oeeEmAndamento && ntSelecionada && statusAtual === 'em_andamento') {
        try {
          await supabase
            .from('nts_amostragem_items')
            .update({
              oee_elapsed_time: tempoDecorrido
            })
            .eq('nt_id', ntSelecionada.id)
            .eq('cabine', 'Cabine 2');
        } catch (error) {
          console.error("Erro ao atualizar tempo:", error);
        }
      }
    };
    
    // Atualizar a cada 30 segundos
    const intervalo = setInterval(atualizarTempoBD, 30000);
    
    return () => clearInterval(intervalo);
  }, [oeeEmAndamento, tempoDecorrido, ntSelecionada, statusAtual]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <Topbar 
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
        title="OEE de Amostragem - Cabine 2"
      />
      
      <main className="pt-20 px-6 max-w-7xl mx-auto pb-12">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
            <BeakerIcon className="h-7 w-7 mr-2 text-purple-600 dark:text-purple-400" />
            OEE de Amostragem - Cabine 2
          </h1>
          
          {ntSelecionada && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                NT #{ntSelecionada.nt_number}
              </span>
              
              {oeeEmAndamento && (
                <div className="flex items-center gap-2 ml-4">
                  <div className={`h-2 w-2 rounded-full ${
                    statusAtual === 'em_andamento' ? 'bg-green-500 animate-pulse' : 
                    statusAtual === 'pausado' ? 'bg-yellow-500' : 'bg-gray-400'
                  }`}></div>
                  
                  <span className="text-sm font-medium">
                    {formatarTempo(tempoDecorrido)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {ntSelecionada ? (
          <div className="space-y-6">
            {/* Card da NT em amostragem */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-medium text-gray-900 dark:text-white">
                    NT #{ntSelecionada.nt_number}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Criada em {ntSelecionada.created_date} às {ntSelecionada.created_time}
                  </p>
                  
                  {operadorId && (
                    <div className="mt-2 flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Operador: {operadorId}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col items-end">
                  <div className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    statusAtual === 'em_andamento' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                    statusAtual === 'pausado' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {statusAtual === 'em_andamento' ? 'Em amostragem' :
                     statusAtual === 'pausado' ? 'Pausado' : 'Aguardando'}
                  </div>
                  
                  {motivoPausa && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                      Motivo: {motivoPausa}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Itens para amostragem ({ntSelecionada.itens?.length || 0})
                </h3>
                
                <div className="overflow-y-auto max-h-64 pr-1">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Código
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Descrição
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Qtd
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Lote
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {ntSelecionada.itens?.map((item, index) => (
                        <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-800'}>
                          <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                            {item.code}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                            {item.description}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                            {item.quantity}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                            {item.batch}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {!oeeEmAndamento && showOperadorInput && (
                <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="w-full sm:w-64">
                      <label htmlFor="operador-id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        ID do Operador
                      </label>
                      <input
                        type="text"
                        id="operador-id"
                        value={operadorId}
                        onChange={(e) => setOperadorId(e.target.value)}
                        className="w-full px-3.5 py-2 
                          bg-white dark:bg-gray-700
                          border border-gray-200 dark:border-gray-600 
                          rounded-lg text-gray-900 dark:text-gray-100
                          placeholder-gray-400 dark:placeholder-gray-400
                          focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
                          focus:border-transparent transition-colors"
                        placeholder="Digite o ID do operador"
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-6 sm:pt-0">
                      <button
                        onClick={() => setNtSelecionada(null)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                                bg-white dark:bg-gray-800 
                                border border-gray-300 dark:border-gray-600 
                                rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 
                                focus:z-10 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 
                                transition-colors shadow-sm"
                      >
                        Cancelar
                      </button>
                      
                      <button
                        onClick={handleIniciarAmostragem}
                        disabled={!operadorId.trim()}
                        className="px-4 py-2 text-sm font-medium text-white 
                                bg-green-600 dark:bg-green-500 
                                rounded-lg hover:bg-green-700 dark:hover:bg-green-600 
                                focus:z-10 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 
                                transition-colors shadow-sm flex items-center gap-2
                                disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <PlayIcon className="h-4 w-4" />
                        Iniciar Amostragem
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {oeeEmAndamento && (
              <>
                {/* Controles OEE */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
                    Controles de OEE
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Tempo Decorrido</p>
                        <p className="text-xl font-semibold text-gray-900 dark:text-white">{formatarTempo(tempoDecorrido)}</p>
                      </div>
                      <ClockIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Status</p>
                        <p className={`text-xl font-semibold ${
                          statusAtual === 'em_andamento' ? 'text-green-600 dark:text-green-400' :
                          statusAtual === 'pausado' ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-gray-900 dark:text-white'
                        }`}>
                          {statusAtual === 'em_andamento' ? 'Em Andamento' :
                           statusAtual === 'pausado' ? 'Pausado' :
                           'Aguardando'}
                        </p>
                      </div>
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        statusAtual === 'em_andamento' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                        statusAtual === 'pausado' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                        'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400'
                      }`}>
                        {statusAtual === 'em_andamento' && <PlayIcon className="h-5 w-5" />}
                        {statusAtual === 'pausado' && <PauseIcon className="h-5 w-5" />}
                        {statusAtual === 'aguardando' && <ClockIcon className="h-5 w-5" />}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Paradas</p>
                        <p className="text-xl font-semibold text-gray-900 dark:text-white">{historicoParadas.length}</p>
                      </div>
                      <ExclamationTriangleIcon className="h-8 w-8 text-amber-400 dark:text-amber-500" />
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Operador</p>
                        <p className="text-xl font-semibold text-gray-900 dark:text-white">{operadorId || "-"}</p>
                      </div>
                      <UserIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-center gap-4">
                    {statusAtual === 'em_andamento' ? (
                      <button
                        onClick={handlePausarAmostragem}
                        className="px-6 py-2.5 text-sm font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300
                                rounded-md hover:bg-yellow-200 dark:hover:bg-yellow-800/40 transition-colors shadow-sm
                                border border-yellow-200/50 dark:border-yellow-700/30 flex items-center gap-2"
                      >
                        <PauseIcon className="h-4 w-4" />
                        Pausar Amostragem
                      </button>
                    ) : (
                      <button
                        onClick={handleRetomarAmostragem}
                        className="px-6 py-2.5 text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300
                                rounded-md hover:bg-green-200 dark:hover:bg-green-800/40 transition-colors shadow-sm
                                border border-green-200/50 dark:border-green-700/30 flex items-center gap-2"
                      >
                        <PlayIcon className="h-4 w-4" />
                        Retomar Amostragem
                      </button>
                    )}
                    
                    <button
                      onClick={handleFinalizarAmostragem}
                      className="px-6 py-2.5 text-sm font-medium bg-blue-600 dark:bg-blue-500 text-white
                              rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-sm
                              flex items-center gap-2"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                      Finalizar Amostragem
                    </button>
                  </div>
                </div>
                
                {/* Histórico de paradas */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
                    Histórico de Paradas
                  </h3>
                  
                  {historicoParadas.length === 0 ? (
                    <p className="text-center py-6 text-gray-500 dark:text-gray-400">
                      Nenhuma parada registrada
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Motivo</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Início</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fim</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {historicoParadas.map((parada) => (
                            <tr key={parada.id}>
                              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{parada.motivo}</td>
                              <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                                {parada.inicio_date} às {parada.inicio_time}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                                {parada.fim_date ? `${parada.fim_date} às ${parada.fim_time}` : '-'}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                                  ${parada.status === 'em_andamento' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : 
                                  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}>
                                  {parada.status === 'em_andamento' ? 'Em andamento' : 'Finalizado'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* NTs disponíveis para amostragem */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
                NTs Disponíveis para Amostragem
              </h2>
              
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loading 
                    size="medium" 
                    message="Carregando NTs disponíveis..." 
                    logoVisible={false}
                    className="min-h-0 bg-transparent"
                  />
                </div>
              ) : ntsDisponiveis.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                  <div className="mx-auto h-12 w-12 text-gray-400 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                    <BeakerIcon className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Nenhuma NT disponível para amostragem
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Todas as NTs estão em processamento ou não há NTs aguardando amostragem.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {ntsDisponiveis.map(nt => (
                    <div 
                      key={nt.id}
                      className="bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-medium text-gray-800 dark:text-white">
                            NT #{nt.nt_number}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {nt.created_date} • {nt.created_time}
                          </p>
                        </div>
                        <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs px-2 py-0.5 rounded-full">
                          {nt.itens.length} itens
                        </span>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-600">
                        <div className="max-h-28 overflow-y-auto pr-1 mb-3">
                          <table className="min-w-full">
                            <thead>
                              <tr className="text-xs text-gray-500 dark:text-gray-400">
                                <th className="text-left py-1">Código</th>
                                <th className="text-left py-1">Descrição</th>
                                <th className="text-left py-1">Lote</th>
                              </tr>
                            </thead>
                            <tbody className="text-xs">
                              {nt.itens.map(item => (
                                <tr key={item.id}>
                                  <td className="py-1 text-gray-700 dark:text-gray-300">{item.code}</td>
                                  <td className="py-1 text-gray-700 dark:text-gray-300">
                                    {item.description.length > 30 ? 
                                      `${item.description.substring(0, 30)}...` : 
                                      item.description}
                                  </td>
                                  <td className="py-1 text-gray-700 dark:text-gray-300">{item.batch}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleSelecionarNT(nt)}
                            className="px-3 py-1.5 text-xs font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400
                                    rounded-md hover:bg-purple-100 dark:hover:bg-purple-800/40 transition-colors
                                    border border-purple-200/50 dark:border-purple-700/30"
                          >
                            Selecionar para Amostragem
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      
      {/* Modal de Pausa */}
      {showPausaModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center">
          <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setShowPausaModal(false)}></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md border border-gray-200/50 dark:border-gray-700/30">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <PauseIcon className="h-5 w-5 text-yellow-500" />
                Pausar Amostragem
              </h3>
              <button 
                onClick={() => setShowPausaModal(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label htmlFor="motivo-pausa" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Motivo da Pausa
                </label>
                <select
                  id="motivo-pausa"
                  className="w-full px-3.5 py-2.5 
                    bg-white dark:bg-gray-700
                    border border-gray-200 dark:border-gray-600 
                    rounded-lg text-gray-900 dark:text-gray-100
                    focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
                    focus:border-transparent transition-colors"
                  value={motivoPausa}
                  onChange={(e) => setMotivoPausa(e.target.value)}
                >
                  <option value="">Selecione um motivo</option>
                  <option value="Horário de Almoço">Horário de Almoço</option>
                  <option value="Pausa para Café">Pausa para Café</option>
                  <option value="Falha Técnica">Falha Técnica</option>
                  <option value="Manutenção de Equipamento">Manutenção de Equipamento</option>
                  <option value="Troca de Turno">Troca de Turno</option>
                  <option value="Reunião">Reunião</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              
              {motivoPausa === 'Outro' && (
                <div className="mb-4">
                  <label htmlFor="motivo-outro" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Especifique o motivo
                  </label>
                  <input
                    type="text"
                    id="motivo-outro"
                    className="w-full px-3.5 py-2.5 
                      bg-white dark:bg-gray-700
                      border border-gray-200 dark:border-gray-600 
                      rounded-lg text-gray-900 dark:text-gray-100
                      placeholder-gray-400 dark:placeholder-gray-400
                      focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
                      focus:border-transparent transition-colors"
                    placeholder="Descreva o motivo da pausa"
                    onChange={(e) => setMotivoPausa(e.target.value)}
                  />
                </div>
              )}
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowPausaModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                          bg-white dark:bg-gray-800 
                          border border-gray-300 dark:border-gray-600 
                          rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 
                          transition-colors shadow-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleConfirmarPausa(motivoPausa)}
                  disabled={!motivoPausa}
                  className="px-4 py-2 text-sm font-medium text-white 
                          bg-yellow-500 dark:bg-yellow-600 
                          rounded-lg hover:bg-yellow-600 dark:hover:bg-yellow-700 
                          transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmar Pausa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}