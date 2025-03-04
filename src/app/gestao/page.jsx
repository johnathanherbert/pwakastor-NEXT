'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import KanbanBoard from '../../components/Kanban/KanbanBoard';
import Topbar from '../../components/Topbar';
import * as XLSX from 'xlsx';

export default function GestaoPage() {
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [searchOP, setSearchOP] = useState('');
    const [darkMode, setDarkMode] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);

    async function fetchData(op = '') {
        setLoading(true);
        try {
            if (op) {
                // Verifica se a OP já existe em qualquer coluna
                const opExists = cards.some(card => card.ordem === op);
                
                if (opExists) {
                    setUploadStatus('⚠️ Esta OP já está em alguma coluna do quadro');
                    setTimeout(() => setUploadStatus(''), 3000); // Limpa a mensagem após 3 segundos
                    return;
                }

                const { data: fetchedData, error } = await supabase
                    .from('wip_table')
                    .select('*')
                    .eq('ordem', op);
                
                if (error) throw error;
                
                if (fetchedData[0]) {
                    const newCard = {
                        ...fetchedData[0],
                        status: 'disponiveis'
                    };
                    setCards(prev => [...prev, newCard]);
                    setUploadStatus('✅ OP adicionada com sucesso!');
                    setTimeout(() => setUploadStatus(''), 3000);
                } else {
                    setUploadStatus('❌ OP não encontrada');
                    setTimeout(() => setUploadStatus(''), 3000);
                }
            } else {
                const { data: fetchedData, error } = await supabase
                    .from('wip_table')
                    .select('*')
                    .in('status', ['emAndamento', 'pesado']);

                if (error) throw error;
                setCards(fetchedData.map(card => ({
                    ...card,
                    status: card.status
                })));
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setUploadStatus(`❌ Erro: ${error.message}`);
            setTimeout(() => setUploadStatus(''), 3000);
        } finally {
            setLoading(false);
        }
    }

    const handleDragEnd = async (result) => {
        if (!result.destination) return;

        const { source, destination, draggableId } = result;

        if (source.droppableId === destination.droppableId) return;

        setCards(prev => {
            const updatedCards = prev.map(card => {
                if (String(card.id) === draggableId) {
                    return { ...card, status: destination.droppableId };
                }
                return card;
            });
            return updatedCards;
        });

        try {
            const { error } = await supabase
                .from('wip_table')
                .update({ status: destination.droppableId })
                .eq('id', draggableId);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating card status:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (searchOP) {
            await fetchData(searchOP);
        }
    };

    const handleFileUpload = async (event) => {
        try {
            setLoading(true);
            setUploadStatus('Iniciando upload...');
            
            const file = event.target.files[0];
            if (!file) {
                throw new Error('Nenhum arquivo selecionado');
            }

            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    setUploadStatus('Lendo arquivo...');
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const rawJson = XLSX.utils.sheet_to_json(worksheet);

                    // Transform the data to match the database schema
                    const transformedData = rawJson.map(row => {
                        console.log('Raw row data:', row);
                        return {
                            material: String(row['__EMPTY'] || row['1'] || ''),
                            ordem: String(row['COID'] || ''),
                            lote: String(row['__EMPTY_1'] || ''),
                            material_desc: row['__EMPTY_7'] || null,
                            tp: row['__EMPTY_2'] || null,
                            mrp: row['__EMPTY_3'] || null,
                            cp: row['__EMPTY_4'] || null,
                            cen: row['__EMPTY_5'] || null,
                            status_sistema: row['__EMPTY_6'] || null,
                            texto_breve_material: row['__EMPTY_7'] || null,
                            criado_por: row['__EMPTY_8'] || null,
                            qtd_teorica: row[' 323,962,889 '] ? Number(String(row[' 323,962,889 ']).replace(/[.,]/g, '')) : null,
                            qtd_fornecida: row['__EMPTY_9'] ? Number(row['__EMPTY_9']) : null,
                            um: row['__EMPTY_10'] || null,
                            nico_base: row['__EMPTY_11'] ? Number(row['__EMPTY_11']) : null,
                            fm_base: row['__EMPTY_12'] ? Number(row['__EMPTY_12']) : null,
                            created_on: convertExcelDate(row['__EMPTY_13']),
                            liberacao: convertExcelDate(row['__EMPTY_15']),
                            pesagem: convertExcelDate(row[' 373 ']),
                            lead_time: row['__EMPTY_16'] || null,
                            previsao_chegada: null, // Add proper mapping if available
                            peneira_status_classificacao: row['__EMPTY_18'] || null,
                            familia: row['__EMPTY_19'] || null,
                            revestimento: row['__EMPTY_20'] || null,
                            zqm: row['__EMPTY_21'] || null,
                            lt: row['__EMPTY_22'] || null,
                            pesado: row['__EMPTY_23'] || null,
                            tpo: row['__EMPTY_24'] || null,
                            status_deposito: row['__EMPTY_25'] || null,
                            vu: row['__EMPTY_26'] || null,
                            valorizacao_produtos: row[' R$ 43,012,697.87 '] || null,
                            key: row['__EMPTY_27'] || null,
                            posicao_atual: row['__EMPTY_28'] || null,
                            classificacao_criticos: row['__EMPTY_29'] || null,
                            dias_em_processo: row['__EMPTY_30'] ? String(row['__EMPTY_30']) : null,
                            status_vencimento: row['__EMPTY_31'] || null
                        };
                    });

                    // Helper function to convert Excel dates
                    function convertExcelDate(excelDate) {
                        if (!excelDate) return null;
                        try {
                            // Check if the date is a number (Excel format)
                            if (typeof excelDate === 'number') {
                                const date = new Date((excelDate - 25569) * 86400 * 1000);
                                return date.toISOString().split('T')[0];
                            }
                            // If it's a string, try to parse it
                            const date = new Date(excelDate);
                            if (isNaN(date.getTime())) return null;
                            return date.toISOString().split('T')[0];
                        } catch (error) {
                            console.error('Error converting date:', excelDate);
                            return null;
                        }
                    }

                    console.log('First transformed row:', transformedData[0]); // Add debug log to check transformed data

                    setUploadStatus('Limpando dados antigos...');
                    const { error: deleteError } = await supabase
                        .from('wip_table')
                        .delete()
                        .not('id', 'is', null); // Alterado para excluir apenas registros com ID válido

                    if (deleteError) {
                        console.error('Erro ao deletar:', deleteError);
                        throw deleteError;
                    }

                    setUploadStatus('Inserindo novos dados...');
                    const { error: insertError } = await supabase
                        .from('wip_table')
                        .insert(transformedData);

                    if (insertError) {
                        console.error('Erro ao inserir:', insertError);
                        throw insertError;
                    }

                    setUploadStatus('Dados inseridos com sucesso!');
                    await fetchData();
                } catch (error) {
                    console.error('Erro no processamento:', error);
                    setUploadStatus(`Erro: ${error.message || 'Erro desconhecido'}`);
                }
            };

            reader.onerror = (error) => {
                throw new Error('Erro na leitura do arquivo');
            };

            reader.readAsArrayBuffer(file);
        } catch (error) {
            console.error('Erro no upload:', error);
            setUploadStatus(`Erro: ${error.message || 'Erro desconhecido'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`flex flex-col min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
            <Topbar
                user={null} // You'll need to add user authentication
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                drawerOpen={drawerOpen}
                setDrawerOpen={setDrawerOpen}
                openDialog={openDialog}
                handleDataUpdated={() => fetchData()}
                title='Gestão de OPs'
                
            />

            <main className="flex-1 p-4 mt-16">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-6 space-y-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                            <form onSubmit={handleSearch} className="flex space-x-2">
                                <input
                                    type="text"
                                    value={searchOP}
                                    onChange={(e) => setSearchOP(e.target.value)}
                                    placeholder="Digite o número da OP"
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                                             focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 
                                             focus:outline-none focus:ring-2 focus:ring-blue-500 
                                             disabled:opacity-50 transition-colors duration-200"
                                >
                                    Buscar OP
                                </button>
                            </form>
                            {uploadStatus && (
                                <div className={`mt-2 p-2 rounded text-sm text-center
                                    ${uploadStatus.includes('⚠️') ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-200' : 
                                    uploadStatus.includes('❌') ? 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-200' : 
                                    'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-200'}
                                `}>
                                    {uploadStatus}
                                </div>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <KanbanBoard cards={cards} onDragEnd={handleDragEnd} darkMode={darkMode} />
                    )}
                </div>
            </main>
        </div>
    );
}