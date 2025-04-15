"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/supabaseClient";
import { Button, Modal, TextInput, Label } from "flowbite-react";
import { ToastContainer, showToast } from "@/components/Toast/ToastContainer";
import { Toast } from "@/components/Toast/Toast";
import { HiOutlineQrcode, HiArrowLeft, HiOutlineInformationCircle } from "react-icons/hi";
import Link from "next/link";

export default function VagaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  
  const [space, setSpace] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: "", type: "" });
  
  // Modais
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [reallocateDialogOpen, setReallocateDialogOpen] = useState(false);
  const [signature, setSignature] = useState("");
  
  // Dados para realocação
  const [targetSpaces, setTargetSpaces] = useState([]);
  const [selectedTargetSpace, setSelectedTargetSpace] = useState(null);
  
  // Verificar se deve mostrar botão de retorno para alocação mobile
  const [showReturnToAllocation, setShowReturnToAllocation] = useState(false);
  
  // Verificar parâmetros da URL
  useEffect(() => {
    // Verificar se há parâmetro returnTo=alocacao-mobile na URL
    const queryParams = new URLSearchParams(window.location.search);
    const returnTo = queryParams.get('returnTo');
    
    if (returnTo === 'alocacao-mobile') {
      setShowReturnToAllocation(true);
    }
  }, []);
  
  // Carrega os dados da vaga quando a página é montada
  useEffect(() => {
    fetchSpaceData();
    fetchAvailableSpaces();
  }, [id]);

  // Função para mostrar notificações toast
  const displayToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: "", type: "" }), 3000);
  };

  // Busca os dados da vaga pelo ID
  const fetchSpaceData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from("storage_spaces")
        .select("*, storage_rooms(name)")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      
      setSpace(data);
    } catch (err) {
      console.error("Erro ao buscar dados da vaga:", err);
      setError("Não foi possível carregar os dados da vaga. Verifique se o QR code está correto.");
    } finally {
      setIsLoading(false);
    }
  };

  // Busca vagas disponíveis para realocação
  const fetchAvailableSpaces = async () => {
    try {
      const { data, error } = await supabase
        .from("storage_spaces")
        .select("*, storage_rooms(name)")
        .eq("status", "empty")
        .order("storage_rooms(name)", { ascending: true })
        .order("name", { ascending: true });
      
      if (error) throw error;
      
      setTargetSpaces(data || []);
    } catch (err) {
      console.error("Erro ao buscar vagas disponíveis:", err);
    }
  };

  // Calcula o holding time para um espaço
  const calculateHoldingTime = (space) => {
    if (space.status !== 'occupied' || !space.weighing_date) return null;
    
    const currentDate = new Date();
    const weighingDate = new Date(space.weighing_date);
    const daysSince = Math.floor((currentDate - weighingDate) / (1000 * 60 * 60 * 24));
    
    return {
      days: daysSince,
      isExpired: daysSince > 20,
    };
  };

  // Remove o palete da vaga atual
  const removePallet = async () => {
    if (!signature || signature.length !== 5) {
      displayToast("A assinatura deve conter 5 dígitos.", "error");
      return;
    }

    try {
      // Log da remoção
      const { error: logError } = await supabase
        .from("storage_logs")
        .insert([{
          space_id: space.id,
          room_id: space.room_id,
          action: "removed",
          op: space.current_op,
          recipe_code: space.recipe_code,
          material_name: space.material_name,
          user_id: signature,
          timestamp: new Date().toISOString(),
        }]);
      
      if (logError) throw logError;
      
      // Atualiza o status da vaga
      const { error: updateError } = await supabase
        .from("storage_spaces")
        .update({
          status: "empty",
          current_op: null,
          recipe_code: null,
          material_name: null,
          weighing_date: null,
          last_updated: new Date().toISOString(),
          updated_by: signature,
        })
        .eq("id", space.id);
      
      if (updateError) throw updateError;
      
      setRemoveDialogOpen(false);
      setSignature("");
      
      displayToast("Palete removido com sucesso.");
      
      // Recarrega os dados da vaga
      fetchSpaceData();
    } catch (error) {
      console.error("Erro ao remover palete:", error);
      displayToast("Não foi possível remover o palete.", "error");
    }
  };

  // Realoca o palete para outra vaga
  const reallocatePallet = async () => {
    if (!signature || signature.length !== 5) {
      displayToast("A assinatura deve conter 5 dígitos.", "error");
      return;
    }

    if (!selectedTargetSpace) {
      displayToast("Selecione uma vaga de destino.", "error");
      return;
    }

    try {
      // Log da realocação
      const { error: logError } = await supabase
        .from("storage_logs")
        .insert([{
          space_id: space.id,
          room_id: space.room_id,
          action: "reallocated",
          target_space_id: selectedTargetSpace.id,
          target_room_id: selectedTargetSpace.room_id,
          op: space.current_op,
          recipe_code: space.recipe_code,
          material_name: space.material_name,
          user_id: signature,
          timestamp: new Date().toISOString(),
        }]);
      
      if (logError) throw logError;
      
      // Remove da vaga atual
      const { error: updateSourceError } = await supabase
        .from("storage_spaces")
        .update({
          status: "empty",
          current_op: null,
          recipe_code: null,
          material_name: null,
          weighing_date: null,
          last_updated: new Date().toISOString(),
          updated_by: signature,
        })
        .eq("id", space.id);
      
      if (updateSourceError) throw updateSourceError;
      
      // Adiciona à nova vaga
      const { error: updateTargetError } = await supabase
        .from("storage_spaces")
        .update({
          status: "occupied",
          current_op: space.current_op,
          recipe_code: space.recipe_code,
          material_name: space.material_name,
          weighing_date: space.weighing_date,
          last_updated: new Date().toISOString(),
          updated_by: signature,
        })
        .eq("id", selectedTargetSpace.id);
      
      if (updateTargetError) throw updateTargetError;
      
      setReallocateDialogOpen(false);
      setSignature("");
      setSelectedTargetSpace(null);
      
      displayToast("Palete realocado com sucesso.");
      
      // Recarrega os dados da vaga
      fetchSpaceData();
      fetchAvailableSpaces(); // Atualiza as vagas disponíveis
    } catch (error) {
      console.error("Erro ao realocar palete:", error);
      displayToast("Não foi possível realocar o palete.", "error");
    }
  };

  // Renderiza o conteúdo baseado no status de carregamento
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-700 dark:text-gray-300">Carregando informações da vaga...</p>
        </div>
      </div>
    );
  }


  // Renderiza mensagem de erro
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center text-red-500 mb-4">
            <HiOutlineInformationCircle className="h-12 w-12" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">Erro</h1>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-6">{error}</p>
          <Link href="/gestao" className="w-full">
            <Button color="gray" className="w-full">
              <HiArrowLeft className="mr-2 h-5 w-5" /> Voltar para Gestão
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Calcula o holding time
  const holdingTime = space?.status === 'occupied' ? calculateHoldingTime(space) : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        {/* Botão de retorno para alocação mobile se veio da página de alocação */}
        {showReturnToAllocation && (
          <Button 
            color="blue" 
            className="w-full mb-4"
            onClick={() => router.push('/alocacao-mobile')}
          >
            <HiArrowLeft className="mr-2 h-5 w-5" />
            Voltar para Alocação
          </Button>
        )}
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {/* Cabeçalho */}
          <div className="bg-blue-600 dark:bg-blue-700 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <HiOutlineQrcode className="h-6 w-6 mr-2" />
                <h1 className="text-xl font-bold">Vaga: {space?.name}</h1>
              </div>
            </div>
            <p className="text-sm mt-1 opacity-80">Sala: {space?.storage_rooms?.name}</p>
            <p className="text-sm opacity-80">Posição: {space?.position}</p>
          </div>
          
          {/* Conteúdo */}
          <div className="p-4">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Status</h2>
                <span 
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold 
                    ${space?.status === 'empty' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    }`}
                >
                  {space?.status === 'empty' ? 'Vazia' : 'Ocupada'}
                </span>
              </div>
              
              {space?.status === 'occupied' ? (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Ordem de Produção (OP)</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{space.current_op}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Material</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{space.material_name}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Código da Receita</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{space.recipe_code}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Data da Pesagem</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {new Date(space.weighing_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  
                  {holdingTime && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Holding Time</p>
                      <p className={`text-sm font-medium ${
                        holdingTime.isExpired 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {holdingTime.days} dias
                        {holdingTime.isExpired && (
                          <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded">
                            Expirado
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Última Atualização</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {new Date(space.last_updated).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">Esta vaga está vazia</p>
                </div>
              )}
            </div>
            
            {/* Ações disponíveis apenas se a vaga estiver ocupada */}
            {space?.status === 'occupied' && (
              <div className="space-y-3">
                <Button 
                  color="failure" 
                  className="w-full text-black dark:text-white"
                  onClick={() => setRemoveDialogOpen(true)}
                >
                  Remover Palete
                </Button>
                
                <Button 
                  color="purple" 
                  className="w-full text-black dark:text-white"
                  onClick={() => setReallocateDialogOpen(true)}
                >
                  Realocar para Outra Vaga
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal de Remoção de Palete */}
      <Modal
        show={removeDialogOpen}
        onClose={() => setRemoveDialogOpen(false)}
        theme={{
          root: {
            show: {
              on: "flex bg-gray-900 bg-opacity-50 dark:bg-opacity-80"
            }
          }
        }}
      >
        <Modal.Header>Remover Palete</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Você está removendo o palete da vaga {space?.name}.
            </p>
            
            <div className="bg-amber-50 dark:bg-amber-900/30 p-3 rounded-md space-y-2">
              <p className="text-amber-800 dark:text-amber-200"><strong>OP:</strong> {space?.current_op}</p>
              <p className="text-amber-800 dark:text-amber-200"><strong>Material:</strong> {space?.material_name}</p>
              <p className="text-amber-800 dark:text-amber-200">
                <strong>Data da Pesagem:</strong> {space?.weighing_date && new Date(space.weighing_date).toLocaleDateString('pt-BR')}
              </p>
            </div>
            
            <div>
              <Label value="Confirme sua assinatura (ID de 5 dígitos)" />
              <TextInput
                placeholder="Ex: 12345"
                maxLength={5}
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            className="text-black dark:text-white" 
            color="failure" 
            onClick={removePallet}
          >
            Confirmar Remoção
          </Button>
          <Button 
            color="gray" 
            onClick={() => {
              setRemoveDialogOpen(false);
              setSignature("");
            }}
          >
            Cancelar
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Modal de Realocação de Palete */}
      <Modal
        show={reallocateDialogOpen}
        onClose={() => setReallocateDialogOpen(false)}
        theme={{
          root: {
            show: {
              on: "flex bg-gray-900 bg-opacity-50 dark:bg-opacity-80"
            }
          }
        }}
      >
        <Modal.Header>Realocar Palete</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Você está realocando o palete da vaga {space?.name} para outra vaga.
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-md space-y-2">
              <p className="text-blue-800 dark:text-blue-200"><strong>OP:</strong> {space?.current_op}</p>
              <p className="text-blue-800 dark:text-blue-200"><strong>Material:</strong> {space?.material_name}</p>
              <p className="text-blue-800 dark:text-blue-200">
                <strong>Data da Pesagem:</strong> {space?.weighing_date && new Date(space.weighing_date).toLocaleDateString('pt-BR')}
              </p>
            </div>
            
            <div>
              <Label value="Selecione a vaga de destino" />
              <select
                className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                value={selectedTargetSpace?.id || ""}
                onChange={(e) => {
                  const selected = targetSpaces.find(s => s.id === e.target.value);
                  setSelectedTargetSpace(selected || null);
                }}
              >
                <option value="">Selecione uma vaga...</option>
                {targetSpaces.map(targetSpace => (
                  <option key={targetSpace.id} value={targetSpace.id}>
                    {targetSpace.storage_rooms.name} - {targetSpace.name} ({targetSpace.position})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <Label value="Confirme sua assinatura (ID de 5 dígitos)" />
              <TextInput
                placeholder="Ex: 12345"
                maxLength={5}
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            color="blue" 
            onClick={reallocatePallet}
          >
            Confirmar Realocação
          </Button>
          <Button 
            color="gray" 
            onClick={() => {
              setReallocateDialogOpen(false);
              setSignature("");
              setSelectedTargetSpace(null);
            }}
          >
            Cancelar
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Toast notification */}
      {toast.visible && (
        <div className="fixed bottom-5 right-5 z-50">
          <Toast message={toast.message} type={toast.type} />
        </div>
      )}
    </div>
  );
}