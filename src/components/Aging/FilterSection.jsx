import { TextInput, Select, Button } from 'flowbite-react';
import { HiOutlineSearch, HiOutlineArrowPath } from 'react-icons/hi2';

export default function FilterSection({ 
  searchTerm, 
  setSearchTerm, 
  filterStatus, 
  setFilterStatus, 
  isRefreshing, 
  handleRefresh 
}) {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <TextInput
        id="search"
        type="text"
        placeholder="Buscar material..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        icon={HiOutlineSearch}
      />
      <Select
        id="status"
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
      >
        <option value="all">Todos os Materiais</option>
        <option value="adjustment">Lotes em Ajuste (S)</option>
        <option value="normal">Lotes Regulares</option>
        <option value="critical">Status Crítico</option>
        <option value="warning">Status Alerta</option>
        <option value="attention">Status Atenção</option>
      </Select>
      <Button
        onClick={handleRefresh}
        isProcessing={isRefreshing}
        color="primary"
      >
        <HiOutlineArrowPath className="mr-2 h-5 w-5" />
        {isRefreshing ? 'Atualizando...' : 'Atualizar'}
      </Button>
    </div>
  );
}
