import React from "react";
import { HiChartBar, HiClock, HiExclamationCircle } from "react-icons/hi";

export function StorageStats({
  roomStats,
  topMaterials,
  expiredPallets
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Estatísticas por sala */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200 flex items-center">
          <HiChartBar className="w-5 h-5 mr-2 text-blue-500" />
          Estatísticas por Sala
        </h3>
        <div className="space-y-3">
          {roomStats.map((room) => (
            <div key={room.id} className="relative pt-1">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {room.name}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    {room.occupied}/{room.total} ({Math.round((room.occupied / room.total) * 100)}%)
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
                <div
                  style={{ width: `${(room.occupied / room.total) * 100}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Materiais mais comuns */}
<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
  <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200 flex items-center">
    <HiChartBar className="w-5 h-5 mr-2 text-green-500" />
    Materiais Mais Frequentes
  </h3>
  <div className="space-y-2 max-h-60 overflow-y-auto"> {/* Adicionado max-h-60 e overflow-y-auto */}
    {topMaterials.length > 0 ? (
      topMaterials.map((material, index) => (
        <div
          key={material.code}
          className="flex justify-between items-center p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center">
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs font-bold mr-2">
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {material.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Código: {material.code}
              </p>
            </div>
          </div>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            {material.count}
          </span>
        </div>
      ))
    ) : (
      <p className="text-center text-gray-500 dark:text-gray-400 py-4">
        Nenhum material alocado
      </p>
    )}
  </div>
</div>

      {/* Holding Time */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200 flex items-center">
          <HiClock className="w-5 h-5 mr-2 text-amber-500" />
          Holding Time (Limite: 20 dias)
        </h3>
        <div className="space-y-2">
          {expiredPallets.length > 0 ? (
            <>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-md p-3 mb-3">
                <div className="flex items-center">
                  <HiExclamationCircle className="w-5 h-5 mr-2 text-red-500" />
                  <p className="text-sm text-red-600 dark:text-red-300">
                    <span className="font-bold">{expiredPallets.length}</span> paletes ultrapassaram o limite de 20 dias!
                  </p>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {expiredPallets.map((pallet) => (
                  <div
                    key={pallet.id}
                    className="flex justify-between items-center p-2 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10 rounded-r-md"
                  >
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-300">
                        OP: {pallet.current_op}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400">
                        Material: {pallet.material_name || 'Não informado'}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400">
                        Sala: {pallet.roomName}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400">
                        Vaga: {pallet.name || 'Não informada'}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-red-800 dark:text-red-300">
                      {pallet.days} dias
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-md p-3">
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center mr-2">
                  <span className="text-green-500 dark:text-green-300 text-lg">✓</span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Todos os paletes estão dentro do holding time
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}