"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";
import { Button, Card, Spinner } from "flowbite-react";
import { HiClipboardCopy, HiOutlineQrcode, HiSearch } from "react-icons/hi";

export default function DebugPage() {
  const [rooms, setRooms] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ rooms: 0, spaces: 0 });
  const [baseUrl, setBaseUrl] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showQrOnly, setShowQrOnly] = useState(false);

  useEffect(() => {
    // Define the base URL depending on environment
    if (typeof window !== 'undefined') {
      // In browser environment, we can access window.location
      const url = new URL(window.location.href);
      const baseUrl = `${url.protocol}//${url.host}`;
      setBaseUrl(baseUrl);
    }

    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from("storage_rooms")
        .select("*")
        .order("name", { ascending: true });

      if (roomsError) throw roomsError;

      // Fetch spaces
      const { data: spacesData, error: spacesError } = await supabase
        .from("storage_spaces")
        .select("*, storage_rooms(name)")
        .order("room_id", { ascending: true })
        .order("name", { ascending: true });

      if (spacesError) throw spacesError;

      setRooms(roomsData || []);
      setSpaces(spacesData || []);
      setStats({
        rooms: roomsData?.length || 0,
        spaces: spacesData?.length || 0
      });
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateDirectLink = (space) => {
    return `${baseUrl}/vaga/${space.id}`;
  };

  const generateQrLink = (space) => {
    const roomName = space.storage_rooms?.name || "SalaDesconhecida";
    const position = space.name || space.position || "PosicaoDesconhecida";
    return `${baseUrl}/local/${encodeURIComponent(roomName)}/${encodeURIComponent(position)}`;
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  // Filtra os espaços com base no termo de busca
  const filteredSpaces = spaces.filter(space => {
    const roomName = space.storage_rooms?.name?.toLowerCase() || "";
    const spaceName = space.name?.toLowerCase() || "";
    const spacePosition = space.position?.toLowerCase() || "";
    
    const searchLower = searchTerm.toLowerCase();
    
    return roomName.includes(searchLower) || 
           spaceName.includes(searchLower) || 
           spacePosition.includes(searchLower);
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
        Debug - Mapeamento de QR Codes
      </h1>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Spinner size="xl" />
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="mb-4">
            <h2 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-300">Estatísticas</h2>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-blue-800 dark:text-blue-300 text-lg font-bold">{stats.rooms}</p>
                <p className="text-blue-600 dark:text-blue-400 text-sm">Salas Cadastradas</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <p className="text-green-800 dark:text-green-300 text-lg font-bold">{stats.spaces}</p>
                <p className="text-green-600 dark:text-green-400 text-sm">Vagas Cadastradas</p>
              </div>
            </div>
          </Card>

          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <HiSearch className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </div>
              <input 
                type="text" 
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" 
                placeholder="Buscar por sala, nome ou posição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center">
              <input
                id="show-qr-only"
                type="checkbox"
                checked={showQrOnly}
                onChange={() => setShowQrOnly(!showQrOnly)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="show-qr-only" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                Mostrar apenas links para QR Code
              </label>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Sala
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Vaga
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Posição
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    {!showQrOnly && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Link Direto
                    </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Link para QR Code
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {filteredSpaces.map((space, index) => (
                    <tr key={space.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {space.storage_rooms?.name || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {space.name || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {space.position || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          space.status === 'empty' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {space.status === 'empty' ? 'Vazia' : 'Ocupada'}
                        </span>
                      </td>
                      {!showQrOnly && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <input 
                            type="text" 
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-48 p-1.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                            value={generateDirectLink(space)}
                            readOnly
                          />
                          <Button 
                            size="xs" 
                            color="light" 
                            onClick={() => copyToClipboard(generateDirectLink(space), `direct-${index}`)}
                            className="ml-2"
                          >
                            {copiedIndex === `direct-${index}` ? 'Copiado!' : <HiClipboardCopy />}
                          </Button>
                        </div>
                      </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <input 
                            type="text" 
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-48 p-1.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                            value={generateQrLink(space)}
                            readOnly
                          />
                          <Button 
                            size="xs" 
                            color="light" 
                            onClick={() => copyToClipboard(generateQrLink(space), `qr-${index}`)}
                            className="ml-2"
                          >
                            {copiedIndex === `qr-${index}` ? 'Copiado!' : <HiClipboardCopy />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredSpaces.length === 0 && (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                {searchTerm ? "Nenhum resultado encontrado para sua busca." : "Nenhuma vaga cadastrada."}
              </div>
            )}
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30 rounded-lg">
            <h3 className="text-md font-semibold text-yellow-800 dark:text-yellow-300 mb-2 flex items-center">
              <HiOutlineQrcode className="w-5 h-5 mr-2" />
              Como usar com QR Codes
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-2">
              Use o "Link para QR Code" para gerar códigos QR que apontam para uma vaga específica usando sala/posição.
              Quando escaneado, o sistema redirecionará para a página de detalhes da vaga.
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              Formato do link: <code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 py-0.5 rounded">{baseUrl}/local/[nome-da-sala]/[posicao]</code>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}