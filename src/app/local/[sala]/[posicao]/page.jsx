"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/supabaseClient";

// Este componente serve como um redirecionador para o ID correto da vaga
// quando o usuário escaneia um QR code que contém sala e posição

export default function LocalVagaPage() {
  const params = useParams();
  const router = useRouter();
  const { sala, posicao } = params;
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    findSpaceByRoomAndPosition();
  }, [sala, posicao]);
  
  // Busca o ID da vaga com base na sala e posição
  const findSpaceByRoomAndPosition = async () => {
    try {
      setIsLoading(true);
      
      // Primeiro, encontrar o ID da sala pelo nome
      const { data: roomData, error: roomError } = await supabase
        .from("storage_rooms")
        .select("id")
        .ilike("name", `%${sala}%`)
        .limit(1);
      
      if (roomError) throw roomError;
      
      if (!roomData || roomData.length === 0) {
        throw new Error(`Sala "${sala}" não encontrada.`);
      }
      
      const roomId = roomData[0].id;
      
      // Agora buscar a vaga específica pela sala e posição
      const { data: spaceData, error: spaceError } = await supabase
        .from("storage_spaces")
        .select("id")
        .eq("room_id", roomId)
        .or(`name.ilike.%${posicao}%,position.ilike.%${posicao}%`);
      
      if (spaceError) throw spaceError;
      
      if (!spaceData || spaceData.length === 0) {
        throw new Error(`Vaga "${posicao}" não encontrada na sala "${sala}".`);
      }
      
      // Redirecionar para a página de detalhes da vaga
      router.push(`/vaga/${spaceData[0].id}`);
    } catch (err) {
      console.error("Erro ao buscar vaga:", err);
      setError(err.message);
      
      // Após um tempo, redirecionar para a lista de gestão
      setTimeout(() => {
        router.push("/gestao");
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Renderiza o estado de loading enquanto busca a vaga
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-700 dark:text-gray-300">
            Buscando vaga {posicao} na sala {sala}...
          </p>
        </div>
      </div>
    );
  }
  
  // Renderiza mensagem de erro
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <div className="flex items-center justify-center text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Vaga não encontrada</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Redirecionando para a página de gestão em alguns segundos...
          </p>
        </div>
      </div>
    );
  }
  
  return null; // Esta página apenas redireciona, não deve renderizar conteúdo próprio
}