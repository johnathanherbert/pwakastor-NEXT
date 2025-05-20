"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Spinner, Modal, Label, TextInput, Select, Pagination } from 'flowbite-react';
import { HiOutlineTrash, HiOutlinePencil, HiOutlineDocumentAdd, HiOutlineSave, HiX, HiPlus, HiFilter, HiSearch, HiChevronDown, HiChevronRight, HiOutlineClipboardList } from 'react-icons/hi';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import './RecipeManager.css';

const RecipeManager = () => {
  // State for recipes data
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for sorting
  const [sortConfig, setSortConfig] = useState({ key: 'Codigo_Receita', direction: 'asc' });
  
  // Filter state
  const [filter, setFilter] = useState('');
  const [recipeCodeFilter, setRecipeCodeFilter] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    Id: '',
    Codigo_Receita: '',
    Ativo: '',
    codigo_materia_prima: '',
    Excipiente: '',
    qtd_materia_prima: '',
    un_materia_prima: '',
    grupo_de_materiais: ''
  });
  
  // Selected item for edit/delete
  const [selectedItem, setSelectedItem] = useState(null);

  // Recipe codes for filtering
  const [recipeCodeOptions, setRecipeCodeOptions] = useState([]);  // Track expanded recipes - by default, expand all recipes
  const [expandedRecipes, setExpandedRecipes] = useState({});
  
  // Modal para visualização completa da receita
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  
  // Toggle recipe expansion
  const toggleRecipeExpansion = (recipeCode) => {
    setExpandedRecipes(prev => ({
      ...prev,
      [recipeCode]: !prev[recipeCode]
    }));
  };
  
  // Auto-expand first few recipes when data loads
  useEffect(() => {
    if (recipes.length > 0) {
      const uniqueCodes = [...new Set(recipes.map(item => item.Codigo_Receita))].slice(0, 3);
      const initialExpanded = {};
      uniqueCodes.forEach(code => {
        if (code) initialExpanded[code] = true;
      });
      setExpandedRecipes(initialExpanded);
    }
  }, [recipes]);
  // Fetch recipes data
  const fetchRecipes = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching recipes data...');
      // Try using the public (anon) role explicitly to avoid role errors
      let query = supabase
        .from('DataBase_ems')
        .select('*');
      
      if (recipeCodeFilter) {
        query = query.eq('Codigo_Receita', recipeCodeFilter);
      }
      
      if (sortConfig.key) {
        query = query.order(sortConfig.key, { ascending: sortConfig.direction === 'asc' });
      }
      
      const { data, error } = await query;
      
      if (error) {
        // Check if error is related to role "admin"
        if (error.message && error.message.includes('role "admin" does not exist')) {
          console.error("Role 'admin' error detected. This error might be due to RLS policies in Supabase.");
          // Continue with empty data since we can't fetch
          setRecipes([]);
          setRecipeCodeOptions([]);
          setError("Erro de permissão no banco de dados. Entre em contato com o administrador.");
        } else {
          throw error;
        }
      } else {
        console.log('Recipes data fetched:', data?.length || 0, 'records');
        
        // Show empty state if no data
        if (!data || data.length === 0) {
          console.log('No recipes data found');
          toast.info('Nenhuma receita encontrada na base de dados');
        }
        
        setRecipes(data || []);
        
        // Extract unique recipe codes
        const uniqueCodes = [...new Set(data?.map(item => item.Codigo_Receita) || [])]
          .filter(Boolean)
          .sort((a, b) => a - b);
        setRecipeCodeOptions(uniqueCodes);
        console.log('Unique recipe codes found:', uniqueCodes.length);
        
        // Clear any previous errors if successful
        setError(null);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
      setError(error.message);
      toast.error('Erro ao carregar receitas');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchRecipes();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('db-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'DataBase_ems' }, 
        () => fetchRecipes()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [recipeCodeFilter, sortConfig]);

  // Handle sort
  const handleSort = (key, direction) => {
    setSortConfig({ key, direction });
  };

  // Group data by recipe code
  const groupedRecipes = useMemo(() => {
    // First filter the data based on search term if any
    const filteredData = filter 
      ? recipes.filter(item => 
          Object.values(item).some(
            val => val && val.toString().toLowerCase().includes(filter.toLowerCase())
          )
        )
      : recipes;
      
    // Then group the filtered data by recipe code
    const grouped = {};
    
    filteredData.forEach(item => {
      const recipeCode = item.Codigo_Receita;
      if (!recipeCode) return; // Skip items without recipe code
      
      if (!grouped[recipeCode]) {
        grouped[recipeCode] = {
          recipeCode,
          // Find the main active ingredient
          activeIngredient: filteredData.find(
            r => r.Codigo_Receita === recipeCode && r.grupo_de_materiais?.toLowerCase() === 'ativo'
          )?.Ativo || 'Sem ativo definido',
          items: []
        };
      }
      
      grouped[recipeCode].items.push(item);
    });
    
    // Convert to array and sort by recipe code
    return Object.values(grouped).sort((a, b) => {
      if (sortConfig.direction === 'asc') {
        return a.recipeCode - b.recipeCode;
      } else {
        return b.recipeCode - a.recipeCode;
      }
    });
  }, [recipes, filter, sortConfig]);

  // Pagination for grouped recipes
  const paginatedRecipes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return groupedRecipes.slice(startIndex, startIndex + itemsPerPage);
  }, [groupedRecipes, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(groupedRecipes.length / itemsPerPage);

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // CRUD Operations
  const handleAdd = async () => {
    try {
      const { error } = await supabase
        .from('DataBase_ems')
        .insert([{
          ...formData,
          Id: crypto.randomUUID()
        }]);
      
      if (error) {
        // Check if error is related to role "admin"
        if (error.message && error.message.includes('role "admin" does not exist')) {
          console.error("Role 'admin' error detected. Check RLS policies in Supabase.");
          toast.error('Erro de permissão no banco de dados. Entre em contato com o administrador.');
        } else {
          throw error;
        }
      } else {
        setIsAddModalOpen(false);
        toast.success('Item adicionado com sucesso');
        setFormData({
          Id: '',
          Codigo_Receita: '',
          Ativo: '',
          codigo_materia_prima: '',
          Excipiente: '',
          qtd_materia_prima: '',
          un_materia_prima: '',
          grupo_de_materiais: ''
        });
        // Refresh data
        fetchRecipes();
      }
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Erro ao adicionar item');
    }
  };

  const handleEdit = async () => {
    try {
      const { error } = await supabase
        .from('DataBase_ems')
        .update(formData)
        .eq('Id', formData.Id);
      
      if (error) {
        // Check if error is related to role "admin"
        if (error.message && error.message.includes('role "admin" does not exist')) {
          console.error("Role 'admin' error detected. Check RLS policies in Supabase.");
          toast.error('Erro de permissão no banco de dados. Entre em contato com o administrador.');
        } else {
          throw error;
        }
      } else {
        setIsEditModalOpen(false);
        toast.success('Item atualizado com sucesso');
        // Refresh data
        fetchRecipes();
      }
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Erro ao atualizar item');
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('DataBase_ems')
        .delete()
        .eq('Id', selectedItem.Id);
      
      if (error) throw error;
      
      setIsDeleteModalOpen(false);
      toast.success('Item excluído com sucesso');
      fetchRecipes();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Erro ao excluir item');
    }
  };

  // Open edit modal for an ingredient
  const openEditModal = (item) => {
    setSelectedItem(item);
    setFormData({
      Id: item.Id,
      Codigo_Receita: item.Codigo_Receita || '',
      Ativo: item.Ativo || '',
      codigo_materia_prima: item.codigo_materia_prima || '',
      Excipiente: item.Excipiente || '',
      qtd_materia_prima: item.qtd_materia_prima || '',
      un_materia_prima: item.un_materia_prima || '',
      grupo_de_materiais: item.grupo_de_materiais || ''
    });
    setIsEditModalOpen(true);
  };

  // Open delete modal
  const openDeleteModal = (item) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };
  
  // Add new ingredient to recipe
  const addIngredientToRecipe = (recipeCode) => {
    setFormData({
      Id: '',
      Codigo_Receita: recipeCode,
      Ativo: '',
      codigo_materia_prima: '',
      Excipiente: '',
      qtd_materia_prima: '',
      un_materia_prima: '',
      grupo_de_materiais: ''
    });
    setIsAddModalOpen(true);
  };
  return (
    <div className="space-y-6 p-4">
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl shadow-md mb-6 transition-all duration-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
              Gerenciamento de Receitas
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Visualize e gerencie as receitas farmacêuticas
            </p>
          </div>
          <Button 
            color="green" 
            onClick={() => {
              setFormData({
                Id: '',
                Codigo_Receita: '',
                Ativo: '',
                codigo_materia_prima: '',
                Excipiente: '',
                qtd_materia_prima: '',
                un_materia_prima: '',
                grupo_de_materiais: ''
              });
              setIsAddModalOpen(true);
            }}
            className="shadow-sm hover:shadow-md transition-all duration-200"
          >
            <HiOutlineDocumentAdd className="mr-2" />
            Novo Ingrediente
          </Button>
        </div>
      </div>      {/* Filtros e busca */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
          <HiFilter className="mr-2" />
          Filtros e Pesquisa
        </h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[220px]">
            <Label htmlFor="filter" value="Busca geral" className="text-sm mb-1.5" />
            <TextInput
              id="filter"
              placeholder="Digite para buscar..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              icon={HiSearch}
              className="focus:ring-purple-500 focus:border-purple-500"
              theme={{
                field: {
                  input: {
                    base: "block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-purple-500 dark:focus:border-purple-500 focus:ring-purple-500 dark:focus:ring-purple-500"
                  }
                }
              }}
            />
          </div>

          <div className="w-48">
            <Label htmlFor="recipeCodeFilter" value="Filtrar por Código" className="text-sm mb-1.5" />
            <Select
              id="recipeCodeFilter"
              value={recipeCodeFilter}
              onChange={(e) => setRecipeCodeFilter(e.target.value)}
              className="focus:ring-purple-500 focus:border-purple-500"
              theme={{
                field: {
                  select: {
                    base: "block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-purple-500 dark:focus:border-purple-500 focus:ring-purple-500 dark:focus:ring-purple-500"
                  }
                }
              }}
            >
              <option value="">Todos</option>
              {recipeCodeOptions.map(code => (
                <option key={code} value={code}>{code}</option>
              ))}
            </Select>
          </div>

          <Button 
            color="light" 
            onClick={() => { setFilter(''); setRecipeCodeFilter(''); }}
            className="flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <HiX className="mr-2" />
            Limpar Filtros
          </Button>
        </div>
      </div>

      {/* Tabela de Receitas */}      {error ? (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800 shadow-md">
          <div className="flex items-center mb-3">
            <div className="bg-red-100 dark:bg-red-800/60 rounded-full p-2 mr-3">
              <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xl font-bold">Erro ao carregar os dados</p>
          </div>
          <p className="ml-11 text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <Spinner size="xl" className="mb-4" />
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Carregando receitas...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Aguarde um momento enquanto buscamos os dados.</p>
        </div>
      ) : (<>          <div className="relative overflow-x-auto shadow-lg sm:rounded-lg border border-gray-200 dark:border-gray-700">
            <Table striped hoverable theme={{
              root: {
                base: "w-full text-left text-gray-500 dark:text-gray-400 animate-fadeIn",
                shadow: "absolute bg-white dark:bg-gray-800 rounded-lg overflow-hidden",
                wrapper: "relative"
              },
              head: {
                base: "group/head text-xs uppercase bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 text-gray-700 dark:text-gray-300",
                cell: {
                  base: "px-6 py-4 text-gray-700 dark:text-white font-medium"
                }
              },
              body: {
                base: "divide-y divide-gray-200 dark:divide-gray-700",
                cell: {
                  base: "px-6 py-4 whitespace-nowrap font-medium"
                }
              },
              row: {
                base: "bg-white border-b dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200",
                hovered: "hover:bg-purple-50 dark:hover:bg-gray-700",
                striped: "odd:bg-white even:bg-gray-50/30 odd:dark:bg-gray-800 even:dark:bg-gray-700/40"
              }
            }}>              <Table.Head>
                <th className="excel-header px-6 py-4 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Código Receita</th>
                <th className="excel-header px-6 py-4 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Ativo Principal</th>
                <th className="excel-header px-6 py-4 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Qtd. Ingredientes</th>
              </Table.Head>
              <Table.Body>
                {paginatedRecipes.length > 0 ? (
                  paginatedRecipes.map(recipe => (
                    <React.Fragment key={recipe.recipeCode}>                      {/* Recipe header row */}
                      <Table.Row 
                        className="cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                        onClick={() => {
                          setSelectedRecipe(recipe);
                          setIsRecipeModalOpen(true);
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1.5 rounded-md text-gray-900 dark:text-white font-semibold" title="Código da Receita">
                              {recipe.recipeCode}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                          {recipe.activeIngredient}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs font-medium px-2.5 py-1.5 rounded-full">
                            {recipe.items.length} ingredientes
                          </span>
                        </td>
                      </Table.Row>                      {/* Ingredientes são mostrados apenas no modal detalhado */}
                    </React.Fragment>
                  ))                ) : (                  <Table.Row>
                    <Table.Cell colSpan={4} className="text-center py-10">                      <div className="flex flex-col items-center justify-center space-y-5 px-4 py-8 animate-fadeIn">
                        <div className="w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-700 dark:to-gray-800 shadow-inner mb-2">
                          <svg className="h-10 w-10 text-purple-500 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                          Nenhuma receita encontrada
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 max-w-lg text-center">
                          {filter || recipeCodeFilter ? 
                            'Não encontramos receitas que correspondam aos filtros atuais. Tente remover os filtros ou buscar por outro termo.' : 
                            'Ainda não há receitas cadastradas no sistema. Você pode criar uma nova receita adicionando seu primeiro ingrediente.'}
                        </p>
                        <Button 
                          size="md"
                          color="green"
                          className="mt-4 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 transform"
                          onClick={() => {
                            setFormData({
                              Id: '',
                              Codigo_Receita: '',
                              Ativo: '',
                              codigo_materia_prima: '',
                              Excipiente: '',
                              qtd_materia_prima: '',
                              un_materia_prima: '',
                              grupo_de_materiais: ''
                            });
                            setIsAddModalOpen(true);
                          }}
                        >
                          <HiOutlineDocumentAdd className="mr-2 text-xl" />
                          Adicionar Nova Receita
                        </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table>
          </div>          <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Mostrando {paginatedRecipes.length} de {groupedRecipes.length} receitas
              </p>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              showIcons
              theme={{
                pages: {
                  base: "xs:mt-0 mt-2 inline-flex items-center -space-x-px",
                  showIcon: {
                    base: "ml-0 block rounded-l-lg border border-gray-300 dark:border-gray-600 bg-white py-2 px-3 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                  },
                  previous: {
                    base: "ml-0 block rounded-l-lg border border-gray-300 dark:border-gray-600 bg-white py-2 px-3 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                  },
                  next: {
                    base: "block rounded-r-lg border border-gray-300 dark:border-gray-600 bg-white py-2 px-3 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                  },
                  selector: {
                    base: "w-12 border border-gray-300 dark:border-gray-600 bg-white py-2 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white",
                    active: "bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 dark:bg-gray-700 dark:text-white"
                  }
                }
              }}
            />
          </div>
        </>
      )}

      {/* Modais */}
      <AddModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        formData={formData}
        onChange={handleInputChange}
        onSubmit={handleAdd}
      />

      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        formData={formData}
        onChange={handleInputChange}
        onSubmit={handleEdit}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        item={selectedItem}
        onConfirm={handleDelete}
      />

      <RecipeModal
        isOpen={isRecipeModalOpen}
        onClose={() => setIsRecipeModalOpen(false)}
        recipe={selectedRecipe}
      />
    </div>
  );
};

// Componentes de Modal separados
const AddModal = ({ isOpen, onClose, formData, onChange, onSubmit }) => (
  <Modal 
    show={isOpen} 
    onClose={onClose}
    theme={{
      content: {
        base: "relative h-full w-full p-4 md:h-auto",
        inner: "relative rounded-lg bg-white shadow dark:bg-gray-800 flex flex-col max-h-[90vh]"
      },
      header: {
        base: "flex items-start justify-between rounded-t border-b p-4 border-gray-200 dark:border-gray-700",
        title: "text-xl font-medium text-gray-900 dark:text-white"
      },
      body: {
        base: "p-6 flex-1 overflow-auto"
      },
      footer: {
        base: "flex items-center space-x-2 rounded-b border-t border-gray-200 dark:border-gray-700 p-4"
      }
    }}
  >
    <Modal.Header>Adicionar Ingrediente</Modal.Header>
    <Modal.Body>
      <FormContent formData={formData} onChange={onChange} />
    </Modal.Body>
    <Modal.Footer>
      <Button 
        color="green" 
        onClick={onSubmit}
        theme={{
          inner: {
            base: "flex items-center"
          }
        }}
      >
        <HiOutlineSave className="mr-2" />
        Salvar
      </Button>
      <Button color="gray" onClick={onClose}>
        Cancelar
      </Button>
    </Modal.Footer>
  </Modal>
);

const EditModal = ({ isOpen, onClose, formData, onChange, onSubmit }) => (
  <Modal 
    show={isOpen} 
    onClose={onClose}
    theme={{
      content: {
        base: "relative h-full w-full p-4 md:h-auto",
        inner: "relative rounded-lg bg-white shadow dark:bg-gray-800 flex flex-col max-h-[90vh]"
      },
      header: {
        base: "flex items-start justify-between rounded-t border-b p-4 border-gray-200 dark:border-gray-700",
        title: "text-xl font-medium text-gray-900 dark:text-white"
      },
      body: {
        base: "p-6 flex-1 overflow-auto"
      },
      footer: {
        base: "flex items-center space-x-2 rounded-b border-t border-gray-200 dark:border-gray-700 p-4"
      }
    }}
  >
    <Modal.Header>Editar Ingrediente</Modal.Header>
    <Modal.Body>
      <FormContent formData={formData} onChange={onChange} />
    </Modal.Body>
    <Modal.Footer>
      <Button 
        color="blue" 
        onClick={onSubmit}
        theme={{
          inner: {
            base: "flex items-center"
          }
        }}
      >
        <HiOutlineSave className="mr-2" />
        Atualizar
      </Button>
      <Button color="gray" onClick={onClose}>
        Cancelar
      </Button>
    </Modal.Footer>
  </Modal>
);

const DeleteModal = ({ isOpen, onClose, item, onConfirm }) => (
  <Modal 
    show={isOpen} 
    onClose={onClose} 
    size="sm"
    theme={{
      content: {
        base: "relative h-full w-full p-4 md:h-auto",
        inner: "relative rounded-lg bg-white shadow dark:bg-gray-800 flex flex-col max-h-[90vh]"
      },
      header: {
        base: "flex items-start justify-between rounded-t border-b p-4 border-gray-200 dark:border-gray-700",
        title: "text-xl font-medium text-gray-900 dark:text-white"
      },
      body: {
        base: "p-6 flex-1 overflow-auto"
      },
      footer: {
        base: "flex items-center space-x-2 rounded-b border-t border-gray-200 dark:border-gray-700 p-4 justify-center"
      }
    }}
  >
    <Modal.Header>Confirmar Exclusão</Modal.Header>
    <Modal.Body>
      <div className="text-center">
        <p className="mb-4 text-gray-900 dark:text-gray-100">Tem certeza que deseja excluir este item?</p>
        {item && (
          <div className="text-gray-600 dark:text-gray-400">
            {item.grupo_de_materiais?.toLowerCase() === 'ativo' ? (
              <p>Ativo: <strong className="text-gray-800 dark:text-gray-200">{item.Ativo}</strong></p>
            ) : (
              <p>Excipiente: <strong className="text-gray-800 dark:text-gray-200">{item.Excipiente}</strong></p>
            )}
            <p>Código da Receita: <strong className="text-gray-800 dark:text-gray-200">{item.Codigo_Receita}</strong></p>
          </div>
        )}
      </div>
    </Modal.Body>
    <Modal.Footer className="justify-center">
      <Button 
        color="red" 
        onClick={onConfirm} 
        className="mr-2"
        theme={{
          inner: {
            base: "flex items-center"
          }
        }}
      >
        <HiOutlineTrash className="mr-2" />
        Excluir
      </Button>
      <Button color="gray" onClick={onClose}>
        Cancelar
      </Button>
    </Modal.Footer>
  </Modal>
);

// Componente de Modal para visualização completa da receita
const RecipeModal = ({ isOpen, onClose, recipe }) => {
  const [editingItem, setEditingItem] = useState(null);
  const [itemToUpdate, setItemToUpdate] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Agrupa os itens da receita por categoria
  const groupedByCategory = useMemo(() => {
    if (!recipe) return {};
    
    return recipe.items.reduce((acc, item) => {
      const category = item.grupo_de_materiais || 'Sem categoria';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});
  }, [recipe]);
  
  // Ordena as categorias para manter uma ordem consistente
  // Ativos primeiro, depois corantes, depois excipientes
  const orderedCategories = useMemo(() => {
    if (!recipe) return [];
    
    const categoryOrder = {
      'ATIVO': 1,
      'CORANTE': 2,
      'EXCIPIENTE': 3
    };
    
    return Object.keys(groupedByCategory).sort((a, b) => {
      const orderA = categoryOrder[a.toUpperCase()] || 999;
      const orderB = categoryOrder[b.toUpperCase()] || 999;
      return orderA - orderB;
    });
  }, [groupedByCategory]);

  // Estado para o item que está sendo editado
  const [editValues, setEditValues] = useState({});

  // Função para iniciar a edição de um item
  const startEditing = (item) => {
    setEditingItem(item.Id);
    setEditValues({
      codigo_materia_prima: item.codigo_materia_prima,
      nome: item.grupo_de_materiais?.toLowerCase() === 'ativo' ? item.Ativo : item.Excipiente,
      qtd_materia_prima: item.qtd_materia_prima,
      un_materia_prima: item.un_materia_prima
    });
  };

  // Função para salvar a edição de um item
  const confirmEdit = (item) => {
    setItemToUpdate({
      ...item,
      codigo_materia_prima: editValues.codigo_materia_prima,
      [item.grupo_de_materiais?.toLowerCase() === 'ativo' ? 'Ativo' : 'Excipiente']: editValues.nome,
      qtd_materia_prima: editValues.qtd_materia_prima,
      un_materia_prima: editValues.un_materia_prima
    });
    setShowConfirmation(true);
  };

  // Função para cancelar a edição
  const cancelEdit = () => {
    setEditingItem(null);
    setEditValues({});
  };

  // Função para atualizar o ingrediente no banco de dados
  const updateIngredient = async () => {
    try {
      const { error } = await supabase
        .from('DataBase_ems')
        .update({
          codigo_materia_prima: itemToUpdate.codigo_materia_prima,
          [itemToUpdate.grupo_de_materiais?.toLowerCase() === 'ativo' ? 'Ativo' : 'Excipiente']: itemToUpdate.grupo_de_materiais?.toLowerCase() === 'ativo' ? itemToUpdate.Ativo : itemToUpdate.Excipiente,
          qtd_materia_prima: itemToUpdate.qtd_materia_prima,
          un_materia_prima: itemToUpdate.un_materia_prima
        })
        .eq('Id', itemToUpdate.Id);
      
      if (error) throw error;
      
      setShowConfirmation(false);
      setEditingItem(null);
      setItemToUpdate(null);
      toast.success('Ingrediente atualizado com sucesso');
      // Isto causará um re-fetch dos dados através do ouvinte de mudanças do Supabase
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      toast.error('Erro ao atualizar ingrediente');
    }
  };

  // Função para excluir um ingrediente
  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('DataBase_ems')
        .delete()
        .eq('Id', selectedItem.Id);
      
      if (error) throw error;
      
      setIsDeleteModalOpen(false);
      toast.success('Ingrediente excluído com sucesso');
      // Auto-fechará o modal se o último ingrediente for excluído
      if (recipe.items.length <= 1) {
        onClose();
      }
    } catch (error) {
      console.error('Erro ao excluir ingrediente:', error);
      toast.error('Erro ao excluir ingrediente');
    }
  };

  // Manipular mudança nos campos de edição
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <>
      <Modal 
        show={isOpen} 
        onClose={onClose} 
        size="7xl"
        theme={{
          content: {
            base: "relative h-full w-full p-4 md:h-auto",
            inner: "relative rounded-xl bg-white shadow-lg dark:bg-gray-800 flex flex-col max-h-[90vh] animate-fadeIn"
          },
          header: {
            base: "flex items-start justify-between rounded-t-xl border-b p-5 border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800/60 dark:to-gray-700/60",
            title: "text-xl font-medium text-gray-900 dark:text-white"
          },
          body: {
            base: "p-4 flex-1 overflow-auto custom-scrollbar"
          },
          footer: {
            base: "flex items-center space-x-2 rounded-b-xl border-t border-gray-200 dark:border-gray-700 p-4 justify-end bg-gray-50 dark:bg-gray-800/80"
          }
        }}
      >
        <Modal.Header>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center">
                <HiOutlineClipboardList className="text-indigo-600 dark:text-indigo-400 mr-2 text-xl" />
                <span className="font-bold text-xl text-gray-800 dark:text-white">Receita {recipe?.recipeCode}</span>
              </div>
              <span className="mx-2 text-gray-400 dark:text-gray-500 hidden sm:block">•</span>
              {recipe?.activeIngredient && (
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {recipe.activeIngredient}
                </span>
              )}
            </div>
            <span className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 text-xs font-medium px-2.5 py-1.5 rounded-full self-start sm:self-auto sm:ml-auto badge-effect">
              {recipe?.items.length} componentes
            </span>
          </div>
        </Modal.Header>
        <Modal.Body className="animate-slideDown">
          {recipe ? (
            <div className="space-y-4">
              {/* Estilo Excel para visualização e edição da receita */}
              <div className="excel-style-table rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-md">                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="excel-header px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/90 sticky top-0 w-24">Tipo</th>
                      <th className="excel-header px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/90 sticky top-0 w-24">Código</th>
                      <th className="excel-header px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/90 sticky top-0 min-w-[240px]">Nome</th>
                      <th className="excel-header px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/90 sticky top-0 w-28">Quantidade</th>
                      <th className="excel-header px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/90 sticky top-0 w-24">Unidade</th>
                      <th className="excel-header px-3 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/90 sticky top-0 w-28">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {orderedCategories.map(category => (
                      <React.Fragment key={category}>
                        {/* Título da categoria */}
                        <tr className={`
                          ${category.toLowerCase() === 'ativo' 
                            ? 'bg-green-50/80 dark:bg-green-900/20' 
                            : category.toLowerCase() === 'corante'
                              ? 'bg-purple-50/80 dark:bg-purple-900/20'
                              : 'bg-blue-50/80 dark:bg-blue-900/20'
                          } category-row`}>
                          <td 
                            colSpan="6" 
                            className="px-3 py-2 text-sm font-semibold"
                          >
                            <div className="flex items-center">
                              <span className={`w-3 h-3 rounded-full mr-2 ${
                                category.toLowerCase() === 'ativo' 
                                  ? 'bg-green-500 dark:bg-green-400'
                                  : category.toLowerCase() === 'corante'
                                    ? 'bg-purple-500 dark:bg-purple-400'
                                    : 'bg-blue-500 dark:bg-blue-400'
                              }`}></span>
                              <span className={
                                category.toLowerCase() === 'ativo' 
                                  ? 'text-green-800 dark:text-green-300'
                                  : category.toLowerCase() === 'corante'
                                    ? 'text-purple-800 dark:text-purple-300'
                                    : 'text-blue-800 dark:text-blue-300'
                              }>
                                {category.toUpperCase()} ({groupedByCategory[category].length})
                              </span>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Itens da categoria */}
                        {groupedByCategory[category].map(item => (
                          <tr 
                            key={item.Id} 
                            className={`excel-row border-t dark:border-gray-700 transition-colors duration-150 ${
                              editingItem === item.Id ? 'editing-row bg-yellow-50/80 dark:bg-yellow-900/20' : ''
                            }`}
                          >
                            {/* Tipo - Não editável */}
                            <td className={`excel-cell px-3 py-2 text-sm border-r border-gray-200 dark:border-gray-600 ${
                              category.toLowerCase() === 'ativo' 
                                ? 'text-green-800 dark:text-green-300 bg-green-50/40 dark:bg-green-900/10'
                                : category.toLowerCase() === 'corante'
                                  ? 'text-purple-800 dark:text-purple-300 bg-purple-50/40 dark:bg-purple-900/10'
                                  : 'text-blue-800 dark:text-blue-300 bg-blue-50/40 dark:bg-blue-900/10'
                            }`}>
                              <div className="font-medium">{item.grupo_de_materiais}</div>
                            </td>
                            
                            {/* Código */}
                            <td className="excel-cell px-3 py-2 text-sm border-r border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
                              {editingItem === item.Id ? (
                                <TextInput
                                  name="codigo_materia_prima"
                                  value={editValues.codigo_materia_prima}
                                  onChange={handleEditChange}
                                  className="excel-input"
                                  sizing="sm"
                                />
                              ) : (
                                <span className="text-gray-900 dark:text-white">{item.codigo_materia_prima}</span>
                              )}
                            </td>
                            
                            {/* Nome */}
                            <td className="excel-cell px-3 py-2 text-sm border-r border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
                              {editingItem === item.Id ? (
                                <TextInput
                                  name="nome"
                                  value={editValues.nome}
                                  onChange={handleEditChange}
                                  className="excel-input"
                                  sizing="sm"
                                />
                              ) : (
                                <span className="text-gray-900 dark:text-white font-medium">
                                  {category.toLowerCase() === 'ativo' ? item.Ativo : item.Excipiente}
                                </span>
                              )}
                            </td>
                            
                            {/* Quantidade */}
                            <td className="excel-cell px-3 py-2 text-sm border-r border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
                              {editingItem === item.Id ? (
                                <TextInput
                                  name="qtd_materia_prima"
                                  value={editValues.qtd_materia_prima}
                                  onChange={handleEditChange}
                                  className="excel-input"
                                  sizing="sm"
                                />
                              ) : (
                                <span className="text-gray-900 dark:text-white">{item.qtd_materia_prima}</span>
                              )}
                            </td>
                            
                            {/* Unidade */}
                            <td className="excel-cell px-3 py-2 text-sm border-r border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
                              {editingItem === item.Id ? (
                                <TextInput
                                  name="un_materia_prima"
                                  value={editValues.un_materia_prima}
                                  onChange={handleEditChange}
                                  className="excel-input"
                                  sizing="sm"
                                />
                              ) : (
                                <span className="text-gray-900 dark:text-white">{item.un_materia_prima}</span>
                              )}
                            </td>
                            
                            {/* Ações */}
                            <td className="excel-cell px-3 py-2 text-sm bg-white dark:bg-gray-800 text-center">
                              {editingItem === item.Id ? (
                                <div className="flex space-x-1 justify-center">
                                  <Button 
                                    size="xs" 
                                    color="success" 
                                    onClick={() => confirmEdit(item)}
                                    className="excel-button"
                                  >
                                    <HiOutlineSave className="mr-1" />
                                    Salvar
                                  </Button>
                                  <Button 
                                    size="xs" 
                                    color="light" 
                                    onClick={cancelEdit}
                                    className="excel-button dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                  >
                                    <HiX className="mr-1" />
                                    Cancelar
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex space-x-1 justify-center">
                                  <Button 
                                    size="xs" 
                                    color="light"
                                    onClick={() => startEditing(item)}
                                    className="excel-action-button p-1 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:text-gray-200"
                                  >
                                    <HiOutlinePencil />
                                  </Button>
                                  <Button 
                                    size="xs" 
                                    color="light"
                                    onClick={() => {
                                      setSelectedItem(item);
                                      setIsDeleteModalOpen(true);
                                    }}
                                    className="excel-action-button p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 dark:bg-gray-700"
                                  >
                                    <HiOutlineTrash />
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40">
              <Spinner size="xl" />
            </div>
          )}
        </Modal.Body>        <Modal.Footer>
          <div className="flex justify-between items-center w-full">
            <div className="flex space-x-2">
              <Button
                color="teal"
                onClick={() => {
                  addIngredientToRecipe(recipe.recipeCode);
                }}
                className="flex items-center btn-hover-effect shadow-sm dark:bg-teal-600 dark:text-white dark:hover:bg-teal-700"
              >
                <HiPlus className="mr-1" />
                Adicionar Ingrediente
              </Button>

              <Button
                color="purple" 
                onClick={() => {
                  // Setup form data for excipient specifically
                  setFormData({
                    Id: '',
                    Codigo_Receita: recipe.recipeCode,
                    Ativo: '',
                    codigo_materia_prima: '',
                    Excipiente: '',
                    qtd_materia_prima: '',
                    un_materia_prima: '',
                    grupo_de_materiais: 'EXCIPIENTE'  // Pre-selects this as an excipient
                  });
                  setIsAddModalOpen(true);
                }}
                className="flex items-center btn-hover-effect shadow-sm dark:bg-purple-600 dark:text-white dark:hover:bg-purple-700"
              >
                <HiPlus className="mr-1" />
                Adicionar Excipiente
              </Button>
              
              <Button
                color="light"
                onClick={() => {
                  // Função para exportar a visualização atual para Excel
                  try {
                    // Preparando os dados para exportação
                    const dataToExport = [];
                    
                    // Cabeçalhos
                    orderedCategories.forEach(category => {
                      // Adiciona uma linha para o título da categoria
                      dataToExport.push({
                        Tipo: category.toUpperCase(),
                        Codigo: '',
                        Nome: `Total: ${groupedByCategory[category].length}`,
                        Quantidade: '',
                        Unidade: ''
                      });
                      
                      // Adicionar os ingredientes dessa categoria
                      groupedByCategory[category].forEach(item => {
                        dataToExport.push({
                          Tipo: item.grupo_de_materiais,
                          Codigo: item.codigo_materia_prima,
                          Nome: item.grupo_de_materiais?.toLowerCase() === 'ativo' ? item.Ativo : item.Excipiente,
                          Quantidade: item.qtd_materia_prima,
                          Unidade: item.un_materia_prima
                        });
                      });
                    });
                    
                    // Converter para CSV
                    let csvContent = "data:text/csv;charset=utf-8,";
                    
                    // Adicionar cabeçalho
                    csvContent += "Tipo,Código,Nome,Quantidade,Unidade\n";
                    
                    // Adicionar dados
                    dataToExport.forEach(row => {
                      csvContent += `${row.Tipo},${row.Codigo},"${row.Nome}",${row.Quantidade},${row.Unidade}\n`;
                    });
                    
                    // Criar um elemento para download
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `Receita_${recipe.recipeCode}_${recipe.activeIngredient.replace(/\s+/g, '_')}.csv`);
                    document.body.appendChild(link);
                    
                    // Disparar o download
                    link.click();
                    document.body.removeChild(link);
                    
                    toast.success('Receita exportada com sucesso');
                  } catch (error) {
                    console.error('Erro ao exportar receita:', error);
                    toast.error('Erro ao exportar receita');
                  }
                }}
                className="flex items-center btn-hover-effect shadow-sm dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                Exportar CSV
              </Button>
            </div>
            <Button 
              color="gray" 
              onClick={onClose}
              className="btn-hover-effect shadow-sm px-5 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            >
              Fechar
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Modal de confirmação de edição */}
      <Modal 
        show={showConfirmation} 
        onClose={() => setShowConfirmation(false)}
        size="md"
        theme={{
          content: {
            inner: "relative rounded-lg bg-white shadow dark:bg-gray-800 flex flex-col max-h-[90vh]"
          }
        }}
      >
        <Modal.Header>
          Confirmar Alteração
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <p className="mb-4 text-gray-900 dark:text-gray-100">Confirma a alteração deste ingrediente?</p>
            {itemToUpdate && (
              <div className="text-left text-sm bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-2">
                  <p className="dark:text-gray-300"><span className="font-semibold">Código:</span> {itemToUpdate.codigo_materia_prima}</p>
                  <p className="dark:text-gray-300"><span className="font-semibold">Nome:</span> {itemToUpdate.grupo_de_materiais?.toLowerCase() === 'ativo' ? itemToUpdate.Ativo : itemToUpdate.Excipiente}</p>
                  <p className="dark:text-gray-300"><span className="font-semibold">Quantidade:</span> {itemToUpdate.qtd_materia_prima}</p>
                  <p className="dark:text-gray-300"><span className="font-semibold">Unidade:</span> {itemToUpdate.un_materia_prima}</p>
                </div>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            color="success" 
            onClick={updateIngredient}
          >
            Confirmar
          </Button>
          <Button 
            color="gray" 
            onClick={() => setShowConfirmation(false)}
            className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          >
            Cancelar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de exclusão dentro do RecipeModal */}      <Modal 
        show={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        size="sm"
        theme={{
          content: {
            inner: "relative rounded-lg bg-white shadow dark:bg-gray-800 flex flex-col max-h-[90vh]"
          },
          header: {
            base: "flex items-start justify-between rounded-t border-b p-4 border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/20",
            title: "text-xl font-medium text-gray-900 dark:text-white"
          }
        }}
      >
        <Modal.Header>
          <div className="flex items-center">
            <div className="bg-red-100 dark:bg-red-800/60 rounded-full p-1.5 mr-2">
              <HiOutlineTrash className="text-red-500 dark:text-red-400" />
            </div>
            <span className="text-red-800 dark:text-red-300">Confirmar Exclusão</span>
          </div>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <p className="mb-4 text-gray-900 dark:text-gray-100">Tem certeza que deseja excluir este ingrediente?</p>
            {selectedItem && (
              <div className="text-gray-600 dark:text-gray-400 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/60">
                {selectedItem.grupo_de_materiais?.toLowerCase() === 'ativo' ? (
                  <p>Ativo: <strong className="text-gray-800 dark:text-gray-200">{selectedItem.Ativo}</strong></p>
                ) : (
                  <p>Excipiente: <strong className="text-gray-800 dark:text-gray-200">{selectedItem.Excipiente}</strong></p>
                )}
                <p>Código: <strong className="text-gray-800 dark:text-gray-200">{selectedItem.codigo_materia_prima}</strong></p>
                <p>Quantidade: <strong className="text-gray-800 dark:text-gray-200">{selectedItem.qtd_materia_prima} {selectedItem.un_materia_prima}</strong></p>
                <p>Código da Receita: <strong className="text-gray-800 dark:text-gray-200">{selectedItem.Codigo_Receita}</strong></p>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="justify-center">
          <Button 
            color="red" 
            onClick={handleDelete} 
            className="mr-2 hover:bg-red-700"
          >
            <HiOutlineTrash className="mr-2" />
            Excluir
          </Button>
          <Button 
            color="gray" 
            onClick={() => setIsDeleteModalOpen(false)}
            className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          >
            Cancelar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

const FormContent = ({ formData, onChange }) => (
  <div className="space-y-4">
    <div>
      <Label htmlFor="recipe-code" value="Código da Receita *" className="text-gray-700 dark:text-gray-300" />
      <TextInput
        id="recipe-code"
        name="Codigo_Receita"
        type="number"
        value={formData.Codigo_Receita}
        onChange={onChange}
        required
        theme={{
          field: {
            input: {
              base: "block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-500"
            }
          }
        }}
      />
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="group-type" value="Grupo de Materiais *" className="text-gray-700 dark:text-gray-300" />
        <Select
          id="group-type"
          name="grupo_de_materiais"
          value={formData.grupo_de_materiais}
          onChange={onChange}
          required
          theme={{
            field: {
              select: {
                base: "block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-500"
              }
            }
          }}
        >
          <option value="">Selecione...</option>
          <option value="ATIVO">ATIVO</option>
          <option value="EXCIPIENTE">EXCIPIENTE</option>
          <option value="CORANTE">CORANTE</option>
        </Select>
      </div>
      <div>
        <Label 
          htmlFor="ingredient-name"
          value={formData.grupo_de_materiais?.toLowerCase() === 'ativo' ? 'Ativo *' : 'Excipiente *'} 
          className="text-gray-700 dark:text-gray-300"
        />
        <TextInput
          id="ingredient-name"
          name={formData.grupo_de_materiais?.toLowerCase() === 'ativo' ? 'Ativo' : 'Excipiente'}
          value={formData.grupo_de_materiais?.toLowerCase() === 'ativo' ? formData.Ativo : formData.Excipiente}
          onChange={onChange}
          required
          theme={{
            field: {
              input: {
                base: "block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-500"
              }
            }
          }}
        />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="material-code" value="Código Matéria Prima *" className="text-gray-700 dark:text-gray-300" />
        <TextInput
          id="material-code"
          name="codigo_materia_prima"
          type="number"
          value={formData.codigo_materia_prima}
          onChange={onChange}
          required
          theme={{
            field: {
              input: {
                base: "block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-500"
              }
            }
          }}
        />
      </div>
      <div>
        <Label htmlFor="quantity" value="Quantidade *" className="text-gray-700 dark:text-gray-300" />
        <div className="flex gap-2">
          <TextInput
            id="quantity"
            name="qtd_materia_prima"
            type="number"
            step="0.01"
            value={formData.qtd_materia_prima}
            onChange={onChange}
            required
            className="flex-1"
            theme={{
              field: {
                input: {
                  base: "block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-500"
                }
              }
            }}
          />
          <TextInput
            id="unit"
            name="un_materia_prima"
            value={formData.un_materia_prima}
            onChange={onChange}
            placeholder="Un."
            className="w-20"
            required
            theme={{
              field: {
                input: {
                  base: "block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-500"
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  </div>
);

export default RecipeManager;