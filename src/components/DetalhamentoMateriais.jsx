import React, { useState, useCallback } from "react";
import {
  ViewColumnsIcon,
  TableCellsIcon,
  XMarkIcon,
  CheckIcon,
  HashtagIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

const DetalhamentoMateriais = ({
  getFilteredAtivos,
  getAtivoStatus,
  ordens,
  filteredExcipientes,
  materiaisNaArea,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAtivo, setSelectedAtivo] = useState(null);
  const [viewMode, setViewMode] = useState("grid");

  const handleOpenDialog = (ativo) => {
    setSelectedAtivo(ativo);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedAtivo(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pesado":
        return "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300";
      case "completo":
        return "bg-green-50 dark:bg-green-800/30 text-green-700 dark:text-green-200";
      case "parcial":
        return "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-200";
      case "indisponivel":
        return "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200";
      default:
        return "bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pesado":
        return "Pesado";
      case "completo":
        return "Disponível";
      case "parcial":
        return "Parcial";
      default:
        return "Indisponível";
    }
  };

  const getOPList = (ordens, ativo) => {
    if (!Array.isArray(ordens) || ordens.length === 0) {
      return "Nenhuma OP";
    }

    const opsDoAtivo = ordens
      .filter(
        (ordem) =>
          ordem &&
          typeof ordem === "object" &&
          ordem.nome === ativo &&
          ordem.op !== undefined &&
          ordem.op !== null
      )
      .map((ordem) => ordem.op)
      .filter((op) => op !== undefined && op !== null);

    return opsDoAtivo.length > 0 ? opsDoAtivo.join(", ") : "Nenhuma OP";
  };

  const renderDialogContent = () => {
    if (!selectedAtivo || !filteredExcipientes) return null;

    return (
      <div className="flex flex-col gap-4">
        {/* Tabela de Excipientes Disponíveis */}
        <div>
          <h3 className="text-blue-700 dark:text-blue-400 font-semibold text-base mb-3">
            Excipientes Disponíveis para Pesar
          </h3>
          <div className="overflow-x-auto shadow-md rounded-lg">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-2.5 text-xs font-medium text-gray-600 dark:text-gray-300 text-left">
                    Excipiente
                  </th>
                  <th className="px-3 py-2.5 text-xs font-medium text-gray-600 dark:text-gray-300 text-right">
                    Qtd. Necessária (kg)
                  </th>
                  <th className="px-3 py-2.5 text-xs font-medium text-gray-600 dark:text-gray-300 text-right">
                    Qtd. na Área (kg)
                  </th>
                  <th className="px-3 py-2.5 text-xs font-medium text-gray-600 dark:text-gray-300 text-center">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {Object.entries(filteredExcipientes || {})
                  .filter(
                    ([_, data]) =>
                      data.ordens &&
                      Array.isArray(data.ordens) &&
                      data.ordens.some(
                        (ordem) => ordem && ordem.nome === selectedAtivo
                      )
                  )
                  .map(([excipient, data]) => {
                    const ordensDoAtivo = data.ordens.filter(
                      (ordem) => ordem && ordem.nome === selectedAtivo
                    );
                    const quantidadeNecessaria = ordensDoAtivo.reduce(
                      (sum, ordem) =>
                        sum + (ordem.pesado ? 0 : ordem.quantidade),
                      0
                    );
                    const quantidadeNaArea = materiaisNaArea[excipient] || 0;
                    const todosPesados = ordensDoAtivo.every(
                      (ordem) => ordem.pesado
                    );
                    const status = todosPesados
                      ? "pesado"
                      : quantidadeNaArea >= quantidadeNecessaria
                      ? "completo"
                      : quantidadeNaArea > 0
                      ? "parcial"
                      : "indisponivel";

                    return (
                      <tr
                        key={excipient}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors duration-150"
                      >
                        <td className="px-2 py-2 text-xs font-medium text-gray-900 dark:text-gray-100">
                          {todosPesados ? (
                            <s className="text-gray-500 dark:text-gray-400">
                              {excipient}
                            </s>
                          ) : (
                            excipient
                          )}
                        </td>
                        <td className="px-2 py-2 text-xs text-right font-medium text-gray-900 dark:text-gray-100">
                          {todosPesados ? (
                            <s className="text-gray-500 dark:text-gray-400">
                              {quantidadeNecessaria.toFixed(3)} Kg
                            </s>
                          ) : (
                            `${quantidadeNecessaria.toFixed(3)} Kg`
                          )}
                        </td>
                        <td className="px-2 py-2 text-xs text-right font-medium text-gray-900 dark:text-gray-100">
                          {quantidadeNaArea.toFixed(3)} Kg
                        </td>
                        <td
                          className={`px-2 py-2 text-xs text-center font-semibold ${getStatusColor(
                            status
                          )}`}
                        >
                          {getStatusText(status)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabela de Excipientes Faltantes */}
        <div>
          <h3 className="text-red-600 dark:text-red-400 font-bold text-sm mb-2">
            Excipientes Faltando Solicitar
          </h3>
          <div className="overflow-x-auto shadow-md rounded-lg">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-2 py-2 text-xs font-bold text-left text-gray-700 dark:text-gray-300">
                    Excipiente
                  </th>
                  <th className="px-2 py-2 text-xs font-bold text-right text-gray-700 dark:text-gray-300">
                    Qtd. Faltante (kg)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {Object.entries(filteredExcipientes || {})
                  .filter(
                    ([_, data]) =>
                      data.ordens &&
                      Array.isArray(data.ordens) &&
                      data.ordens.some(
                        (ordem) => ordem && ordem.nome === selectedAtivo
                      )
                  )
                  .map(([excipient, data]) => {
                    const quantidadeNecessaria = data.ordens
                      .filter((ordem) => ordem && ordem.nome === selectedAtivo)
                      .reduce(
                        (sum, ordem) =>
                          sum + (ordem.pesado ? 0 : ordem.quantidade),
                        0
                      );
                    const quantidadeNaArea = materiaisNaArea[excipient] || 0;
                    const quantidadeFaltante = Math.max(
                      quantidadeNecessaria - quantidadeNaArea,
                      0
                    );

                    if (quantidadeFaltante > 0) {
                      return (
                        <tr
                          key={excipient}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors duration-150"
                        >
                          <td className="px-2 py-2 text-xs font-medium text-gray-900 dark:text-gray-100">
                            {excipient}
                          </td>
                          <td className="px-2 py-2 text-xs text-right font-medium text-gray-900 dark:text-gray-100">
                            {quantidadeFaltante.toFixed(3)} Kg
                          </td>
                        </tr>
                      );
                    }
                    return null;
                  })
                  .filter(Boolean)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Função auxiliar para obter dados do ativo
  const getAtivoData = useCallback(
    (ativo) => {
      if (!filteredExcipientes)
        return {
          excipientesCount: 0,
          pesadosCount: 0,
          totalCount: 0,
          pesadosKg: 0,
          totalKg: 0,
        };

      const excipientesDoAtivo = Object.entries(filteredExcipientes).filter(
        ([_, data]) => data.ordens?.some((ordem) => ordem?.nome === ativo)
      );

      const totalExcipientes = excipientesDoAtivo.length;
      const ordensInfo = excipientesDoAtivo.reduce(
        (acc, [_, data]) => {
          const ordensDoAtivo =
            data.ordens?.filter((ordem) => ordem?.nome === ativo) || [];
          const pesadosKg = ordensDoAtivo
            .filter((ordem) => ordem?.pesado)
            .reduce((sum, ordem) => sum + (ordem.quantidade || 0), 0);
          const totalKg = ordensDoAtivo.reduce(
            (sum, ordem) => sum + (ordem.quantidade || 0),
            0
          );

          return {
            total: acc.total + ordensDoAtivo.length,
            pesados:
              acc.pesados +
              ordensDoAtivo.filter((ordem) => ordem?.pesado).length,
            pesadosKg: acc.pesadosKg + pesadosKg,
            totalKg: acc.totalKg + totalKg,
          };
        },
        { total: 0, pesados: 0, pesadosKg: 0, totalKg: 0 }
      );

      return {
        excipientesCount: totalExcipientes,
        pesadosCount: ordensInfo.pesados,
        totalCount: ordensInfo.total,
        pesadosKg: ordensInfo.pesadosKg,
        totalKg: ordensInfo.totalKg,
      };
    },
    [filteredExcipientes]
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Header com Controles */}
      <div
        className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg 
                    shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700
                    backdrop-blur-sm dark:backdrop-blur-sm"
      >
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Ativos em Produção
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 p-0.5 rounded-lg">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded transition-colors duration-200 ${
                viewMode === "grid"
                  ? "bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900/30"
                  : "hover:bg-gray-200 dark:hover:bg-gray-600/50"
              }`}
            >
              <ViewColumnsIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded transition-colors duration-200 ${
                viewMode === "table"
                  ? "bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900/30"
                  : "hover:bg-gray-200 dark:hover:bg-gray-600/50"
              }`}
            >
              <TableCellsIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid View - Melhorado */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 gap-3">
          {getFilteredAtivos().map((ativo) => {
            const status = getAtivoStatus(ativo);
            const ativoData = getAtivoData(ativo);
            const progress =
              ativoData.totalCount > 0
                ? (ativoData.pesadosCount / ativoData.totalCount) * 100
                : 0;

            return (
              <div key={ativo} className="group relative">
                {/* Card existente */}
                <div
                  onClick={() => handleOpenDialog(ativo)}
                  className="bg-white dark:bg-gray-800 p-3 rounded-lg 
                    border border-gray-200 dark:border-gray-700
                    hover:border-blue-300 dark:hover:border-blue-500
                    hover:shadow-md dark:hover:shadow-blue-500/20
                    hover:bg-gray-50 dark:hover:bg-gray-800/80
                    active:bg-gray-100 dark:active:bg-gray-700
                    transition-all duration-200 cursor-pointer
                    backdrop-blur-sm dark:backdrop-blur-sm"
                >
                  {/* Conteúdo existente do card */}
                  <div className="flex items-start justify-between gap-3">
                    {/* Info Principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-200 text-sm truncate">
                          {ativo}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                          ${getStatusColor(
                            status
                          )} dark:bg-opacity-20 dark:text-gray-200 hover:dark:text-white
                          shadow-sm dark:shadow-gray-900/30`}
                        >
                          {getStatusText(status)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate hover:text-gray-700 dark:hover:text-gray-300">
                        OPs: {getOPList(ordens, ativo)}
                      </p>
                    </div>
                  </div>

                  {/* Métricas com cores melhoradas */}
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div
                      className="bg-gray-50 dark:bg-gray-700/70 rounded p-1.5 
                                hover:bg-gray-100 dark:hover:bg-gray-600/80
                                border border-gray-200/50 dark:border-gray-600/50"
                    >
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Excipientes
                      </span>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {ativoData.excipientesCount}
                      </span>
                    </div>
                    <div
                      className="bg-gray-50 dark:bg-gray-700/70 rounded p-1.5 
                                hover:bg-gray-100 dark:hover:bg-gray-600/80
                                border border-gray-200/50 dark:border-gray-600/50"
                    >
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Pesados
                      </span>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {ativoData.pesadosCount}/{ativoData.totalCount}
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progresso melhorada */}
                  <div className="mt-2">
                    <div
                      className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 
                                shadow-inner dark:shadow-gray-900/50"
                    >
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 
                          ${
                            progress === 100
                              ? "bg-green-500 dark:bg-green-400 shadow-green-500/30 dark:shadow-green-400/30"
                              : "bg-blue-500 dark:bg-blue-400 shadow-blue-500/30 dark:shadow-blue-400/30"
                          }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Tooltip/Modal flutuante */}
                <div
                  className="invisible group-hover:visible opacity-0 group-hover:opacity-100 
                    absolute right-full top-0 -translate-x-2 z-50 w-72
                    transition-all duration-200 transform scale-95 group-hover:scale-100
                    pointer-events-none
                    [&:has(+.overflow-left)]:left-full [&:has(+.overflow-left)]:right-auto [&:has(+.overflow-left)]:ml-2 [&:has(+.overflow-left)]:translate-x-0"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    if (rect.left < 0) {
                      e.currentTarget.classList.add("overflow-left");
                    }
                  }}
                >
                  <div
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 
                    rounded-lg shadow-lg ring-1 ring-gray-200/50 dark:ring-gray-800
                    border border-blue-100 dark:border-gray-700 p-3
                    backdrop-blur-sm"
                  >
                    <div className="space-y-3">
                      {/* Status e Progresso */}
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            status
                          )}`}
                        >
                          {getStatusText(status)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Progresso: {Math.round(progress)}%
                        </span>
                      </div>

                      {/* Barra de Progresso */}
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            progress === 100
                              ? "bg-green-500 dark:bg-green-400"
                              : progress > 50
                              ? "bg-blue-500 dark:bg-blue-400"
                              : "bg-yellow-500 dark:bg-yellow-400"
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      {/* Métricas */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div
                          className={`rounded p-2 text-center ${
                            ativoData.pesadosCount === ativoData.totalCount
                              ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                              : "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          }`}
                        >
                          <div className="text-xs font-medium">Pesados</div>
                          <div className="text-sm">
                            {ativoData.pesadosCount}/{ativoData.totalCount}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {ativoData.pesadosKg?.toFixed(3) || "0.000"} kg
                          </div>
                        </div>
                        <div
                          className={`rounded p-2 text-center ${
                            ativoData.excipientesCount === 0
                              ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                              : "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          }`}
                        >
                          <div className="text-xs font-medium">Total</div>
                          <div className="text-sm">
                            {ativoData.excipientesCount}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {ativoData.totalKg?.toFixed(3) || "0.000"} kg
                          </div>
                        </div>
                      </div>

                      {/* Tabela de Excipientes Pesados */}
                      <div>
                        <h4 className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                          Excipientes Pesados
                        </h4>
                        <div className="overflow-hidden rounded border border-blue-200/50 dark:border-gray-700">
                          <table className="min-w-full divide-y divide-blue-100 dark:divide-gray-700">
                            <thead className="bg-blue-50/50 dark:bg-gray-800">
                              <tr>
                                <th className="px-2 py-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 text-left">
                                  Excipiente
                                </th>
                                <th className="px-2 py-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 text-right">
                                  Qtd (kg)
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white/50 dark:bg-gray-900/50 divide-y divide-blue-100 dark:divide-gray-700">
                              {Object.entries(filteredExcipientes || {})
                                .filter(([_, data]) =>
                                  data.ordens?.some(
                                    (ordem) =>
                                      ordem?.nome === ativo && ordem?.pesado
                                  )
                                )
                                .map(([excipient, data]) => (
                                  <tr key={excipient}>
                                    <td className="px-2 py-1 text-[11px] text-gray-900 dark:text-gray-300">
                                      {excipient}
                                    </td>
                                    <td className="px-2 py-1 text-[11px] text-right text-gray-900 dark:text-gray-300">
                                      {data.ordens
                                        .filter(
                                          (ordem) =>
                                            ordem?.nome === ativo &&
                                            ordem?.pesado
                                        )
                                        .reduce(
                                          (sum, ordem) =>
                                            sum + ordem.quantidade,
                                          0
                                        )
                                        .toFixed(3)}{" "}
                                      kg
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Tabela de Excipientes Pendentes */}
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Excipientes Pendentes
                        </h4>
                        <div className="overflow-hidden rounded border border-gray-200 dark:border-gray-700">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                              <tr>
                                <th className="px-2 py-1 text-[11px] font-medium text-gray-500 dark:text-gray-400 text-left">
                                  Excipiente
                                </th>
                                <th className="px-2 py-1 text-[11px] font-medium text-gray-500 dark:text-gray-400 text-right">
                                  Qtd (kg)
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                              {Object.entries(filteredExcipientes || {})
                                .filter(([_, data]) =>
                                  data.ordens?.some(
                                    (ordem) =>
                                      ordem?.nome === ativo && !ordem?.pesado
                                  )
                                )
                                .map(([excipient, data]) => (
                                  <tr key={excipient}>
                                    <td className="px-2 py-1 text-[11px] text-gray-900 dark:text-gray-300">
                                      {excipient}
                                    </td>
                                    <td className="px-2 py-1 text-[11px] text-right text-gray-900 dark:text-gray-300">
                                      {data.ordens
                                        .filter(
                                          (ordem) =>
                                            ordem?.nome === ativo &&
                                            !ordem?.pesado
                                        )
                                        .reduce(
                                          (sum, ordem) =>
                                            sum + ordem.quantidade,
                                          0
                                        )
                                        .toFixed(3)}{" "}
                                      kg
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal com visual melhorado */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-gray-500/75 dark:bg-gray-900/90 
                         backdrop-blur-sm transition-opacity"
            onClick={handleCloseDialog}
          />

          <div
            className="fixed inset-y-0 right-0 max-w-lg w-full bg-white dark:bg-gray-900 
                         shadow-xl dark:shadow-gray-900/50 border-l dark:border-gray-700"
          >
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span>{selectedAtivo}</span>
                    <span className="text-sm bg-white/20 dark:bg-gray-700/30 px-2 py-0.5 rounded">
                      {getOPList(ordens, selectedAtivo)}
                    </span>
                  </h3>
                  <button
                    onClick={handleCloseDialog}
                    className="text-white hover:text-gray-200 dark:hover:text-gray-300 
                             transition-colors duration-200"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 dark:border-t dark:border-gray-800">
                {renderDialogContent()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetalhamentoMateriais;
