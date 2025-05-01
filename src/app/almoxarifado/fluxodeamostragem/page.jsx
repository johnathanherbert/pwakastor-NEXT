'use client';
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/supabaseClient";
import { 
  XMarkIcon, 
  PlusIcon, 
  ClipboardDocumentIcon, 
  BeakerIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { showToast } from '@/components/Toast/ToastContainer';
import Modal from '@/components/Modal';
import Loading from '@/components/ui/Loading';
import AddNTAmostragemModal from "@/components/AddNTAmostragemModal";
import EditNTAmostragemModal from "@/components/EditNTAmostragemModal";

export default function FluxoDeAmostragem() {
  // Router para navegação
  const router = useRouter();
  
  // Estado para controlar a sidebar
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Usando o hook useTheme para acessar o dark mode global
  const { darkMode } = useTheme();

  // Estados para gerenciamento de dados
  const [ntsAmostragem, setNtsAmostragem] = useState([]);
  const [ntItems, setNtItems] = useState({});
  const [isLoading, setIsLoading] = useState(true); // Apenas para o carregamento inicial
  const [isActionLoading, setIsActionLoading] = useState(false); // Para ações específicas como dar baixa
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false); // Para atualizações em segundo plano
  
  // Estados para modais
  const [showAddNTModal, setShowAddNTModal] = useState(false);
  const [showBaixaModal, setShowBaixaModal] = useState(false);
  const [currentNTForBaixa, setCurrentNTForBaixa] = useState(null);
  
  // Estados para histórico
  const [showHistoricoView, setShowHistoricoView] = useState(false);
  const [historicoNTs, setHistoricoNTs] = useState([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  
  // Estado para cabines de amostragem
  const [cabineA, setCabineA] = useState(null);
  const [cabineB, setCabineB] = useState(null);
  
  // Estado para itens aguardando baixa
  const [itensAguardandoBaixa, setItensAguardandoBaixa] = useState([]);
  
  // Estados para métricas do dashboard
  const [metricas, setMetricas] = useState({
    totalNTs: 0,
    totalEmAmostragem: 0,
    totalAguardandoBaixa: 0,
    tempoMedioAmostragem: '00:00:00',
    eficiencia: 0 // Porcentagem
  });
  
  // Carregar dados ao montar o componente
  useEffect(() => {
    // Na primeira carga, mostrar o loading completo
    fetchData(false);
    
    // Configurar listeners para atualizações em tempo real - com filtros específicos
    const ntItemsChannel = supabase
      .channel('nt-items-changes')
      .on('postgres_changes', 
          { event: 'UPDATE', schema: 'public', table: 'nts_amostragem_items', filter: `status=eq.Ag. Baixa` }, 
          (payload) => {
            console.log('Item movido para baixa:', payload);
            fetchData(true); // Carregamento em segundo plano
          })
      .on('postgres_changes', 
          { event: 'UPDATE', schema: 'public', table: 'nts_amostragem_items', filter: `cabine=is.null` }, 
          (payload) => {
            console.log('Cabine liberada:', payload);
            fetchData(true); // Carregamento em segundo plano
          })
      .on('postgres_changes', 
          { event: 'UPDATE', schema: 'public', table: 'nts_amostragem_items' }, 
          (payload) => {
            // Para quaisquer outras atualizações
            fetchData(true); // Carregamento em segundo plano
          })
      .subscribe();
    
    const ntChannel = supabase
      .channel('nt-changes')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'nts_amostragem' }, 
          () => {
            fetchData(true); // Carregamento em segundo plano
          })
      .subscribe();
    
    const oeeChannel = supabase
      .channel('oee-changes')
      .on('postgres_changes', 
          { event: 'UPDATE', schema: 'public', table: 'nts_amostragem_oee', filter: `status=eq.finalizado` }, 
          (payload) => {
            console.log('OEE finalizado:', payload);
            fetchData(true); // Carregamento em segundo plano
          })
      .subscribe();
      
    // Atualização periódica de segurança (intervalo reduzido para ser mais responsivo)
    const intervalId = setInterval(() => {
      fetchData(true); // Carregamento em segundo plano
    }, 10000); // Aumentado para 10 segundos para reduzir carga no servidor
      
    // Limpar listeners ao desmontar
    return () => {
      supabase.removeChannel(ntChannel);
      supabase.removeChannel(ntItemsChannel);
      supabase.removeChannel(oeeChannel);
      clearInterval(intervalId);
    };
  }, []);
  
  // Função para buscar dados do banco
  const fetchData = async (backgroundRefresh = true) => {
    // Se for primeiro carregamento ou uma ação específica, não usar carregamento em segundo plano
    if (!backgroundRefresh) {
      setIsLoading(true);
    } else {
      setIsBackgroundLoading(true);
    }
    
    try {
      // Buscar NTs de amostragem
      const { data: ntsData, error: ntsError } = await supabase
        .from('nts_amostragem')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (ntsError) throw ntsError;
      
      // Buscar itens das NTs
      const { data: itemsData, error: itemsError } = await supabase
        .from('nts_amostragem_items')
        .select('*');
        
      if (itemsError) throw itemsError;
      
      // Organizar itens por NT
      const itemsByNT = itemsData.reduce((acc, item) => {
        if (!acc[item.nt_id]) {
          acc[item.nt_id] = [];
        }
        acc[item.nt_id].push(item);
        return acc;
      }, {});
      
      // Atualizar estados
      setNtsAmostragem(ntsData || []);
      setNtItems(itemsByNT || {});
      
      // Buscar itens nas cabines de amostragem
      const { data: cabineAData, error: cabineAError } = await supabase
        .from('nts_amostragem_items')
        .select(`
          id, 
          nt_id, 
          code, 
          description, 
          quantity, 
          batch, 
          cabine, 
          status, 
          sample_operator_id,
          oee_status,
          oee_elapsed_time,
          nts_amostragem(nt_number)
        `)
        .eq('cabine', 'Cabine 1')
        .not('status', 'eq', 'Finalizado');
      
      if (cabineAError) throw cabineAError;
      
      const { data: cabineBData, error: cabineBError } = await supabase
        .from('nts_amostragem_items')
        .select(`
          id, 
          nt_id, 
          code, 
          description, 
          quantity, 
          batch, 
          cabine, 
          status, 
          sample_operator_id,
          oee_status,
          oee_elapsed_time,
          nts_amostragem(nt_number)
        `)
        .eq('cabine', 'Cabine 2')
        .not('status', 'eq', 'Finalizado');
      
      if (cabineBError) throw cabineBError;
      
      // Se houver dados na cabine, agrupar por NT
      if (cabineAData && cabineAData.length > 0) {
        // Pegar o primeiro item para identificar a NT
        const primeiroItem = cabineAData[0];
        // Verificar se o primeiroItem e seus campos existem antes de acessá-los
        const status = primeiroItem && primeiroItem.oee_status ? primeiroItem.oee_status : 'aguardando';
        const tempo = primeiroItem && primeiroItem.oee_elapsed_time ? primeiroItem.oee_elapsed_time : 0;
        const ntNumber = primeiroItem && primeiroItem.nts_amostragem ? primeiroItem.nts_amostragem.nt_number : 'N/A';
        
        setCabineA({
          nt_id: primeiroItem.nt_id,
          nt_number: ntNumber,
          operador: primeiroItem.sample_operator_id || '',
          status: status,
          tempo: tempo,
          itens: cabineAData
        });
      } else {
        setCabineA(null);
      }
      
      if (cabineBData && cabineBData.length > 0) {
        // Pegar o primeiro item para identificar a NT
        const primeiroItem = cabineBData[0];
        // Verificar se o primeiroItem e seus campos existem antes de acessá-los
        const status = primeiroItem && primeiroItem.oee_status ? primeiroItem.oee_status : 'aguardando';
        const tempo = primeiroItem && primeiroItem.oee_elapsed_time ? primeiroItem.oee_elapsed_time : 0;
        const ntNumber = primeiroItem && primeiroItem.nts_amostragem ? primeiroItem.nts_amostragem.nt_number : 'N/A';
        
        setCabineB({
          nt_id: primeiroItem.nt_id,
          nt_number: ntNumber,
          operador: primeiroItem.sample_operator_id || '',
          status: status,
          tempo: tempo,
          itens: cabineBData
        });
      } else {
        setCabineB(null);
      }
      
      // Buscar itens aguardando baixa
      const { data: baixaData, error: baixaError } = await supabase
        .from('nts_amostragem_items')
        .select(`
          id, 
          nt_id, 
          code, 
          description, 
          quantity, 
          batch, 
          cabine, 
          status, 
          sample_operator_id,
          oee_status,
          oee_elapsed_time,
          sample_finish_date,
          sample_finish_time,
          nts_amostragem(nt_number)
        `)
        .eq('status', 'Ag. Baixa');
      
      if (baixaError) throw baixaError;
      
      setItensAguardandoBaixa(baixaData || []);
      
      // Calcular métricas para o dashboard
      await calcularMetricas();
      
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      // Mostrar toast apenas se houver erro em carregamento visível ao usuário
      if (!backgroundRefresh) {
        showToast("Erro ao carregar dados", "error");
      }
    } finally {
      // Resetar os estados de loading apropriados
      if (!backgroundRefresh) {
        setIsLoading(false);
      } else {
        setIsBackgroundLoading(false);
      }
    }
  };
  
  // Calcular métricas para o dashboard
  const calcularMetricas = async () => {
    try {
      // Total de NTs
      const totalNTs = ntsAmostragem.length;
      
      // Total em amostragem (cabines ocupadas)
      const totalEmAmostragem = (cabineA ? 1 : 0) + (cabineB ? 1 : 0);
      
      // Total aguardando baixa (agrupado por NT)
      const ntsAguardandoBaixa = itensAguardandoBaixa.reduce((acc, item) => {
        if (!acc.includes(item.nt_id)) {
          acc.push(item.nt_id);
        }
        return acc;
      }, []);
      
      const totalAguardandoBaixa = ntsAguardandoBaixa.length;
      
      // Buscar dados de OEE finalizados para calcular tempo médio
      const { data: oeeData, error: oeeError } = await supabase
        .from('nts_amostragem_oee')
        .select('total_duration')
        .eq('status', 'finalizado');
      
      if (oeeError) throw oeeError;
      
      // Calcular tempo médio de amostragem
      let tempoMedioSegundos = 0;
      
      if (oeeData && oeeData.length > 0) {
        const totalSegundos = oeeData.reduce((acc, item) => acc + (item.total_duration || 0), 0);
        tempoMedioSegundos = Math.floor(totalSegundos / oeeData.length);
      }
      
      // Formatar tempo médio
      const tempoMedio = formatarTempo(tempoMedioSegundos);
      
      // Calcular eficiência (tempo efetivo / tempo total) usando dados de paradas
      const { data: paradasData, error: paradasError } = await supabase
        .from('nts_amostragem_oee_paradas')
        .select('*')
        .eq('status', 'finalizado');
      
      if (paradasError) throw paradasError;
      
      let eficiencia = 100; // Padrão 100% se não houver dados
      
      if (oeeData && oeeData.length > 0 && paradasData) {
        const tempoTotalSegundos = oeeData.reduce((acc, item) => acc + (item.total_duration || 0), 0);
        
        // Somar o tempo total de paradas (estimativa aproximada sem data/hora exata)
        // Para um cálculo preciso, seria necessário converter a data para timestamp
        const tempoParadasEstimado = paradasData.length * 15 * 60; // Estimativa média de 15 minutos por parada
        
        if (tempoTotalSegundos > 0) {
          const tempoEfetivo = Math.max(0, tempoTotalSegundos - tempoParadasEstimado);
          eficiencia = Math.round((tempoEfetivo / tempoTotalSegundos) * 100);
          eficiencia = Math.max(0, Math.min(100, eficiencia)); // Limitar entre 0 e 100
        }
      }
      
      setMetricas({
        totalNTs,
        totalEmAmostragem,
        totalAguardandoBaixa,
        tempoMedioAmostragem: tempoMedio,
        eficiencia
      });
      
    } catch (error) {
      console.error("Erro ao calcular métricas:", error);
    }
  };
  
  // Função para formatar tempo em segundos para HH:MM:SS
  const formatarTempo = (segundos) => {
    if (!segundos) return '00:00:00';
    
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };
  
  // Função para abrir modal de adição de NT
  const handleAddNT = () => {
    setShowAddNTModal(true);
  };
  
  // Função para lidar com a adição de uma nova NT
  const handleNTAdded = () => {
    setShowAddNTModal(false);
    // Dados serão atualizados pelos listeners em tempo real
  };
  
  // Função para abrir o modal de baixa
  const handleAbrirBaixa = (nt) => {
    setCurrentNTForBaixa(nt);
    setShowBaixaModal(true);
  };
  
  // Função para realizar a baixa de uma NT
  const handleBaixaNT = async (nt_id, tipoAmostragem) => {
    try {
      setIsActionLoading(true);
      
      const now = new Date();
      const formattedDate = now.toLocaleDateString('pt-BR');
      const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      // 1. Atualizar status dos itens para "Finalizado"
      const { error: updateError } = await supabase
        .from('nts_amostragem_items')
        .update({
          status: 'Finalizado',
          baixa_date: formattedDate,
          baixa_time: formattedTime
        })
        .eq('nt_id', nt_id)
        .eq('status', 'Ag. Baixa');
      
      if (updateError) throw updateError;
      
      // 2. Registrar histórico da NT
      const { error: historicoError } = await supabase
        .from('nts_amostragem_historico')
        .insert({
          nt_id,
          tipo_amostragem: tipoAmostragem,  // 'AVR' ou 'Convencional'
          data_baixa: formattedDate,
          hora_baixa: formattedTime,
          observacoes: `Baixa realizada - ${tipoAmostragem}`
        });
      
      if (historicoError && historicoError.code !== '42P01') { 
        // Tratando o caso em que a tabela não existe, esse erro será ignorado
        console.error("Erro ao registrar histórico:", historicoError);
        showToast("Aviso: histórico não registrado. Tabela pode não existir.", "warning");
      }
      
      showToast(`NT baixada com sucesso como ${tipoAmostragem}`, "success");
      
      // Fechar modal
      setShowBaixaModal(false);
      setCurrentNTForBaixa(null);
      
      // Atualizar dados sem mostrar tela de loading
      fetchData(true);
      
    } catch (error) {
      console.error("Erro ao dar baixa na NT:", error);
      showToast("Erro ao dar baixa na NT", "error");
    } finally {
      setIsActionLoading(false);
    }
  };
  
  // Função para carregar histórico de NTs
  const fetchHistorico = async () => {
    try {
      setLoadingHistorico(true);
      
      // Buscar histórico de NTs finalizadas
      const { data: historicoData, error: historicoError } = await supabase
        .from('nts_amostragem_historico')
        .select(`
          id,
          nt_id,
          tipo_amostragem,
          data_baixa,
          hora_baixa,
          observacoes,
          nts_amostragem (
            nt_number,
            created_date,
            created_time
          )
        `)
        .order('created_at', { ascending: false });
      
      if (historicoError && historicoError.code === '42P01') {
        // Tabela não existe ainda
        showToast("Tabela de histórico não encontrada. Será criada na primeira baixa.", "info");
        setHistoricoNTs([]);
        return;
      }
      
      if (historicoError) throw historicoError;
      
      // Buscar detalhes dos itens para cada NT
      if (historicoData && historicoData.length > 0) {
        const ntIds = historicoData.map(h => h.nt_id);
        
        const { data: itensData, error: itensError } = await supabase
          .from('nts_amostragem_items')
          .select('*')
          .in('nt_id', ntIds);
        
        if (itensError) throw itensError;
        
        // Organizar itens por NT
        const itensPorNT = itensData.reduce((acc, item) => {
          if (!acc[item.nt_id]) {
            acc[item.nt_id] = [];
          }
          acc[item.nt_id].push(item);
          return acc;
        }, {});
        
        // Adicionar itens ao histórico
        const historicoCompleto = historicoData.map(h => ({
          ...h,
          itens: itensPorNT[h.nt_id] || []
        }));
        
        setHistoricoNTs(historicoCompleto);
      } else {
        setHistoricoNTs([]);
      }
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
      showToast("Erro ao carregar histórico de NTs", "error");
    } finally {
      setLoadingHistorico(false);
    }
  };
  
  // Função para alternar entre a visualização principal e o histórico
  const toggleHistorico = () => {
    if (!showHistoricoView) {
      fetchHistorico();
    }
    setShowHistoricoView(!showHistoricoView);
  };
  
  // Estados para edição e exclusão de NTs
  const [showEditNTModal, setShowEditNTModal] = useState(false);
  const [showDeleteNTModal, setShowDeleteNTModal] = useState(false);
  const [currentNTForEdit, setCurrentNTForEdit] = useState(null);
  const [currentNTForDelete, setCurrentNTForDelete] = useState(null);
  
  // Função para abrir o modal de edição de NT
  const handleEditNT = (nt) => {
    setCurrentNTForEdit({
      ...nt,
      items: ntItems[nt.id] || []
    });
    setShowEditNTModal(true);
  };
  
  // Função para lidar com a finalização da edição
  const handleNTEdited = () => {
    setShowEditNTModal(false);
    setCurrentNTForEdit(null);
    // Dados serão atualizados pelos listeners em tempo real ou pela atualização periódica
    fetchData(true);
  };
  
  // Função para abrir o modal de confirmação de exclusão
  const handleDeleteNT = (nt) => {
    setCurrentNTForDelete(nt);
    setShowDeleteNTModal(true);
  };
  
  // Função para excluir uma NT
  const confirmDeleteNT = async () => {
    if (!currentNTForDelete) return;
    
    setIsActionLoading(true);
    
    try {
      // 1. Primeiro excluir os itens da NT
      const { error: deleteItemsError } = await supabase
        .from('nts_amostragem_items')
        .delete()
        .eq('nt_id', currentNTForDelete.id);
        
      if (deleteItemsError) throw deleteItemsError;
      
      // 2. Depois excluir a NT
      const { error: deleteNTError } = await supabase
        .from('nts_amostragem')
        .delete()
        .eq('id', currentNTForDelete.id);
        
      if (deleteNTError) throw deleteNTError;
      
      showToast('NT de amostragem excluída com sucesso', 'success');
      
      // Atualizar dados
      fetchData(true);
      
    } catch (error) {
      console.error('Erro ao excluir NT:', error);
      showToast('Erro ao excluir NT', 'error');
    } finally {
      setShowDeleteNTModal(false);
      setCurrentNTForDelete(null);
      setIsActionLoading(false);
    }
  };
  
  // Função para uma cabine selecionar uma NT disponível
  const handleSelecionarNT = async (nt_id, cabine) => {
    try {
      setIsActionLoading(true);
      
      // Buscar todos os itens desta NT
      const { data: itemsData, error: itemsError } = await supabase
        .from('nts_amostragem_items')
        .select('*')
        .eq('nt_id', nt_id);
        
      if (itemsError) throw itemsError;
      
      if (!itemsData || itemsData.length === 0) {
        throw new Error('Não foram encontrados itens para esta NT');
      }
      
      // Verificar se todos os itens estão disponíveis (status = 'Ag. Amostragem')
      const todosDisponiveis = itemsData.every(item => item.status === 'Ag. Amostragem');
      
      if (!todosDisponiveis) {
        showToast('Alguns itens desta NT já estão em processamento', 'error');
        return;
      }
      
      // Atualizar o status e a cabine de todos os itens
      const now = new Date();
      const formattedDate = now.toLocaleDateString('pt-BR');
      const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      const { error: updateError } = await supabase
        .from('nts_amostragem_items')
        .update({
          cabine: cabine,
          status: 'Em Amostragem',
          sample_start_date: formattedDate,
          sample_start_time: formattedTime
        })
        .eq('nt_id', nt_id);
      
      if (updateError) throw updateError;
      
      // Criar registro OEE para esta amostragem
      const { error: oeeError } = await supabase
        .from('nts_amostragem_oee')
        .insert({
          nt_id: nt_id,
          cabine: cabine,
          start_date: formattedDate,
          start_time: formattedTime,
          status: 'aguardando'
        });
      
      if (oeeError && oeeError.code !== '42P01') { 
        // Ignoramos erro de tabela inexistente, ela será criada quando necessário
        console.error("Erro ao criar registro OEE:", oeeError);
      }
      
      showToast(`NT selecionada para a ${cabine} com sucesso`, 'success');
      
      // Atualizar os dados
      fetchData(true);
      
    } catch (error) {
      console.error("Erro ao selecionar NT:", error);
      showToast("Erro ao selecionar NT para a cabine", "error");
    } finally {
      setIsActionLoading(false);
    }
  };
  
  // Função para finalizar a amostragem e mover a NT para aguardando baixa
  const handleFinalizarAmostragem = async (nt_id) => {
    try {
      setIsActionLoading(true);
      
      // Buscar todos os itens desta NT que estão em amostragem
      const { data: itemsData, error: itemsError } = await supabase
        .from('nts_amostragem_items')
        .select('*')
        .eq('nt_id', nt_id)
        .eq('status', 'Em Amostragem');
        
      if (itemsError) throw itemsError;
      
      if (!itemsData || itemsData.length === 0) {
        throw new Error('Não foram encontrados itens para esta NT');
      }
      
      // Salvar a cabine original para posterior atualização de OEE
      const cabine = itemsData[0].cabine;
      
      // Atualizar o status de todos os itens para "Ag. Baixa"
      const now = new Date();
      const formattedDate = now.toLocaleDateString('pt-BR');
      const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      const { error: updateError } = await supabase
        .from('nts_amostragem_items')
        .update({
          status: 'Ag. Baixa',
          sample_finish_date: formattedDate,
          sample_finish_time: formattedTime
        })
        .eq('nt_id', nt_id)
        .eq('status', 'Em Amostragem');
      
      if (updateError) throw updateError;
      
      // Atualizar o registro OEE para finalizado
      const { error: oeeError } = await supabase
        .from('nts_amostragem_oee')
        .update({
          status: 'finalizado',
          end_date: formattedDate,
          end_time: formattedTime
        })
        .eq('nt_id', nt_id)
        .eq('cabine', cabine);
      
      if (oeeError && oeeError.code !== '42P01') {
        console.error("Erro ao atualizar OEE:", oeeError);
      }
      
      showToast('NT finalizada com sucesso e movida para aguardando baixa', 'success');
      
      // Atualizar dados
      fetchData(true);
      
    } catch (error) {
      console.error("Erro ao finalizar amostragem:", error);
      showToast("Erro ao finalizar amostragem", "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <Topbar 
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
        title="Fluxo de Amostragem"
      />
      
      <main className="pt-20 px-6 max-w-7xl mx-auto pb-12 relative">
        {/* Indicador sutil de carregamento em segundo plano */}
        {isBackgroundLoading && (
          <div className="absolute top-6 right-6 flex items-center gap-2 bg-white dark:bg-gray-800/80 px-3 py-1.5 rounded-full shadow-sm border border-gray-200 dark:border-gray-700/50 text-xs text-gray-500 dark:text-gray-400 opacity-80 backdrop-blur-sm transition-opacity animate-fadeIn">
            <div className="h-2 w-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse"></div>
            Atualizando...
          </div>
        )}
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {showHistoricoView ? "Histórico de NTs Finalizadas" : "Fluxo de Amostragem"}
          </h1>
          
          <div className="flex items-center gap-3">
            <button
              onClick={toggleHistorico}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showHistoricoView 
                  ? "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300" 
                  : "bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/40 dark:text-indigo-300"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              {showHistoricoView ? "Voltar ao Fluxo" : "Ver Histórico"}
            </button>
            
            {!showHistoricoView && (
              <button
                onClick={handleAddNT}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                Nova NT de Amostragem
              </button>
            )}
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loading message="Carregando dados..." />
          </div>
        ) : showHistoricoView ? (
          // Visualização do Histórico
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-800 dark:text-white">
                Histórico de NTs Baixadas
              </h2>
              
              {loadingHistorico && (
                <div className="flex items-center">
                  <div className="h-4 w-4 border-2 border-indigo-500 dark:border-indigo-400 rounded-full border-t-transparent animate-spin mr-2"></div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Carregando...</span>
                </div>
              )}
            </div>
            
            {historicoNTs.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto h-16 w-16 text-gray-400 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                  Nenhuma NT finalizada
                </h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  Não há registros de NTs finalizadas no histórico. As NTs aparecerão aqui após serem finalizadas com baixa.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {historicoNTs.map(nt => (
                  <div 
                    key={nt.id} 
                    className={`bg-white dark:bg-gray-700 shadow-sm border rounded-lg p-4 hover:shadow-md transition-shadow ${
                      nt.tipo_amostragem === 'AVR' ? 'border-blue-200 dark:border-blue-700/50' : 'border-purple-200 dark:border-purple-700/50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-gray-800 dark:text-white">
                            NT #{nt.nts_amostragem?.nt_number}
                          </h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            nt.tipo_amostragem === 'AVR' 
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                              : 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                          }`}>
                            {nt.tipo_amostragem}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Baixa: {nt.data_baixa} às {nt.hora_baixa}
                        </p>
                      </div>
                      
                      <div className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {nt.itens?.length || 0} itens
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-600">
                      <div className="max-h-24 overflow-y-auto">
                        {nt.itens?.slice(0, 3).map(item => (
                          <div key={item.id} className="text-xs mb-1 pb-1 border-b border-gray-50 dark:border-gray-700/50 last:border-b-0">
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-700 dark:text-gray-300">{item.code}</span>
                              <span className="text-gray-500 dark:text-gray-400">Lote: {item.batch}</span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 truncate">
                              {item.description}
                            </p>
                          </div>
                        ))}
                        
                        {(nt.itens?.length > 3) && (
                          <p className="text-center text-xs text-gray-500 dark:text-gray-400 italic">
                            + {nt.itens.length - 3} itens restantes
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Layout principal dividido em duas partes (superior e inferior) */}
            <div className="space-y-6">
              {/* Dashboard com métricas */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
                  Dashboard de Amostragem
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800/30">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">NTs criadas</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metricas.totalNTs}</p>
                  </div>
                  
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-100 dark:border-amber-800/30">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Em amostragem</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {metricas.totalEmAmostragem}
                    </p>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800/30">
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">Aguardando baixa</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{metricas.totalAguardandoBaixa}</p>
                  </div>
                  
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800/30">
                    <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Tempo médio</p>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{metricas.tempoMedioAmostragem}</p>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800/30">
                    <p className="text-sm font-medium text-purple-800 dark:text-purple-300">Eficiência</p>
                    <div className="flex items-center">
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{metricas.eficiencia}%</p>
                      <div className="ml-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div 
                          className="bg-purple-600 dark:bg-purple-500 h-2.5 rounded-full"
                          style={{width: `${metricas.eficiencia}%`}}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Parte inferior - Layout de três colunas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Coluna 1 - NTs criadas */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                  <h3 className="text-md font-medium text-gray-800 dark:text-white mb-3 flex justify-between items-center">
                    <span>NTs Disponíveis</span>
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium px-2 py-1 rounded-full">
                      {ntsAmostragem.filter(nt => (ntItems[nt.id] || []).every(item => item.status === 'Ag. Amostragem')).length}
                    </span>
                  </h3>
                  
                  <div className="space-y-3 max-h-[calc(100vh-16rem)] overflow-y-auto pr-1">
                    {ntsAmostragem.length === 0 ? (
                      <div className="text-center py-10">
                        <div className="mx-auto h-12 w-12 text-gray-400 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                          <ClipboardDocumentIcon className="h-6 w-6" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Nenhuma NT disponível.
                        </p>
                        <button
                          onClick={handleAddNT}
                          className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Criar nova NT
                        </button>
                      </div>
                    ) : (
                      // Filtrar apenas NTs que estão disponíveis (todos os itens em Ag. Amostragem)
                      ntsAmostragem
                        .filter(nt => (ntItems[nt.id] || []).every(item => item.status === 'Ag. Amostragem'))
                        .map(nt => (
                        <div 
                          key={nt.id}
                          className="bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 rounded-lg p-3 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-sm font-medium text-gray-800 dark:text-white">
                                NT #{nt.nt_number}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {nt.created_date} • {nt.created_time}
                              </p>
                            </div>
                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full">
                              {(ntItems[nt.id] || []).length} itens
                            </span>
                          </div>
                          
                          {/* Lista de itens da NT */}
                          {(ntItems[nt.id] || []).length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-600">
                              <ul className="space-y-1">
                                {(ntItems[nt.id] || []).slice(0, 3).map(item => (
                                  <li key={item.id} className="text-xs text-gray-600 dark:text-gray-300 flex justify-between">
                                    <span>{item.code} - {item.description}</span>
                                    <span>{item.quantity}</span>
                                  </li>
                                ))}
                                
                                {(ntItems[nt.id] || []).length > 3 && (
                                  <li className="text-xs text-gray-500 dark:text-gray-400 italic">
                                    + {(ntItems[nt.id] || []).length - 3} itens restantes
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}
                          
                          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-600 flex justify-end space-x-2">
                            {/* Verifica se todos os itens da NT estão em status "Ag. Amostragem" (NT ainda disponível) */}
                            {(ntItems[nt.id] || []).every(item => item.status === 'Ag. Amostragem') && (
                              <>
                                <button 
                                  onClick={() => handleEditNT(nt)}
                                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                  Editar
                                </button>
                                <button 
                                  onClick={() => handleDeleteNT(nt)}
                                  className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Excluir
                                </button>
                              </>
                            )}
                            <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                              Ver detalhes
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                {/* Coluna 2 - Cabines de amostragem (divididas horizontalmente) */}
                <div className="space-y-6">
                  {/* Cabine A */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 h-[calc(50vh-10rem)]">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-md font-medium text-gray-800 dark:text-white flex items-center gap-1.5">
                        <BeakerIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        Cabine de Amostragem 1
                      </h3>
                      <Link 
                        href="/almoxarifado/fluxodeamostragem/cabine1"
                        className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md flex items-center gap-1 hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors"
                      >
                        Acessar OEE
                        <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                      </Link>
                    </div>
                    
                    {cabineA ? (
                      <div className="h-full flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="text-sm font-medium text-gray-800 dark:text-white">
                              NT #{cabineA.nt_number}
                            </h4>
                            {cabineA.operador && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Operador: {cabineA.operador}
                              </p>
                            )}
                          </div>
                          <div className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            cabineA.status === 'em_andamento' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            cabineA.status === 'pausado' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${
                              cabineA.status === 'em_andamento' ? 'bg-green-500 animate-pulse' :
                              cabineA.status === 'pausado' ? 'bg-yellow-500' :
                              'bg-gray-500'
                            }`}></div>
                            {cabineA.status === 'em_andamento' ? 'Em andamento' :
                             cabineA.status === 'pausado' ? 'Pausado' : 
                             'Aguardando'}
                          </div>
                        </div>
                        
                        <div className="my-2 text-xs bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-md border border-blue-100 dark:border-blue-800/30 flex justify-between items-center">
                          <span className="text-blue-700 dark:text-blue-300">Tempo de amostragem</span>
                          <span className="font-mono font-medium text-blue-800 dark:text-blue-200">{formatarTempo(cabineA.tempo)}</span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto">
                          <div className="space-y-1">
                            {cabineA.itens.slice(0, 8).map(item => (
                              <div key={item.id} className="text-xs border-b border-gray-100 dark:border-gray-700 pb-1 last:border-b-0">
                                <div className="flex justify-between">
                                  <span className="font-medium text-gray-700 dark:text-gray-300">{item.code}</span>
                                  <span className="text-gray-500 dark:text-gray-400">Lote: {item.batch}</span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 truncate pr-2">
                                  {item.description}
                                </p>
                              </div>
                            ))}
                            
                            {cabineA.itens.length > 8 && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 italic text-center">
                                + {cabineA.itens.length - 8} itens restantes
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-auto pt-2 flex justify-end space-x-2">
                          <button
                            onClick={() => handleFinalizarAmostragem(cabineA.nt_id)}
                            className="text-xs text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 px-2 py-1 rounded flex items-center gap-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Finalizar Amostragem
                          </button>
                          <Link 
                            href="/almoxarifado/fluxodeamostragem/cabine1"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                          >
                            Gerenciar OEE
                            <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center">
                        <div className="mx-auto h-12 w-12 text-gray-400 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                          <BeakerIcon className="h-6 w-6" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                          Cabine disponível para amostragem
                        </p>
                        <div className="mt-4 space-y-2 w-full max-w-xs">
                          {/* Lista de NTs disponíveis */}
                          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                            Selecione uma NT disponível:
                          </p>
                          <div className="max-h-32 overflow-y-auto bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 space-y-1.5">
                            {ntsAmostragem
                              .filter(nt => (ntItems[nt.id] || []).every(item => item.status === 'Ag. Amostragem'))
                              .map(nt => (
                                <button
                                  key={nt.id}
                                  onClick={() => handleSelecionarNT(nt.id, 'Cabine 1')}
                                  disabled={isActionLoading}
                                  className="w-full flex justify-between items-center bg-white dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-left text-xs transition-colors"
                                >
                                  <span className="font-medium text-gray-800 dark:text-gray-200">NT #{nt.nt_number}</span>
                                  <span className="text-blue-600 dark:text-blue-400">{(ntItems[nt.id] || []).length} itens</span>
                                </button>
                              ))}
                            
                            {ntsAmostragem.filter(nt => (ntItems[nt.id] || []).every(item => item.status === 'Ag. Amostragem')).length === 0 && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                                Nenhuma NT disponível
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Cabine B */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 h-[calc(50vh-10rem)]">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-md font-medium text-gray-800 dark:text-white flex items-center gap-1.5">
                        <BeakerIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        Cabine de Amostragem 2
                      </h3>
                      <Link 
                        href="/almoxarifado/fluxodeamostragem/cabine2"
                        className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-md flex items-center gap-1 hover:bg-purple-200 dark:hover:bg-purple-800/30 transition-colors"
                      >
                        Acessar OEE
                        <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                      </Link>
                    </div>
                    
                    {cabineB ? (
                      <div className="h-full flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="text-sm font-medium text-gray-800 dark:text-white">
                              NT #{cabineB.nt_number}
                            </h4>
                            {cabineB.operador && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Operador: {cabineB.operador}
                              </p>
                            )}
                          </div>
                          <div className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            cabineB.status === 'em_andamento' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            cabineB.status === 'pausado' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${
                              cabineB.status === 'em_andamento' ? 'bg-green-500 animate-pulse' :
                              cabineB.status === 'pausado' ? 'bg-yellow-500' :
                              'bg-gray-500'
                            }`}></div>
                            {cabineB.status === 'em_andamento' ? 'Em andamento' :
                             cabineB.status === 'pausado' ? 'Pausado' : 
                             'Aguardando'}
                          </div>
                        </div>
                        
                        <div className="my-2 text-xs bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-md border border-purple-100 dark:border-purple-800/30 flex justify-between items-center">
                          <span className="text-purple-700 dark:text-purple-300">Tempo de amostragem</span>
                          <span className="font-mono font-medium text-purple-800 dark:text-purple-200">{formatarTempo(cabineB.tempo)}</span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto">
                          <div className="space-y-1">
                            {cabineB.itens.slice(0, 8).map(item => (
                              <div key={item.id} className="text-xs border-b border-gray-100 dark:border-gray-700 pb-1 last:border-b-0">
                                <div className="flex justify-between">
                                  <span className="font-medium text-gray-700 dark:text-gray-300">{item.code}</span>
                                  <span className="text-gray-500 dark:text-gray-400">Lote: {item.batch}</span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 truncate pr-2">
                                  {item.description}
                                </p>
                              </div>
                            ))}
                            
                            {cabineB.itens.length > 8 && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 italic text-center">
                                + {cabineB.itens.length - 8} itens restantes
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-auto pt-2 flex justify-end space-x-2">
                          <button
                            onClick={() => handleFinalizarAmostragem(cabineB.nt_id)}
                            className="text-xs text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 px-2 py-1 rounded flex items-center gap-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Finalizar Amostragem
                          </button>
                          <Link 
                            href="/almoxarifado/fluxodeamostragem/cabine2"
                            className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                          >
                            Gerenciar OEE
                            <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center">
                        <div className="mx-auto h-12 w-12 text-gray-400 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                          <BeakerIcon className="h-6 w-6" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                          Cabine disponível para amostragem
                        </p>
                        <div className="mt-4 space-y-2 w-full max-w-xs">
                          {/* Lista de NTs disponíveis */}
                          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                            Selecione uma NT disponível:
                          </p>
                          <div className="max-h-32 overflow-y-auto bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 space-y-1.5">
                            {ntsAmostragem
                              .filter(nt => (ntItems[nt.id] || []).every(item => item.status === 'Ag. Amostragem'))
                              .map(nt => (
                                <button
                                  key={nt.id}
                                  onClick={() => handleSelecionarNT(nt.id, 'Cabine 2')}
                                  disabled={isActionLoading}
                                  className="w-full flex justify-between items-center bg-white dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 text-left text-xs transition-colors"
                                >
                                  <span className="font-medium text-gray-800 dark:text-gray-200">NT #{nt.nt_number}</span>
                                  <span className="text-purple-600 dark:text-purple-400">{(ntItems[nt.id] || []).length} itens</span>
                                </button>
                              ))}
                            
                            {ntsAmostragem.filter(nt => (ntItems[nt.id] || []).every(item => item.status === 'Ag. Amostragem')).length === 0 && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                                Nenhuma NT disponível
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Coluna 3 - Itens aguardando baixa */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                  <h3 className="text-md font-medium text-gray-800 dark:text-white mb-3 flex justify-between items-center">
                    <span>Aguardando Baixa</span>
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium px-2 py-1 rounded-full">
                      {itensAguardandoBaixa.length}
                    </span>
                  </h3>
                  
                  <div className="space-y-3 max-h-[calc(100vh-16rem)] overflow-y-auto pr-1">
                    {itensAguardandoBaixa.length === 0 ? (
                      <div className="text-center py-10">
                        <div className="mx-auto h-12 w-12 text-gray-400 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Nenhum item aguardando baixa
                        </p>
                      </div>
                    ) : (
                      // Agrupar itens por NT
                      Object.entries(itensAguardandoBaixa.reduce((acc, item) => {
                        if (!acc[item.nt_id]) {
                          acc[item.nt_id] = {
                            nt_id: item.nt_id,
                            nt_number: item.nts_amostragem.nt_number,
                            finish_date: item.sample_finish_date,
                            finish_time: item.sample_finish_time,
                            itens: []
                          };
                        }
                        acc[item.nt_id].itens.push(item);
                        return acc;
                      }, {})).map(([nt_id, nt]) => (
                        <div 
                          key={nt_id}
                          className="bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 rounded-lg p-3 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-sm font-medium text-gray-800 dark:text-white">
                                NT #{nt.nt_number}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Finalizada em {nt.finish_date} às {nt.finish_time}
                              </p>
                            </div>
                            <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs px-2 py-0.5 rounded-full">
                              {nt.itens.length} itens
                            </span>
                          </div>
                          
                          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-600">
                            <div className="max-h-24 overflow-y-auto">
                              {nt.itens.slice(0, 3).map(item => (
                                <div key={item.id} className="text-xs mb-1 border-b border-gray-50 dark:border-gray-700/50 pb-1 last:border-b-0">
                                  <div className="flex justify-between">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{item.code}</span>
                                    <span className="text-gray-500 dark:text-gray-400">Lote: {item.batch}</span>
                                  </div>
                                  <p className="text-gray-600 dark:text-gray-400 truncate">
                                    {item.description}
                                  </p>
                                </div>
                              ))}
                              
                              {nt.itens.length > 3 && (
                                <p className="text-center text-xs text-gray-500 dark:text-gray-400 italic">
                                  + {nt.itens.length - 3} itens restantes
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-600 flex justify-end">
                            <button 
                              onClick={() => handleAbrirBaixa(nt)}
                              className="text-xs text-green-600 dark:text-green-400 hover:underline">
                              Finalizar Baixa
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
      
      {/* Modal de adição de NT de amostragem */}
      <AddNTAmostragemModal 
        isOpen={showAddNTModal}
        onClose={() => setShowAddNTModal(false)}
        onNTAdded={handleNTAdded}
      />
      
      {/* Modal de baixa */}
      {showBaixaModal && currentNTForBaixa && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center">
          <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => !isActionLoading && setShowBaixaModal(false)}></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Dar Baixa na NT
              </h3>
              <button 
                onClick={() => !isActionLoading && setShowBaixaModal(false)}
                disabled={isActionLoading}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 disabled:opacity-50"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  NT #{currentNTForBaixa.nt_number}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  {currentNTForBaixa.itens.length} itens para dar baixa
                </p>
              </div>
              
              <div className="mb-5">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                  Selecione o tipo de amostragem:
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleBaixaNT(currentNTForBaixa.nt_id, 'AVR')}
                    disabled={isActionLoading}
                    className={`flex flex-col items-center bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg p-4 hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors ${isActionLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <div className="h-10 w-10 bg-blue-200 dark:bg-blue-700/50 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center mb-2">
                      {isActionLoading ? (
                        <div className="h-5 w-5 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-300">AVR</span>
                    <span className="text-xs text-blue-600 dark:text-blue-400 mt-1">Amostragem Visual Reduzida</span>
                  </button>
                  
                  <button
                    onClick={() => handleBaixaNT(currentNTForBaixa.nt_id, 'Convencional')}
                    disabled={isActionLoading}
                    className={`flex flex-col items-center bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/50 rounded-lg p-4 hover:bg-purple-100 dark:hover:bg-purple-800/30 transition-colors ${isActionLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <div className="h-10 w-10 bg-purple-200 dark:bg-purple-700/50 text-purple-700 dark:text-purple-300 rounded-full flex items-center justify-center mb-2">
                      {isActionLoading ? (
                        <div className="h-5 w-5 border-2 border-purple-600 dark:border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v2M7 7h10" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm font-medium text-purple-800 dark:text-purple-300">Convencional</span>
                    <span className="text-xs text-purple-600 dark:text-purple-400 mt-1">Amostragem Padrão</span>
                  </button>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg mt-3">
                <p>Após dar baixa, a NT será movida para o histórico e não aparecerá mais na lista de itens aguardando baixa.</p>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => !isActionLoading && setShowBaixaModal(false)}
                  disabled={isActionLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                          bg-white dark:bg-gray-800 
                          border border-gray-300 dark:border-gray-600 
                          rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 
                          transition-colors shadow-sm
                          disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de edição de NT */}
      {showEditNTModal && currentNTForEdit && (
        <Modal isOpen={showEditNTModal} onClose={() => setShowEditNTModal(false)}>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Editar NT #{currentNTForEdit.nt_number}</h3>
            
            {/* Formulário de edição pode ser adicionado aqui */}
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowEditNTModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                        bg-white dark:bg-gray-800 
                        border border-gray-300 dark:border-gray-600 
                        rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 
                        transition-colors shadow-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleNTEdited}
                className="ml-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </Modal>
      )}
      
      {/* Modal de confirmação de exclusão de NT */}
      {showDeleteNTModal && currentNTForDelete && (
        <Modal isOpen={showDeleteNTModal} onClose={() => setShowDeleteNTModal(false)}>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Confirmar Exclusão</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">Você tem certeza que deseja excluir a NT #{currentNTForDelete.nt_number}?</p>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDeleteNTModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                        bg-white dark:bg-gray-800 
                        border border-gray-300 dark:border-gray-600 
                        rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 
                        transition-colors shadow-sm"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteNT}
                className="ml-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </Modal>
      )}
      
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );                                            
}