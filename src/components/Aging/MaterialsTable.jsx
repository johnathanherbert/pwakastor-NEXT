import { Badge } from 'flowbite-react';
import { format } from 'date-fns';

export default function MaterialsTable({ materials, filterStatus }) {
  const getFilterLabel = () => {
    if (filterStatus === 'adjustment') {
      return 'Lotes em Processo de Ajuste';
    }
    
    switch(filterStatus) {
      case 'critical': return 'Materiais em Status Crítico';
      case 'warning': return 'Materiais em Status de Alerta';
      case 'attention': return 'Materiais em Status de Atenção';
      case 'normal': return 'Materiais em Status Normal';
      default: return 'Todos os Materiais';
    }
  };

  const getTableHeaders = () => {
    if (filterStatus === 'adjustment') {
      return (
        <tr>
          <th scope="col" className="px-6 py-3">Código</th>
          <th scope="col" className="px-6 py-3">Descrição</th>
          <th scope="col" className="px-6 py-3">Lote</th>
          <th scope="col" className="px-6 py-3">Tipo</th>
          <th scope="col" className="px-6 py-3">Data Validade</th>
          <th scope="col" className="px-6 py-3">Dias na Área</th>
          <th scope="col" className="px-6 py-3">Status</th>
        </tr>
      );
    }

    return (
      <tr>
        <th scope="col" className="px-6 py-3">Código</th>
        <th scope="col" className="px-6 py-3">Descrição</th>
        <th scope="col" className="px-6 py-3">Lote</th>
        <th scope="col" className="px-6 py-3">Tipo</th>
        <th scope="col" className="px-6 py-3">Data Validade</th>
        <th scope="col" className="px-6 py-3">Dias em Aging</th>
        <th scope="col" className="px-6 py-3">Status</th>
      </tr>
    );
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {getFilterLabel()}
        </h2>
        <Badge color={filterStatus === 'adjustment' ? 'purple' : 'gray'}>
          {materials.length} items
        </Badge>
      </div>

      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            {getTableHeaders()}
          </thead>
          <tbody>
            {materials.length > 0 ? (
              materials.map((material, index) => (
                <tr 
                  key={`${material.codigo_materia_prima}-${material.lote}-${index}`}
                  className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {material.codigo_materia_prima}
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate">
                    {material.descricao}
                  </td>
                  <td className="px-6 py-4">
                    {material.lote}
                  </td>
                  <td className="px-6 py-4">
                    <Badge color={material.tipo_estoque === 'S' ? 'purple' : 'gray'} size="sm">
                      {material.tipo_estoque === 'S' ? 'Ajuste' : 'Regular'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    {format(new Date(material.data_validade), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {material.daysInArea}
                  </td>
                  <td className="px-6 py-4">
                    <Badge 
                      color={
                        material.status === 'critical' ? 'failure' :
                        material.status === 'warning' ? 'warning' :
                        material.status === 'attention' ? 'warning' :
                        'success'
                      }
                    >
                      {material.status.charAt(0).toUpperCase() + material.status.slice(1)}
                    </Badge>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  Nenhum material encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
