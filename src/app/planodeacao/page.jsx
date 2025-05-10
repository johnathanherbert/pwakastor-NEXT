'use client';
import { useState, useEffect, useRef } from 'react';
import { 
  PlusIcon, 
  XMarkIcon, 
  DocumentDuplicateIcon, 
  ExclamationCircleIcon, 
  ChevronDownIcon, 
  TrashIcon, 
  PencilIcon, 
  CheckCircleIcon,
  ChartBarIcon,
  ClockIcon,
  TableCellsIcon,
  Squares2X2Icon,
  CheckIcon,
  CalendarDaysIcon,
  FunnelIcon,
  ArrowPathIcon,
  WrenchScrewdriverIcon,
  UserIcon,
  DocumentTextIcon,
  FolderIcon,
  QuestionMarkCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon as SearchIcon,
  FunnelIcon as FilterIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../../supabaseClient';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import Topbar from '@/components/Topbar';
import Modal from '@/components/Modal';

// Toast notification component
const Toast = ({ message, type, onClose }) => {
  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-yellow-500';
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div className={`fixed bottom-4 right-4 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center`}>
      <span>{message}</span>
      <button onClick={onClose} className="ml-3 text-white">
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

// Função para calcular a idade do item (em dias)
const calcularIdade = (dataCriacao) => {
  if (!dataCriacao) return null;
  
  const hoje = new Date();
  const criacao = new Date(dataCriacao);
  
  // Diferença em milissegundos
  const diferenca = hoje - criacao;
  
  // Converter para dias (arredondando para baixo)
  const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));
  
  return dias;
};

// Função para obter classe visual de acordo com a idade do item
const getClasseIdade = (dias) => {
  if (dias === null) return {
    texto: 'N/A',
    classe: 'text-gray-400 dark:text-gray-500',
    icone: null
  };
  
  if (dias === 0) return {
    texto: 'Hoje',
    classe: 'text-blue-600 dark:text-blue-400',
    icone: <ClockIcon className="h-3.5 w-3.5 mr-1 text-blue-500 dark:text-blue-400" />
  };
  
  if (dias <= 7) return {
    texto: `${dias} ${dias === 1 ? 'dia' : 'dias'}`,
    classe: 'text-green-600 dark:text-green-400',
    icone: <ClockIcon className="h-3.5 w-3.5 mr-1 text-green-500 dark:text-green-400" />
  };
  
  if (dias <= 30) return {
    texto: `${dias} dias`,
    classe: 'text-yellow-600 dark:text-yellow-400',
    icone: <ClockIcon className="h-3.5 w-3.5 mr-1 text-yellow-500 dark:text-yellow-400" />
  };
  
  return {
    texto: `${dias} dias`,
    classe: 'text-red-600 dark:text-red-400',
    icone: <ClockIcon className="h-3.5 w-3.5 mr-1 text-red-500 dark:text-red-400" />
  };
};

// Função para calcular dias até o prazo ou dias de atraso
const calcularDiasParaPrazo = (prazoFinal) => {
  const hoje = new Date();
  const prazo = new Date(prazoFinal);
  
  // Diferença em milissegundos
  const diferenca = prazo - hoje;
  
  // Converter para dias (arredondando para baixo ou para cima dependendo se está adiantado ou atrasado)
  const dias = Math.ceil(diferenca / (1000 * 60 * 60 * 24));
  
  return dias;
};

// Função para formatar a mensagem de prazo
const formatarMensagemPrazo = (dias) => {
  if (dias === 0) {
    return {
      texto: "Vence hoje",
      classe: "text-yellow-600 dark:text-yellow-400 font-medium"
    };
  } else if (dias > 0) {
    return {
      texto: `Faltam ${dias} ${dias === 1 ? 'dia' : 'dias'}`,
      classe: "text-green-600 dark:text-green-400 font-medium"
    };
  } else {
    const diasAtraso = Math.abs(dias);
    return {
      texto: `${diasAtraso} ${diasAtraso === 1 ? 'dia' : 'dias'} de atraso`,
      classe: "text-red-600 dark:text-red-400 font-medium"
    };
  }
};

// Função para calcular o status com base no prazo final
const calcularStatus = (prazoFinal, concluido = false) => {
  // Se a tarefa foi concluída, retorna status de concluído independentemente do prazo
  if (concluido) {
    return {
      texto: 'Concluído',
      classe: 'text-white bg-green-500',
      badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      badgePill: 'text-xs font-medium px-3 py-1.5 rounded-md bg-green-100/80 text-green-800 dark:bg-green-900 dark:text-green-300 shadow-sm border border-green-200 dark:border-green-800 flex items-center justify-center',
      icon: <CheckCircleIcon className="h-4 w-4 mr-1.5" />,
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      priority: 0
    };
  }

  const hoje = new Date();
  const prazo = new Date(prazoFinal);
  
  // Verifica se o prazo expirou
  if (hoje > prazo) {
    return { 
      texto: 'Atrasado', 
      classe: 'text-white bg-red-500', 
      badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      badgePill: 'text-xs font-medium px-3 py-1.5 rounded-md bg-red-100/80 text-red-800 dark:bg-red-900 dark:text-red-300 shadow-sm border border-red-200 dark:border-red-800 flex items-center justify-center',
      icon: <ExclamationCircleIcon className="h-4 w-4 mr-1.5" />,
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      priority: 3
    };
  } 
  
  // Verifica se está a 3 dias ou menos do prazo
  const diferencaDias = Math.ceil((prazo - hoje) / (1000 * 60 * 60 * 24));
  if (diferencaDias <= 3) {
    return { 
      texto: 'Atenção', 
      classe: 'text-white bg-yellow-500', 
      badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      badgePill: 'text-xs font-medium px-3 py-1.5 rounded-md bg-yellow-100/80 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 shadow-sm border border-yellow-200 dark:border-yellow-800 flex items-center justify-center',
      icon: <ExclamationCircleIcon className="h-4 w-4 mr-1.5" />,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      priority: 2
    };
  }
  
  // Se não, está dentro do prazo
  return { 
    texto: 'Dentro do prazo', 
    classe: 'text-white bg-green-500', 
    badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    badgePill: 'text-xs font-medium px-3 py-1.5 rounded-md bg-green-100/80 text-green-800 dark:bg-green-900 dark:text-green-300 shadow-sm border border-green-200 dark:border-green-800 flex items-center justify-center',
    icon: <CheckIcon className="h-4 w-4 mr-1.5" />,
    bgColor: 'bg-green-50',
    textColor: 'text-green-600',
    priority: 1
  };
};

export default function PlanoDeAcaoPage() {
  const { darkMode, toggleDarkMode } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  
  // Estado para o nome do departamento/setor
  const [departmentName, setDepartmentName] = useState('');
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [tempDepartmentName, setTempDepartmentName] = useState('');
  
  const [sessions, setSessions] = useState([]);
  const [sessaoSelecionada, setSessaoSelecionada] = useState('todas');
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [itemEmEdicao, setItemEmEdicao] = useState(null);const [novoItem, setNovoItem] = useState({
    problema: '',
    causaRaiz: '',
    contramedida: '',
    responsavel: '',
    prazoFinal: '',
    sessao_id: '',
    os: ''
  });  const [novaSessao, setNovaSessao] = useState('');
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);  const [statsVisible, setStatsVisible] = useState(true);
  const [viewMode, setViewMode] = useState('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMoreSessions, setShowMoreSessions] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null); // Novo estado para controlar o filtro de status
  
  // Estatísticas
  const [stats, setStats] = useState({
    total: 0,
    emDia: 0,
    emAtencao: 0,
    atrasados: 0
  });  // Mostrar toast notification
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };
  
  // Salvar nome do departamento
  const saveDepartmentName = () => {
    setDepartmentName(tempDepartmentName);
    localStorage.setItem('kasstor_department_name', tempDepartmentName);
    setShowDepartmentModal(false);
    showToast('Nome do setor salvo com sucesso', 'success');
  };
    // Função para aplicar filtro de status
  const aplicarFiltroStatus = (filtro) => {
    if (statusFilter === filtro) {
      // Se clicar no mesmo filtro, remove o filtro (toggle)
      setStatusFilter(null);
      showToast("Filtro removido", "info");
    } else {
      setStatusFilter(filtro);    const mensagens = {
        'total': 'Mostrando todos os itens',
        'emDia': 'Filtrando itens dentro do prazo',
        'emAtencao': 'Filtrando itens em atenção',
        'atrasados': 'Filtrando itens atrasados',
        'concluido': 'Filtrando itens concluídos',
        'recentes': 'Filtrando itens criados nos últimos 7 dias',
        'intermediarios': 'Filtrando itens criados entre 7 e 30 dias atrás',
        'antigos': 'Filtrando itens criados há mais de 30 dias',
        'venceHoje': 'Filtrando itens que vencem hoje',
        'venceEmBreve': 'Filtrando itens que vencem em breve (próximos 3 dias)',
        'atrasados2': 'Filtrando itens com prazo expirado'
      };
      showToast(mensagens[filtro] || 'Filtro aplicado', "info");
    }
  };
  // Carregar nome do departamento do localStorage
  useEffect(() => {
    const savedDepartment = localStorage.getItem('kasstor_department_name');
    if (savedDepartment) {
      setDepartmentName(savedDepartment);
      setTempDepartmentName(savedDepartment);
    }
  }, []);
  
  // Buscar usuário logado
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    getUser();
  }, []);

  // Carregar sessões e itens do Supabase
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Buscar todas as sessões
      const { data: sessoesData, error: sessoesError } = await supabase
        .from('planos_acao_sessoes')
        .select('*')
        .order('nome');
      
      if (sessoesError) throw sessoesError;
      
      // Buscar todos os itens
      const { data: itensData, error: itensError } = await supabase
        .from('planos_acao_itens')
        .select('*')
        .order('prazo_final');
      
      if (itensError) throw itensError;
    // Processar os itens com status calculado e idade
      const itensProcessados = itensData.map(item => {
        const diasDesdeACriacao = calcularIdade(item.created_at);
        const infoIdade = getClasseIdade(diasDesdeACriacao);
        const diasParaPrazo = calcularDiasParaPrazo(item.prazo_final);
        const infoPrazo = formatarMensagemPrazo(diasParaPrazo);
        
        return {
          ...item,
          status: calcularStatus(item.prazo_final, item.concluido),
          idade: {
            dias: diasDesdeACriacao,
            ...infoIdade
          },
          prazo: {
            dias: diasParaPrazo,
            ...infoPrazo
          }
        };
      });
      
      // Agrupar itens por sessão
      const sessionsWithItens = sessoesData.map(session => ({
        ...session,
        itens: itensProcessados.filter(item => item.sessao_id === session.id)
      }));
      
      setSessions(sessionsWithItens);
      
      // Calcular estatísticas
      const totalItens = itensProcessados.length;
      const emDia = itensProcessados.filter(item => item.status.texto === 'Dentro do prazo').length;
      const emAtencao = itensProcessados.filter(item => item.status.texto === 'Atenção').length;
      const atrasados = itensProcessados.filter(item => item.status.texto === 'Atrasado').length;
      
      setStats({
        total: totalItens,
        emDia,
        emAtencao,
        atrasados
      });
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showToast('Erro ao carregar dados. Tente novamente mais tarde.', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  // Carregar dados quando o usuário estiver disponível
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);
  // Filtra os itens com base na sessão selecionada, pesquisa e status
  const itensFiltrados = () => {
    if (!sessions || sessions.length === 0) return [];
    
    // Primeiro filtra por sessão
    let itens = [];
    if (sessaoSelecionada === 'todas') {
      itens = sessions.flatMap(session => 
        session.itens ? session.itens.map(item => ({
          ...item,
          sessao: session.nome
        })) : []
      );
    } else {
      const session = sessions.find(s => s.nome === sessaoSelecionada);
      itens = session && session.itens ? session.itens.map(item => ({
        ...item,
        sessao: session.nome
      })) : [];
    }
      // Filtra por status se houver um filtro ativo
    if (statusFilter) {
      itens = itens.filter(item => {
        if (statusFilter === 'concluido') return item.concluido;
        if (statusFilter === 'emDia') return !item.concluido && item.status.texto === 'Dentro do prazo';
        if (statusFilter === 'emAtencao') return !item.concluido && item.status.texto === 'Atenção';
        if (statusFilter === 'atrasados') return !item.concluido && item.status.texto === 'Atrasado';
        if (statusFilter === 'recentes') return item.idade.dias <= 7; // Itens criados nos últimos 7 dias
        if (statusFilter === 'intermediarios') return item.idade.dias > 7 && item.idade.dias <= 30; // Entre 8 e 30 dias
        if (statusFilter === 'antigos') return item.idade.dias > 30; // Mais de 30 dias
        if (statusFilter === 'venceHoje') return item.prazo.dias === 0; // Itens que vencem hoje
        if (statusFilter === 'venceEmBreve') return item.prazo.dias > 0 && item.prazo.dias <= 3; // Vencem em até 3 dias
        if (statusFilter === 'atrasados2') return item.prazo.dias < 0; // Itens atrasados (prazo expirado)
        return true; // Retorna true por padrão se não houver correspondência
      });
    }
    
    // Depois filtra por pesquisa se houver um termo de busca
    if (searchQuery && searchQuery.trim() !== '') {
      const termoDeBusca = searchQuery.toLowerCase().trim();
      return itens.filter(item => 
        (item.problema && item.problema.toLowerCase().includes(termoDeBusca)) ||
        (item.contramedida && item.contramedida.toLowerCase().includes(termoDeBusca)) ||
        (item.causa_raiz && item.causa_raiz.toLowerCase().includes(termoDeBusca)) ||
        (item.responsavel && item.responsavel.toLowerCase().includes(termoDeBusca)) ||
        (item.os && item.os.toLowerCase().includes(termoDeBusca)) ||
        (item.sessao && item.sessao.toLowerCase().includes(termoDeBusca))
      );
    }
    
    return itens;
  };

  // Adicionar novo item no plano de ação
  const handleAdicionarItem = async () => {
    if (!novoItem.problema || !novoItem.contramedida || !novoItem.responsavel || !novoItem.prazoFinal || !novoItem.sessao_id) {
      showToast("Por favor, preencha todos os campos obrigatórios.", "error");
      return;
    }

    if (!user) {
      showToast("Você precisa estar logado para adicionar um item.", "error");
      return;
    }

    try {      const { data, error } = await supabase
        .from('planos_acao_itens')
        .insert([
          { 
            sessao_id: parseInt(novoItem.sessao_id), 
            problema: novoItem.problema,
            causa_raiz: novoItem.causaRaiz,
            contramedida: novoItem.contramedida,
            responsavel: novoItem.responsavel,
            prazo_final: novoItem.prazoFinal,
            os: novoItem.os, // Adicionado campo OS
            user_id: user.id
          }
        ])
        .select();

      if (error) throw error;

      showToast("Item adicionado com sucesso!", "success");
      await fetchData();      setNovoItem({
        problema: '',
        causaRaiz: '',
        contramedida: '',
        responsavel: '',
        prazoFinal: '',
        sessao_id: '',
        os: ''
      });
      setShowForm(false);
    } catch (error) {
      console.error("Erro ao adicionar item:", error);
      showToast("Erro ao adicionar item. Tente novamente.", "error");
    }
  };
  // Editar item existente
  const handleEditarItem = (item) => {
    setItemEmEdicao({
      id: item.id,
      problema: item.problema,
      causa_raiz: item.causa_raiz,
      contramedida: item.contramedida,
      responsavel: item.responsavel,
      prazo_final: item.prazo_final,
      sessao_id: item.sessao_id.toString(),
      os: item.os || '' // Adicionado campo OS
    });
    setShowEditForm(true);
  };

  // Salvar edição de item
  const handleSalvarEdicao = async () => {    if (!itemEmEdicao || !itemEmEdicao.id) return;
    
    if (!itemEmEdicao.problema || !itemEmEdicao.contramedida || !itemEmEdicao.responsavel || 
        !itemEmEdicao.prazo_final || !itemEmEdicao.sessao_id) {
      showToast("Por favor, preencha todos os campos obrigatórios.", "error");
      return;
    }

    try {      const { error } = await supabase
        .from('planos_acao_itens')
        .update({ 
          sessao_id: parseInt(itemEmEdicao.sessao_id),
          problema: itemEmEdicao.problema,
          causa_raiz: itemEmEdicao.causa_raiz,
          contramedida: itemEmEdicao.contramedida,
          responsavel: itemEmEdicao.responsavel,
          prazo_final: itemEmEdicao.prazo_final,
          os: itemEmEdicao.os || 'N/A' // Adicionado campo OS
        })
        .eq('id', itemEmEdicao.id);

      if (error) throw error;
      
      showToast("Item atualizado com sucesso!", "success");
      await fetchData();
      setShowEditForm(false);
      setItemEmEdicao(null);
    } catch (error) {
      console.error("Erro ao atualizar item:", error);
      showToast("Erro ao atualizar item. Tente novamente.", "error");
    }
  };
  // Excluir item
  const handleExcluirItem = async (id) => {
    if (!confirm("Tem certeza que deseja excluir este item?")) return;
      try {
      const { error } = await supabase
        .from('planos_acao_itens')
        .delete()
        .eq('id', id);
      if (error) throw error;
      
      showToast("Item excluído com sucesso!", "success");
      await fetchData();
    } catch (error) {
      console.error("Erro ao excluir item:", error);
      showToast("Erro ao excluir item. Tente novamente.", "error");
    }
  };

  // Adicionar nova sessão
  const handleAdicionarSessao = async () => {
    if (!novaSessao) {
      showToast("Por favor, digite um nome para a sessão.", "error");
      return;
    }
    
    if (!user) {
      showToast("Você precisa estar logado para adicionar uma sessão.", "error");
      return;
    }

    try {
      // Verificar se já existe uma sessão com este nome
      const { data: existingSessions } = await supabase
        .from('planos_acao_sessoes')
        .select('id')
        .eq('nome', novaSessao)
        .limit(1);
          if (existingSessions && existingSessions.length > 0) {
        showToast("Já existe uma sessão com este nome.", "error");
        return;
      }
      const { error } = await supabase
        .from('planos_acao_sessoes')
        .insert([
          { nome: novaSessao, user_id: user.id }
        ]);

      if (error) throw error;
      
      showToast("Sessão criada com sucesso!", "success");
      await fetchData();
      setNovaSessao('');
      setShowSessionForm(false);
    } catch (error) {
      console.error("Erro ao criar sessão:", error);
      showToast("Erro ao criar sessão. Tente novamente.", "error");
    }
  };
  
  // Excluir sessão
  const handleExcluirSessao = async (id) => {
    if (!confirm("Tem certeza que deseja excluir esta sessão? Todos os itens relacionados serão excluídos permanentemente.")) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('planos_acao_sessoes')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      showToast("Sessão excluída com sucesso!", "success");
      await fetchData();
      setSessaoSelecionada('todas');
    } catch (error) {
      console.error("Erro ao excluir sessão:", error);
      showToast("Erro ao excluir sessão. Tente novamente.", "error");
    }
  };  const exportToExcel = async () => {
    const itens = itensFiltrados();
    if (!itens.length) {
      showToast("Não há dados para exportar", "error");
      return;
    }    try {
      // Importar as bibliotecas necessárias dinamicamente
      const ExcelJS = (await import('exceljs')).default;
      const FileSaver = await import('file-saver');
      const saveAs = FileSaver.saveAs;  // Obter a função saveAs corretamente
      
      // Criar uma nova planilha
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'PWA Kastor';
      workbook.lastModifiedBy = 'PWA Kastor';
      workbook.created = new Date();
      workbook.modified = new Date();
      
      // Adicionar uma planilha
      const worksheet = workbook.addWorksheet('Plano de Ação', {
        properties: { tabColor: { argb: '4F81BD' } }
      });
      
      // Definir colunas
      let columns = [
        { header: 'Problema', key: 'problema', width: 30 },
        { header: 'Causa Raiz', key: 'causa_raiz', width: 30 },
        { header: 'Contramedida', key: 'contramedida', width: 30 },
        { header: 'Responsável', key: 'responsavel', width: 20 },
        { header: 'Prazo Final', key: 'prazo_final', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Idade', key: 'idade', width: 10 },
        { header: 'Data de Criação', key: 'data_criacao', width: 15 }
      ];
      
      if (sessaoSelecionada === 'todas') {
        columns.unshift({ header: 'Sessão', key: 'sessao', width: 20 });
      }
      
      worksheet.columns = columns;
        // Adicionar dados
      itens.forEach(item => {
        const idadeItem = calcularIdade(item.created_at);
        const idadeInfo = getClasseIdade(idadeItem);
        
        // Garantir que temos os dados válidos e fazer tratamento de possíveis campos nulos
        const rowData = {
          problema: item.problema || 'Sem descrição',
          causa_raiz: item.causa_raiz || '-',
          contramedida: item.contramedida || '-',
          responsavel: item.responsavel || '-',
          status: (item.status && item.status.texto) ? item.status.texto : '-',
          idade: idadeInfo ? idadeInfo.texto : '-',
        };

        // Tratamento especial para datas para evitar erro de data inválida
        try {
          if (item.prazo_final) {
            rowData.prazo_final = new Date(item.prazo_final);
            if (isNaN(rowData.prazo_final.getTime())) {
              rowData.prazo_final = '-';
            }
          } else {
            rowData.prazo_final = '-';
          }
          
          if (item.created_at) {
            rowData.data_criacao = new Date(item.created_at);
            if (isNaN(rowData.data_criacao.getTime())) {
              rowData.data_criacao = '-';
            }
          } else {
            rowData.data_criacao = '-';
          }
        } catch (e) {
          console.error("Erro ao processar datas:", e);
          rowData.prazo_final = '-';
          rowData.data_criacao = '-';
        }
        
        if (sessaoSelecionada === 'todas') {
          rowData.sessao = item.sessao || '-';
        }
        
        worksheet.addRow(rowData);
      });
      
      // Estilizar o cabeçalho
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '4472C4' } // Azul
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
        // Estilizar células com base no status
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Pular o cabeçalho
          try {
            const statusCell = row.getCell('status');
            const status = statusCell?.value || '';
            
            // Definir cor de fundo baseada no status
            let fillColor = 'FFFFFF'; // Branco padrão
            
            if (status === 'Concluído') {
              fillColor = 'C6E0B4'; // Verde claro
            } else if (status === 'Dentro do prazo') {
              fillColor = 'D5F5E3'; // Verde mais claro
            } else if (status === 'Em andamento' || status === 'Atenção') {
              fillColor = 'FFE699'; // Amarelo claro
            } else if (status === 'Não iniciado') {
              fillColor = 'F8CBAD'; // Laranja claro
            } else if (status === 'Atrasado') {
              fillColor = 'F5B7B1'; // Vermelho claro
            }
            
            statusCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: fillColor }
            };
            
            // Formatar células de data
            const prazoCell = row.getCell('prazo_final');
            if (prazoCell && prazoCell.value && prazoCell.value instanceof Date) {
              prazoCell.numFmt = 'dd/mm/yyyy';
            }
            
            const dataCriacaoCell = row.getCell('data_criacao');
            if (dataCriacaoCell && dataCriacaoCell.value && dataCriacaoCell.value instanceof Date) {
              dataCriacaoCell.numFmt = 'dd/mm/yyyy';
            }
          } catch (err) {
            console.error("Erro ao estilizar célula:", err);
            // Continue mesmo se houver erro em uma linha específica
          }
        }
      });
        // Adicionar bordas em todas as células
      worksheet.eachRow((row) => {
        try {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
        } catch (err) {
          console.error("Erro ao adicionar bordas:", err);
          // Continue mesmo se houver erro em uma linha específica
        }
      });
      
      // Adicionar filtro ao cabeçalho
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: worksheet.columns.length }
      };
      
      // Congelar a primeira linha
      worksheet.views = [
        { state: 'frozen', xSplit: 0, ySplit: 1 }
      ];
        // Gerar o arquivo
      console.log("Gerando buffer da planilha...");
      const buffer = await workbook.xlsx.writeBuffer();
      console.log("Buffer gerado com sucesso!");
      
      const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const hoje = new Date();
      const fileDate = `${hoje.getDate()}-${hoje.getMonth()+1}-${hoje.getFullYear()}`;
      const fileName = `Plano-de-acao-${fileDate}.xlsx`;
        // Salvar o arquivo
      console.log("Criando blob do arquivo...");
      const blob = new Blob([buffer], { type: fileType });
      console.log("Salvando arquivo:", fileName);
      
      // Usar saveAs do FileSaver para garantir que a função existe
      if (typeof saveAs === 'function') {
        saveAs(blob, fileName);
      } else {
        console.log("Usando método alternativo para download...");
        // Método alternativo de download caso saveAs não seja uma função
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }
      
      showToast("Planilha exportada com sucesso!", "success");    } catch (error) {
      console.error("Erro ao exportar planilha:", error);
      
      // Mostrar mensagem de erro mais específica para ajudar na depuração
      let mensagemErro = "Erro ao exportar planilha.";
      if (error.message) {
        mensagemErro += " Detalhes: " + error.message;
      }
      
      showToast(mensagemErro, "error");
    }
  };
  // Marcar item como concluído ou não concluído
  const handleMarcarConcluido = async (id, concluido) => {
    try {
      const { error } = await supabase
        .from('planos_acao_itens')
        .update({ concluido })
        .eq('id', id);

      if (error) throw error;
      
      showToast(concluido 
        ? "Item marcado como concluído!" 
        : "Item marcado como não concluído!", 
        "success");
      await fetchData();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      showToast("Erro ao atualizar status. Tente novamente.", "error");
    }
  };    return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Topbar 
        user={user} 
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
        title="Plano de Ação"
      />
        {/* Header com banner da página - Design moderno e funcional */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 dark:from-blue-800 dark:via-blue-900 dark:to-indigo-950 shadow-lg rounded-lg mb-6">
        <div className="max-w-full mx-auto py-6 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          {/* Elementos decorativos de fundo */}
          <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="text-white fill-current">
              <path d="M46.5,-76.3C59.2,-69.7,67.8,-54.3,75.1,-38.8C82.4,-23.3,88.4,-7.7,87.1,7.3C85.8,22.3,77.2,36.8,66.3,48.1C55.5,59.5,42.3,67.7,28.6,73.8C14.8,79.9,0.4,83.8,-13.9,81.8C-28.3,79.7,-42.6,71.7,-53.6,60.5C-64.6,49.3,-72.4,35,-77.9,19.7C-83.5,4.4,-86.8,-12,-82,-26C-77.1,-40.1,-64,-51.7,-49.8,-57.9C-35.6,-64.1,-20.3,-64.9,-4.2,-58.7C11.9,-52.5,33.8,-83,46.5,-76.3Z" transform="translate(100 100)" />
            </svg>
          </div>
            <div className="md:flex md:items-center md:justify-between relative z-10">
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <div className="bg-white/10 p-2.5 rounded-lg mr-4 hidden sm:flex items-center justify-center">
                  <DocumentTextIcon className="h-6 w-6 text-white" />
                </div>
                <div className="relative">
                  <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl tracking-tight group flex items-center">
                    Plano de Ação {departmentName && <span className="ml-2 text-blue-200">- {departmentName}</span>}
                    <button 
                      onClick={() => setShowDepartmentModal(true)}
                      className="ml-2 opacity-40 hover:opacity-100 transition-opacity focus:outline-none" 
                      title="Editar nome do setor"
                    >
                      <PencilIcon className="h-4 w-4 text-blue-200" />
                    </button>
                  </h1>
                  <p className="mt-1.5 text-sm text-blue-100 dark:text-blue-200 max-w-3xl">
                    Gerencie, acompanhe e monitore as ações corretivas e melhorias do seu processo de forma eficiente e colaborativa
                  </p>
                </div>
              </div>
              
              {/* Indicadores de status condensados */}
              <div className="mt-4 flex flex-wrap gap-2 sm:gap-4">
                <div className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center">
                  <div className="h-2 w-2 rounded-full bg-green-400 mr-2"></div>
                  <span className="text-xs font-medium text-white">{stats.emDia} Em dia</span>
                </div>
                <div className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center">
                  <div className="h-2 w-2 rounded-full bg-yellow-400 mr-2"></div>
                  <span className="text-xs font-medium text-white">{stats.emAtencao} Em atenção</span>
                </div>
                <div className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center">
                  <div className="h-2 w-2 rounded-full bg-red-400 mr-2"></div>
                  <span className="text-xs font-medium text-white">{stats.atrasados} Atrasados</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex flex-col sm:flex-row gap-3 md:mt-0 md:ml-4">              <button
                onClick={exportToExcel}
                className="inline-flex items-center justify-center px-4 py-2 border border-white/20 rounded-lg shadow-sm text-sm font-medium text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors backdrop-blur-sm"
                title="Exportar dados para planilha Excel"
              >                <DocumentArrowDownIcon className="h-4 w-4 mr-2" /> 
                Exportar Excel
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-blue-800 dark:text-white bg-white hover:bg-blue-50 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 transition-colors"
              >
                <PlusIcon className="h-4 w-4 mr-2" /> 
                Novo Item
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="pt-6 pb-16 px-4 sm:px-6 lg:px-8 max-w-full mx-auto space-y-6">
        {/* Toast notification */}
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type}
            onClose={() => setToast(null)} 
          />
        )}
        
        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-10 px-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Carregando informações...</p>
          </div>
        )}
        {/* Stats Dashboard */}      {!isLoading && statsVisible && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750 flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <span className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                <ChartBarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Dashboard de Desempenho</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Acompanhamento em tempo real do progresso do plano de ação</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => fetchData()}
                className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center text-sm text-gray-600 dark:text-gray-300" 
                title="Atualizar dados"
              >
                <ArrowPathIcon className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Atualizar</span>
              </button>
              <button 
                onClick={() => setStatsVisible(false)} 
                className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Fechar painel"
              >
                <XMarkIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 sm:divide-x sm:divide-y-0 divide-y divide-gray-200 dark:divide-gray-700">
            <button 
              onClick={() => aplicarFiltroStatus('total')}
              className={`text-left p-6 flex items-center space-x-4 transition-all ${statusFilter === 'total' 
                ? 'bg-blue-50/50 dark:bg-blue-900/20' 
                : 'hover:bg-gray-50 dark:hover:bg-blue-900/10'}`}
            >
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-full p-3 flex-shrink-0">
                <CheckCircleIcon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total de Itens</div>
                <div className="mt-1 h-1 w-20 bg-gray-200 dark:bg-gray-700 rounded-full">
                  <div className="h-1 bg-blue-600 rounded-full" style={{ width: '100%' }}></div>
                </div>
                {statusFilter === 'total' && (
                  <div className="mt-1 inline-flex items-center text-xs text-blue-600 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
                    <FilterIcon className="h-3 w-3 mr-1" /> Filtro ativo
                  </div>
                )}
              </div>
            </button>
            
            <button 
              onClick={() => aplicarFiltroStatus('emDia')}
              className={`text-left p-6 flex items-center space-x-4 transition-all ${statusFilter === 'emDia' 
                ? 'bg-green-50/50 dark:bg-green-900/20' 
                : 'hover:bg-green-50/20 dark:hover:bg-green-900/10'}`}
            >
              <div className="bg-green-50 dark:bg-green-900/20 rounded-full p-3 flex-shrink-0">
                <CheckIcon className="h-7 w-7 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.emDia}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Dentro do Prazo</div>
                <div className="mt-1 h-1 w-20 bg-gray-200 dark:bg-gray-700 rounded-full">
                  <div className="h-1 bg-green-500 rounded-full" style={{ width: `${stats.total ? (stats.emDia / stats.total) * 100 : 0}%` }}></div>
                </div>
                {statusFilter === 'emDia' && (
                  <div className="mt-1 inline-flex items-center text-xs text-green-600 dark:text-green-400 bg-green-100/50 dark:bg-green-900/30 px-2 py-0.5 rounded-md">
                    <FilterIcon className="h-3 w-3 mr-1" /> Filtro ativo
                  </div>
                )}
              </div>
            </button>
            
            <button 
              onClick={() => aplicarFiltroStatus('emAtencao')}
              className={`text-left p-6 flex items-center space-x-4 transition-all ${statusFilter === 'emAtencao' 
                ? 'bg-yellow-50/50 dark:bg-yellow-900/20' 
                : 'hover:bg-yellow-50/20 dark:hover:bg-yellow-900/10'}`}
            >
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-full p-3 flex-shrink-0">
                <ClockIcon className="h-7 w-7 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.emAtencao}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Em Atenção</div>
                <div className="mt-1 h-1 w-20 bg-gray-200 dark:bg-gray-700 rounded-full">
                  <div className="h-1 bg-yellow-500 rounded-full" style={{ width: `${stats.total ? (stats.emAtencao / stats.total) * 100 : 0}%` }}></div>
                </div>
                {statusFilter === 'emAtencao' && (
                  <div className="mt-1 inline-flex items-center text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-100/50 dark:bg-yellow-900/30 px-2 py-0.5 rounded-md">
                    <FilterIcon className="h-3 w-3 mr-1" /> Filtro ativo
                  </div>
                )}
              </div>
            </button>
            
            <button 
              onClick={() => aplicarFiltroStatus('atrasados')}
              className={`text-left p-6 flex items-center space-x-4 transition-all ${statusFilter === 'atrasados' 
                ? 'bg-red-50/50 dark:bg-red-900/20' 
                : 'hover:bg-red-50/20 dark:hover:bg-red-900/10'}`}
            >
              <div className="bg-red-50 dark:bg-red-900/20 rounded-full p-3 flex-shrink-0">
                <ExclamationCircleIcon className="h-7 w-7 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.atrasados}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Atrasados</div>
                <div className="mt-1 h-1 w-20 bg-gray-200 dark:bg-gray-700 rounded-full">
                  <div className="h-1 bg-red-500 rounded-full" style={{ width: `${stats.total ? (stats.atrasados / stats.total) * 100 : 0}%` }}></div>
                </div>
                {statusFilter === 'atrasados' && (
                  <div className="mt-1 inline-flex items-center text-xs text-red-600 dark:text-red-400 bg-red-100/50 dark:bg-red-900/30 px-2 py-0.5 rounded-md">
                    <FilterIcon className="h-3 w-3 mr-1" /> Filtro ativo
                  </div>
                )}
              </div>
            </button>
          </div>          {/* Barra de progresso para visualizar proporção */}
          {stats.total > 0 && (
            <div>
              <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span>Progresso geral</span>
                      <span>{Math.round((stats.emDia / stats.total) * 100)}% dentro do prazo</span>
                    </div>
                    <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                      <div 
                        className="bg-green-500" 
                        style={{ width: `${(stats.emDia / stats.total) * 100}%` }}
                      ></div>
                      <div 
                        className="bg-yellow-500" 
                        style={{ width: `${(stats.emAtencao / stats.total) * 100}%` }}
                      ></div>
                      <div 
                        className="bg-red-500" 
                        style={{ width: `${(stats.atrasados / stats.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => aplicarFiltroStatus('concluido')}
                      className={`flex items-center text-xs font-medium py-1 px-2 rounded-md transition-colors ${
                        statusFilter === 'concluido' 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' 
                          : 'bg-gray-100 text-gray-700 hover:bg-blue-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      <CheckCircleIcon className="h-3.5 w-3.5 mr-1" />
                      Ver concluídos
                      {statusFilter === 'concluido' ? (
                        <XMarkIcon className="h-3.5 w-3.5 ml-1.5" />
                      ) : null}
                    </button>
                      <div className="hidden sm:flex items-center flex-wrap gap-1">
                      <div className="hidden md:flex items-center gap-1">
                        <button
                          onClick={() => aplicarFiltroStatus('recentes')}
                          className={`flex items-center text-xs font-medium py-1 px-2 rounded-md transition-colors ${
                            statusFilter === 'recentes' 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' 
                              : 'bg-gray-100 text-gray-700 hover:bg-green-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                          }`}
                          title="Criados nos últimos 7 dias"
                        >
                          <ClockIcon className="h-3.5 w-3.5 mr-1" />
                          Recentes
                          {statusFilter === 'recentes' ? (
                            <XMarkIcon className="h-3.5 w-3.5 ml-1.5" />
                          ) : null}
                        </button>
                        
                        <button
                          onClick={() => aplicarFiltroStatus('antigos')}
                          className={`flex items-center text-xs font-medium py-1 px-2 rounded-md transition-colors ${
                            statusFilter === 'antigos' 
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' 
                              : 'bg-gray-100 text-gray-700 hover:bg-red-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                          }`}
                          title="Criados há mais de 30 dias"
                        >
                          <ClockIcon className="h-3.5 w-3.5 mr-1" />
                          Antigos
                          {statusFilter === 'antigos' ? (
                            <XMarkIcon className="h-3.5 w-3.5 ml-1.5" />
                          ) : null}
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-1 ml-1">
                        <button
                          onClick={() => aplicarFiltroStatus('venceHoje')}
                          className={`flex items-center text-xs font-medium py-1 px-2 rounded-md transition-colors ${
                            statusFilter === 'venceHoje' 
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' 
                              : 'bg-gray-100 text-gray-700 hover:bg-yellow-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                          }`}
                          title="Vence hoje"
                        >
                          <ExclamationCircleIcon className="h-3.5 w-3.5 mr-1" />
                          Vence hoje
                          {statusFilter === 'venceHoje' ? (
                            <XMarkIcon className="h-3.5 w-3.5 ml-1.5" />
                          ) : null}
                        </button>
                        
                        <button
                          onClick={() => aplicarFiltroStatus('atrasados2')}
                          className={`flex items-center text-xs font-medium py-1 px-2 rounded-md transition-colors ${
                            statusFilter === 'atrasados2' 
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' 
                              : 'bg-gray-100 text-gray-700 hover:bg-red-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                          }`}
                          title="Prazo expirado"
                        >
                          <ClockIcon className="h-3.5 w-3.5 mr-1" />
                          Atrasados
                          {statusFilter === 'atrasados2' ? (
                            <XMarkIcon className="h-3.5 w-3.5 ml-1.5" />
                          ) : null}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
        {/* Navegação e controles inteligentes */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap -mb-px">              <button
                onClick={() => {
                  setSessaoSelecionada('todas');
                  setStatusFilter(null); // Limpa o filtro quando muda de sessão
                }}
                className={`inline-flex items-center whitespace-nowrap border-b-2 py-4 px-4 text-sm font-medium ${
                  sessaoSelecionada === 'todas' 
                    ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400' 
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <FolderIcon 
                  className={`mr-2 h-5 w-5 ${
                    sessaoSelecionada === 'todas' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                  }`} 
                />
                Todas as Sessões
              </button>
              
              {sessions.slice(0, 5).map((session) => (
                <div key={session.id} className="relative group">                  <button
                    onClick={() => {
                      setSessaoSelecionada(session.nome);
                      setStatusFilter(null); // Limpa o filtro quando muda de sessão
                    }}
                    className={`inline-flex items-center whitespace-nowrap border-b-2 py-4 px-4 text-sm font-medium ${
                      sessaoSelecionada === session.nome 
                        ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400' 
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    {session.nome}
                  </button>
                  <button 
                    onClick={() => handleExcluirSessao(session.id)}
                    className="hidden group-hover:block absolute top-3 right-0 p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Excluir sessão"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {/* Dropdown para sessões adicionais */}
              {sessions.length > 5 && (
                <div className="relative inline-block">
                  <button
                    onClick={() => setShowMoreSessions(!showMoreSessions)}
                    className="inline-flex items-center whitespace-nowrap border-b-2 border-transparent py-4 px-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    Mais <ChevronDownIcon className="ml-1 h-4 w-4" />
                  </button>
                  {showMoreSessions && (
                    <div className="absolute z-10 right-0 mt-1 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
                      <div className="py-1">
                        {sessions.slice(5).map((session) => (
                          <button
                            key={session.id}                            onClick={() => {
                              setSessaoSelecionada(session.nome);
                              setShowMoreSessions(false);
                              setStatusFilter(null); // Limpa o filtro quando muda de sessão
                            }}
                            className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            {session.nome}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="ml-auto flex items-center">
                {!statsVisible && (
                  <button
                    onClick={() => setStatsVisible(true)}
                    className="inline-flex items-center px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 mr-2 border border-blue-200 dark:border-blue-800"
                  >
                    <ChartBarIcon className="h-4 w-4 mr-1.5" /> 
                    <span className="hidden sm:inline">Dashboard</span>
                  </button>
                )}
                
                <button
                  onClick={() => setShowSessionForm(true)}
                  className="inline-flex items-center px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-800"
                >
                  <PlusIcon className="h-4 w-4 mr-1.5" /> 
                  <span className="hidden sm:inline">Sessão</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      
        <div className="px-4 sm:px-6 lg:px-8 py-4 bg-gray-50 dark:bg-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{sessaoSelecionada !== 'todas' ? `Plano: ${sessaoSelecionada}` : 'Todos os Planos de Ação'}</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {itensFiltrados().length === 0 ? 'Nenhum item encontrado' : 
                  `${itensFiltrados().length} ${itensFiltrados().length === 1 ? 'item' : 'itens'} disponíveis`}
              </p>
            </div>
              <div className="flex flex-wrap gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar itens..."
                  className="pl-9 pr-9 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full sm:w-auto"
                  value={searchQuery || ''}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <SearchIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Limpar busca"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>              <div className="text-xs text-blue-600 dark:text-blue-400">
                {searchQuery && itensFiltrados().length !== (sessaoSelecionada === 'todas' ? 
                  sessions.flatMap(s => s.itens || []).length : 
                  (sessions.find(s => s.nome === sessaoSelecionada)?.itens || []).length) && (
                  <span className="flex items-center">
                    <SearchIcon className="h-3 w-3 mr-1" />
                    {itensFiltrados().length} {itensFiltrados().length === 1 ? 'resultado' : 'resultados'} encontrados
                  </span>
                )}
              </div>
                
              
              {statusFilter && (
                <button
                  onClick={() => {
                    setStatusFilter(null);
                    showToast("Filtro de status removido", "info");
                  }}
                  className="flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors ml-2"
                  title="Limpar filtro de status"
                >
                  <FilterIcon className="h-4 w-4 mr-1.5" />
                  {statusFilter === 'total' && 'Todos os itens'}
                  {statusFilter === 'emDia' && 'Dentro do prazo'}
                  {statusFilter === 'emAtencao' && 'Em atenção'}
                  {statusFilter === 'atrasados' && 'Atrasados'}
                  {statusFilter === 'concluido' && 'Concluídos'}
                  <XMarkIcon className="h-3.5 w-3.5 ml-1.5 text-blue-500 dark:text-blue-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>{showSessionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            {/* Cabeçalho com destaque */}
            <div className="bg-green-600 dark:bg-green-700 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <FolderIcon className="h-5 w-5 text-white" />
                <h3 className="text-lg font-semibold text-white">Nova Sessão</h3>
              </div>
              <button 
                onClick={() => setShowSessionForm(false)}
                className="text-white/80 hover:text-white hover:bg-green-700 rounded-full p-1 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center">
                    <FolderIcon className="h-4 w-4 mr-1.5 text-green-500" />
                    Nome da Sessão<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    value={novaSessao}
                    onChange={(e) => setNovaSessao(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    placeholder="Ex: Cabine Manual 2"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Crie uma nova sessão para organizar itens relacionados no plano de ação.
                </p>
              </div>
              
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-end space-x-3">
                <button
                  onClick={() => setShowSessionForm(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center"
                >
                  <XMarkIcon className="h-5 w-5 mr-1" />
                  Cancelar
                </button>
                <button
                  onClick={handleAdicionarSessao}
                  className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center shadow-sm"
                >
                  <PlusIcon className="h-5 w-5 mr-1.5" />
                  Adicionar Sessão
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
        {showEditForm && itemEmEdicao && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            {/* Cabeçalho com destaque */}
            <div className="bg-indigo-600 dark:bg-indigo-700 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <PencilIcon className="h-5 w-5 text-white" />
                <h3 className="text-lg font-semibold text-white">Editar Item no Plano de Ação</h3>
              </div>
              <button 
                onClick={() => {setShowEditForm(false); setItemEmEdicao(null);}} 
                className="text-white/80 hover:text-white hover:bg-indigo-700 rounded-full p-1 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            {/* Conteúdo do formulário com espaçamento melhorado */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>                  
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1.5 text-amber-500" />
                    Problema<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    value={itemEmEdicao.problema || ''}
                    onChange={(e) => setItemEmEdicao({...itemEmEdicao, problema: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
                </div>
                <div>                  
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center">
                    <QuestionMarkCircleIcon className="h-4 w-4 mr-1.5 text-blue-500" />
                    Causa Raiz
                  </label>
                  <input
                    type="text"
                    value={itemEmEdicao.causa_raiz || ''}
                    onChange={(e) => setItemEmEdicao({...itemEmEdicao, causa_raiz: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
                </div>
                <div>                  
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center">
                    <WrenchScrewdriverIcon className="h-4 w-4 mr-1.5 text-green-500" />
                    Contramedida<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    value={itemEmEdicao.contramedida || ''}
                    onChange={(e) => setItemEmEdicao({...itemEmEdicao, contramedida: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
                </div>
                <div>                  
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center">
                    <UserIcon className="h-4 w-4 mr-1.5 text-indigo-500" />
                    Responsável<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    value={itemEmEdicao.responsavel || ''}
                    onChange={(e) => setItemEmEdicao({...itemEmEdicao, responsavel: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
                </div>
                <div>                  
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center">
                    <CalendarDaysIcon className="h-4 w-4 mr-1.5 text-red-500" />
                    Prazo Final<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="date"
                    value={itemEmEdicao.prazo_final || ''}
                    onChange={(e) => setItemEmEdicao({...itemEmEdicao, prazo_final: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
                </div>
                <div>                  
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center">
                    <DocumentTextIcon className="h-4 w-4 mr-1.5 text-purple-500" />
                    OS (Ordem de Serviço)
                    <button 
                      type="button" 
                      onClick={() => setItemEmEdicao({...itemEmEdicao, os: 'N/A'})}
                      className="ml-2 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded"
                    >
                      Preencher N/A
                    </button>
                  </label>
                  <input
                    type="text"
                    value={itemEmEdicao.os || ''}
                    onChange={(e) => setItemEmEdicao({...itemEmEdicao, os: e.target.value})}
                    placeholder="Número da OS ou N/A"
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
                </div>
                <div>                  
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center">
                    <FolderIcon className="h-4 w-4 mr-1.5 text-yellow-500" />
                    Sessão<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <select
                    value={itemEmEdicao.sessao_id || ''}
                    onChange={(e) => setItemEmEdicao({...itemEmEdicao, sessao_id: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  >
                    <option value="">Selecione uma sessão</option>
                    {sessions.map((session) => (
                      <option key={session.id} value={session.id}>{session.nome}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-end space-x-3">
                <button
                  onClick={() => {setShowEditForm(false); setItemEmEdicao(null);}}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center"
                >
                  <XMarkIcon className="h-5 w-5 mr-1" />
                  Cancelar
                </button>
                <button
                  onClick={handleSalvarEdicao}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center shadow-sm"
                >
                  <CheckIcon className="h-5 w-5 mr-1.5" />
                  Salvar Alterações
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}{showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            {/* Cabeçalho com destaque */}
            <div className="bg-blue-600 dark:bg-blue-700 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <PlusIcon className="h-5 w-5 text-white" />
                <h3 className="text-lg font-semibold text-white">Novo Item no Plano de Ação</h3>
              </div>
              <button 
                onClick={() => setShowForm(false)} 
                className="text-white/80 hover:text-white hover:bg-blue-700 rounded-full p-1 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            {/* Conteúdo do formulário com espaçamento melhorado */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1.5 text-amber-500" />
                    Problema<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    value={novoItem.problema}
                    onChange={(e) => setNovoItem({...novoItem, problema: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm dark:placeholder:text-gray-400"
                    placeholder="Descreva o problema identificado"
                  />
                </div>
                <div>                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center">
                    <QuestionMarkCircleIcon className="h-4 w-4 mr-1.5 text-blue-500" />
                    Causa Raiz
                  </label>
                  <input
                    type="text"
                    value={novoItem.causaRaiz}
                    onChange={(e) => setNovoItem({...novoItem, causaRaiz: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm dark:placeholder:text-gray-400"
                    placeholder="Identifique a causa raiz do problema"
                  />
                </div>
                <div>                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center">
                    <WrenchScrewdriverIcon className="h-4 w-4 mr-1.5 text-green-500" />
                    Contramedida<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    value={novoItem.contramedida}
                    onChange={(e) => setNovoItem({...novoItem, contramedida: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm dark:placeholder:text-gray-400"
                    placeholder="Descreva a ação corretiva"
                  />
                </div>
                <div>                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center">
                    <UserIcon className="h-4 w-4 mr-1.5 text-indigo-500" />
                    Responsável<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    value={novoItem.responsavel}
                    onChange={(e) => setNovoItem({...novoItem, responsavel: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm dark:placeholder:text-gray-400"
                    placeholder="Nome do responsável pela ação"
                  />
                </div>
                <div>                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center">
                    <DocumentTextIcon className="h-4 w-4 mr-1.5 text-purple-500" />
                    OS (Ordem de Serviço)
                    <button 
                      type="button" 
                      onClick={() => setNovoItem({...novoItem, os: 'N/A'})}
                      className="ml-2 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded"
                    >
                      Preencher N/A
                    </button>
                  </label>
                  <input
                    type="text"
                    value={novoItem.os}
                    onChange={(e) => setNovoItem({...novoItem, os: e.target.value})}
                    placeholder="Número da OS ou N/A"
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm dark:placeholder:text-gray-400"
                  />
                </div>
                <div>                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center">
                    <CalendarDaysIcon className="h-4 w-4 mr-1.5 text-red-500" />
                    Prazo Final<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="date"
                    value={novoItem.prazoFinal}
                    onChange={(e) => setNovoItem({...novoItem, prazoFinal: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm dark:placeholder:text-gray-400"
                  />
                </div>
                <div>                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center">
                    <FolderIcon className="h-4 w-4 mr-1.5 text-yellow-500" />
                    Sessão<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <select
                    value={novoItem.sessao_id}
                    onChange={(e) => setNovoItem({...novoItem, sessao_id: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm dark:placeholder:text-gray-400"
                  >
                    <option value="">Selecione uma sessão</option>
                    {sessions.map((session) => (
                      <option key={session.id} value={session.id}>{session.nome}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-end space-x-3">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center"
                >
                  <XMarkIcon className="h-5 w-5 mr-1" />
                  Cancelar
                </button>
                <button
                  onClick={handleAdicionarItem}
                  className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center shadow-sm dark:placeholder:text-gray-400"
                >
                  <PlusIcon className="h-5 w-5 mr-1.5" />
                  Adicionar Item
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}      {/* Alternador de visualização: Tabela/Cards */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Visualização:</span>
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button 
              type="button" 
              onClick={() => setViewMode('table')}
              className={`px-3.5 py-1.5 text-sm font-medium ${viewMode === 'table' 
                ? 'text-blue-700 bg-blue-100 border border-blue-500 dark:text-blue-300 dark:bg-blue-900/30 dark:border-blue-700' 
                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700'} 
                rounded-l-md focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-400 flex items-center transition-colors`}
            >
              <TableCellsIcon className="h-4 w-4 mr-1.5" />
              Tabela
            </button>
            <button 
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3.5 py-1.5 text-sm font-medium ${viewMode === 'cards' 
                ? 'text-blue-700 bg-blue-100 border border-blue-500 dark:text-blue-300 dark:bg-blue-900/30 dark:border-blue-700' 
                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700'} 
                rounded-r-md focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-400 flex items-center transition-colors`}
            >
              <Squares2X2Icon className="h-4 w-4 mr-1.5" />
              Cards
            </button>
          </div>
        </div>
        
        <div className="flex items-center">
          <button 
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-3.5 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
          >
            <PlusIcon className="h-4 w-4 mr-1.5" />
            Adicionar Item
          </button>
        </div>
      </div>      {/* Indicador de filtros ativos */}
      {statusFilter && (
        <div className="mb-4 flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center">
            <FilterIcon className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2" />            <span className="text-sm text-blue-700 dark:text-blue-300">
              {statusFilter === 'total' && 'Mostrando todos os itens do plano de ação'}
              {statusFilter === 'emDia' && 'Filtrando itens dentro do prazo'}
              {statusFilter === 'emAtencao' && 'Filtrando itens que precisam de atenção'}
              {statusFilter === 'atrasados' && 'Filtrando itens atrasados'}
              {statusFilter === 'concluido' && 'Mostrando apenas itens concluídos'}
              {statusFilter === 'recentes' && 'Mostrando itens criados nos últimos 7 dias'}
              {statusFilter === 'intermediarios' && 'Mostrando itens criados entre 7 e 30 dias atrás'}
              {statusFilter === 'antigos' && 'Mostrando itens criados há mais de 30 dias'}
              {statusFilter === 'venceHoje' && 'Mostrando itens que vencem hoje'}
              {statusFilter === 'venceEmBreve' && 'Mostrando itens que vencem nos próximos 3 dias'}
              {statusFilter === 'atrasados2' && 'Mostrando itens com prazo expirado'}
            </span>
          </div>
          <button 
            onClick={() => setStatusFilter(null)}
            className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-1 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800/50"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}
      
      {/* Visualização em Tabela */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed">
            <thead className="bg-gray-50 dark:bg-gray-750 sticky top-0 z-10"><tr>
                {sessaoSelecionada === 'todas' && (
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wide bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">Sessão</th>
                )}
                <th scope="col" className="px-5 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wide bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">Problema</th>
                <th scope="col" className="px-5 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wide bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">Causa Raiz</th>
                <th scope="col" className="px-5 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wide bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">Contramedida</th>                
                <th scope="col" className="px-5 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wide bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">Responsável</th>                <th scope="col" className="px-5 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wide bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">OS</th>                <th scope="col" className="px-5 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wide bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">Prazo Final</th>
                <th scope="col" className="px-5 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wide bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">Prazo</th>
                <th scope="col" className="px-5 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wide bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">Criado há</th>
                <th scope="col" className="px-5 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wide bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">Status</th>
                <th scope="col" className="px-5 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wide bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {itensFiltrados().map((item, index) => (                <motion.tr 
                  key={index} 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors duration-150"
                >{sessaoSelecionada === 'todas' && (
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">{item.sessao}</td>
                  )}
                  <td className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">{item.problema}</td>
                  <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">{item.causa_raiz || '-'}</td>
                  <td className="px-5 py-4 text-sm text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">{item.contramedida}</td>
                  <td className="px-5 py-4 text-sm text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                    <div className="font-semibold">{item.responsavel}</div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                    {item.os || 'N/A'}
                  </td>                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                      <CalendarDaysIcon className="h-4 w-4 mr-1.5 text-blue-500 dark:text-blue-400" />
                      {new Date(item.prazo_final).toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-center">
                      <div className={`flex items-center px-2.5 py-1 rounded-md ${
                        item.prazo.dias < 0 
                          ? 'bg-red-50 dark:bg-red-900/20' 
                          : item.prazo.dias === 0 
                            ? 'bg-yellow-50 dark:bg-yellow-900/20' 
                            : 'bg-green-50 dark:bg-green-900/20'
                      }`}>
                        {item.prazo.dias < 0 ? (
                          <ExclamationCircleIcon className="h-3.5 w-3.5 mr-1 text-red-500 dark:text-red-400" />
                        ) : item.prazo.dias === 0 ? (
                          <ExclamationCircleIcon className="h-3.5 w-3.5 mr-1 text-yellow-500 dark:text-yellow-400" />
                        ) : (
                          <ClockIcon className="h-3.5 w-3.5 mr-1 text-green-500 dark:text-green-400" />
                        )}
                        <span className={item.prazo.classe}>{item.prazo.texto}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-center">
                      <div className={`flex items-center px-2.5 py-1 rounded-md ${item.idade.dias > 30 ? 'bg-red-50 dark:bg-red-900/20' : item.idade.dias > 7 ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-gray-50 dark:bg-gray-700'}`}>
                        {item.idade.icone}
                        <span className={item.idade.classe}>{item.idade.texto}</span>
                        {item.idade.dias > 0 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1 hidden sm:inline">
                            ({new Date(item.created_at).toLocaleDateString('pt-BR')})
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-center">
                      <span className={item.status.badgePill}>
                        <div className="flex items-center">
                          {item.status.icon}
                          {item.status.texto}
                        </div>
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => handleEditarItem(item)}
                        className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/40 transition-colors"
                        title="Editar"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleMarcarConcluido(item.id, !item.concluido)}
                        className={item.concluido 
                          ? "p-1.5 bg-yellow-50 text-yellow-600 rounded-md hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/40 transition-colors" 
                          : "p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 transition-colors"}
                        title={item.concluido ? "Marcar como não concluído" : "Marcar como concluído"}
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleExcluirItem(item.id)}
                        className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors"
                        title="Excluir"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
                {itensFiltrados().length === 0 && (                <tr>                  <td 
                    colSpan={sessaoSelecionada === 'todas' ? 11 : 10} 
                    className="px-6 py-12 text-sm text-gray-600 dark:text-gray-300 text-center border-b border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full shadow-sm">
                        <ExclamationCircleIcon className="h-10 w-10 text-blue-500 dark:text-blue-400" />
                      </div>
                      <p className="text-base font-medium mb-1">Nenhum item encontrado no plano de ação</p>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">Adicione um novo item para começar</p>
                      <button
                        onClick={() => setShowForm(true)}
                        className="mt-2 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
                      >
                        <PlusIcon className="h-4 w-4 mr-1.5" />
                        Adicionar novo item
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Visualização em Cards */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {itensFiltrados().length === 0 ? (
            <div className="col-span-full flex items-center justify-center p-10 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4">
                  <ExclamationCircleIcon className="h-12 w-12" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nenhum item encontrado</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Comece adicionando um novo item ao plano de ação.</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-medium text-white hover:bg-blue-700 shadow-sm"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Adicionar novo item
                </button>
              </div>
            </div>
          ) : (            itensFiltrados().map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border-l-4 ${
                  item.concluido
                    ? "border-blue-500"
                    : item.status.texto === "Atrasado"
                    ? "border-red-500"
                    : item.status.texto === "Atenção"
                    ? "border-yellow-500"
                    : "border-green-500"
                }`}
              >
                <div className="p-5">
                  {sessaoSelecionada === 'todas' && (
                    <div className="inline-block px-2 py-1 text-xs font-medium rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 mb-2">
                      {item.sessao}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">{item.problema}</h3>
                    <span className={item.status.badgePill}>
                      <div className="flex items-center">
                        {item.status.icon}
                        {item.status.texto}
                      </div>
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{item.contramedida}</p>
                  
                  {item.causa_raiz && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Causa Raiz:</div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{item.causa_raiz}</p>
                    </div>
                  )}                  <div className="flex flex-wrap justify-between gap-4 mt-4">
                    <div>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Responsável:</div>
                      <p className="text-sm font-medium">{item.responsavel}</p>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">OS:</div>
                      <p className="text-sm font-medium">{item.os || 'N/A'}</p>
                    </div>                    <div>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Criado há:</div>
                      <div className={`flex items-center text-sm ${
                        item.idade.dias > 30 
                          ? 'text-red-600 dark:text-red-400' 
                          : item.idade.dias > 7 
                            ? 'text-yellow-600 dark:text-yellow-400' 
                            : 'text-green-600 dark:text-green-400'
                      }`}>
                        {item.idade.icone}
                        {item.idade.texto}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Prazo:</div>
                      <div className={`flex items-center text-sm`}>
                        {item.prazo.dias < 0 ? (
                          <ExclamationCircleIcon className="h-3.5 w-3.5 mr-1 text-red-500 dark:text-red-400" />
                        ) : item.prazo.dias === 0 ? (
                          <ExclamationCircleIcon className="h-3.5 w-3.5 mr-1 text-yellow-500 dark:text-yellow-400" />
                        ) : (
                          <ClockIcon className="h-3.5 w-3.5 mr-1 text-green-500 dark:text-green-400" />
                        )}
                        <span className={item.prazo.classe}>{item.prazo.texto}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Prazo Final:</div>
                      <p className="text-sm font-medium flex items-center justify-end">
                        <CalendarDaysIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                        {new Date(item.prazo_final).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3 flex justify-end space-x-3">
                  <button
                    onClick={() => handleEditarItem(item)}
                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                    title="Editar"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleMarcarConcluido(item.id, !item.concluido)}
                    className={item.concluido 
                      ? "text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300" 
                      : "text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"}
                    title={item.concluido ? "Marcar como não concluído" : "Marcar como concluído"}
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleExcluirItem(item.id)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    title="Excluir"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            ))          )}        </div>
      )}
      </div>
      
      {/* Modal para editar nome do departamento/setor */}
      <Modal
        isOpen={showDepartmentModal} 
        onClose={() => setShowDepartmentModal(false)}
        title="Editar Nome do Setor"
        size="sm"
        footer={
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowDepartmentModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              Cancelar
            </button>
            <button
              onClick={saveDepartmentName}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              Salvar
            </button>
          </div>
        }
      >
        <div className="p-4">
          <label htmlFor="departmentName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nome do Departamento/Setor
          </label>
          <div className="mt-1 mb-3">
            <input
              type="text"
              id="departmentName"
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:focus:border-blue-500 dark:focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              value={tempDepartmentName}
              onChange={(e) => setTempDepartmentName(e.target.value)}
              placeholder="Ex: Produção, Qualidade, Manutenção, etc."
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Este nome será exibido no cabeçalho e nos relatórios exportados.
          </p>
        </div>
      </Modal>
      
      {/* Toast notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
