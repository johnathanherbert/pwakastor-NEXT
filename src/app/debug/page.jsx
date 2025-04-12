// Aumenta tamanho do QR Code, adiciona ordenação, filtro por texto e por sala
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";
import { Button, Card, Spinner, Select } from "flowbite-react";
import { HiClipboardCopy, HiOutlineQrcode, HiSearch } from "react-icons/hi";
import { QRCodeCanvas } from "qrcode.react";

export default function DebugPage() {
  const [rooms, setRooms] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ rooms: 0, spaces: 0 });
  const [baseUrl, setBaseUrl] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("all");
  const [showQrOnly, setShowQrOnly] = useState(false);
  const [sortKey, setSortKey] = useState("room");
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const baseUrl = `${url.protocol}//${url.host}`;
      setBaseUrl(baseUrl);
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: roomsData } = await supabase.from("storage_rooms").select("*").order("name", { ascending: true });
      const { data: spacesData } = await supabase.from("storage_spaces").select("*, storage_rooms(name)").order("room_id", { ascending: true }).order("name", { ascending: true });
      setRooms(roomsData || []);
      setSpaces(spacesData || []);
      setStats({ rooms: roomsData?.length || 0, spaces: spacesData?.length || 0 });
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateDirectLink = (space) => `${baseUrl}/vaga/${space.id}`;
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

  const sortSpaces = (a, b) => {
    const valA = sortKey === 'room' ? a.storage_rooms?.name : sortKey === 'position' ? a.position : a.name;
    const valB = sortKey === 'room' ? b.storage_rooms?.name : sortKey === 'position' ? b.position : b.name;
    return sortAsc ? String(valA).localeCompare(valB) : String(valB).localeCompare(valA);
  };

  const filteredSpaces = spaces
    .filter(space => {
      const roomName = space.storage_rooms?.name?.toLowerCase() || "";
      const spaceName = space.name?.toLowerCase() || "";
      const spacePosition = space.position?.toLowerCase() || "";
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = roomName.includes(searchLower) || spaceName.includes(searchLower) || spacePosition.includes(searchLower);
      const matchesRoom = selectedRoom === "all" || space.storage_rooms?.name === selectedRoom;
      return matchesSearch && matchesRoom;
    })
    .sort(sortSpaces);

  const handleSort = (key) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const SortHeader = ({ label, keyVal }) => (
    <th onClick={() => handleSort(keyVal)} className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
      {label} {sortKey === keyVal && (sortAsc ? "↑" : "↓")}
    </th>
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Debug - Mapeamento de QR Codes</h1>
      {isLoading ? (
        <div className="flex justify-center items-center h-40"><Spinner size="xl" /></div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4 items-center">
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
            <Select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="w-full md:w-64 text-sm dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todas as Salas</option>
              {rooms.map(room => (
                <option key={room.id} value={room.name}>{room.name}</option>
              ))}
            </Select>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <SortHeader label="Sala" keyVal="room" />
                    <SortHeader label="Vaga" keyVal="name" />
                    <SortHeader label="Posição" keyVal="position" />
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    {!showQrOnly && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Link Direto</th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">QR Code</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {filteredSpaces.map((space, index) => (
                    <tr key={space.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{space.storage_rooms?.name || "—"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{space.name || "—"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{space.position || "—"}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          space.status === 'empty' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {space.status === 'empty' ? 'Vazia' : 'Ocupada'}
                        </span>
                      </td>
                      {!showQrOnly && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <input type="text" className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-48 p-1.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={generateDirectLink(space)} readOnly />
                            <Button size="xs" color="light" onClick={() => copyToClipboard(generateDirectLink(space), `direct-${index}`)} className="ml-2">{copiedIndex === `direct-${index}` ? 'Copiado!' : <HiClipboardCopy />}</Button>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex flex-col items-center space-y-1">
                          <QRCodeCanvas value={generateQrLink(space)} size={96} bgColor="#ffffff" fgColor="#000000" level="H" />
                          <div className="flex items-center">
                            <input type="text" className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-48 p-1.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={generateQrLink(space)} readOnly />
                            <Button size="xs" color="light" onClick={() => copyToClipboard(generateQrLink(space), `qr-${index}`)} className="ml-2">{copiedIndex === `qr-${index}` ? 'Copiado!' : <HiClipboardCopy />}</Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}