// pages/index.js
"use client";
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import ScaleIcon from "@mui/icons-material/Scale";
import { Bar } from "react-chartjs-2";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Home() {
  const [ordens, setOrdens] = useState([]);
  const [ativo, setAtivo] = useState("");
  const [excipientes, setExcipientes] = useState({});
  const [editingOrdem, setEditingOrdem] = useState(null);
  const [expandedExcipient, setExpandedExcipient] = useState(null);
  const [editingExcipiente, setEditingExcipiente] = useState({});

  const handleAddOrdem = async () => {
    const { data, error } = await supabase
      .from("DataBase_nmed")
      .select("*")
      .eq("Codigo_Receita", ativo);

    if (error) {
      alert(error.message);
    } else if (data.length > 0) {
      const newOrdens = [...ordens, { codigo: ativo, nome: data[0].Ativo }];
      setOrdens(newOrdens);
      calcularExcipientes(newOrdens);
    } else {
      alert("Receita não encontrada");
    }
  };

  const handleRemoveOrdem = (index) => {
    const newOrdens = [...ordens];
    newOrdens.splice(index, 1);
    setOrdens(newOrdens);
    calcularExcipientes(newOrdens);
  };

  const handleEditOrdem = (index) => {
    setEditingOrdem(ordens[index]);
    fetchOrdemExcipientes(ordens[index].codigo);
  };

  const handleCloseEdit = () => {
    setEditingOrdem(null);
    setEditingExcipiente({});
  };

  const handleSaveEdit = () => {
    const updatedOrdens = ordens.map((ordem) =>
      ordem.codigo === editingOrdem.codigo
        ? { ...ordem, excipientes: editingExcipiente }
        : ordem
    );
    setOrdens(updatedOrdens);
    handleCloseEdit();
  };

  const handleUpdateTotal = () => {
    calcularExcipientes(ordens);
  };

  const fetchOrdemExcipientes = async (codigo) => {
    const { data, error } = await supabase
      .from("DataBase_nmed")
      .select("Excipiente, qtd_materia_prima")
      .eq("Codigo_Receita", codigo);

    if (error) {
      alert(error.message);
      return;
    }

    const excipientesData = data.reduce((acc, item) => {
      acc[item.Excipiente] = item.qtd_materia_prima;
      return acc;
    }, {});

    setEditingExcipiente(excipientesData);
  };

  const handleExcipientChange = (excipient, value) => {
    setEditingExcipiente({
      ...editingExcipiente,
      [excipient]: parseFloat(value),
    });
  };

  const handleRemoveExcipient = (excipient) => {
    const { [excipient]: _, ...rest } = editingExcipiente;
    setEditingExcipiente(rest);
  };

  const handleToggleExpandExcipient = (excipient) => {
    setExpandedExcipient(expandedExcipient === excipient ? null : excipient);
  };

  const calcularExcipientes = async (ordens) => {
    if (ordens.length === 0) {
      setExcipientes({});
      return;
    }

    let newExcipientes = {};

    for (let ordem of ordens) {
      const { data, error } = await supabase
        .from("DataBase_nmed")
        .select("Excipiente, qtd_materia_prima")
        .eq("Codigo_Receita", ordem.codigo);

      if (error) {
        alert(error.message);
        return;
      }

      data.forEach((item) => {
        if (!newExcipientes[item.Excipiente]) {
          newExcipientes[item.Excipiente] = { total: 0, ordens: [] };
        }
        newExcipientes[item.Excipiente].total += item.qtd_materia_prima;
        newExcipientes[item.Excipiente].ordens.push({
          codigo: ordem.codigo,
          quantidade: item.qtd_materia_prima,
          nome: ordem.nome,
        });
      });
    }

    setExcipientes(newExcipientes);
  };

  const testConnection = async () => {
    const { data, error } = await supabase
      .from("DataBase_nmed")
      .select("*")
      .limit(1);

    console.log("Teste de conexão:", data, error);
  };

  useEffect(() => {
    testConnection();
  }, []);

  useEffect(() => {
    calcularExcipientes(ordens);
  }, [ordens]);

  const chartData = {
    labels: Object.keys(excipientes),
    datasets: [
      {
        label: "Quantidade de Excipientes",
        data: Object.values(excipientes).map((item) => item.total),
        backgroundColor: Object.keys(excipientes).map(
          (_, index) =>
            `rgba(${(index * 50) % 255}, ${(index * 100) % 255}, ${
              (index * 150) % 255
            }, 0.6)`
        ),
        borderColor: Object.keys(excipientes).map(
          (_, index) =>
            `rgba(${(index * 50) % 255}, ${(index * 100) % 255}, ${
              (index * 150) % 255
            }, 1)`
        ),
        borderWidth: 1,
      },
    ],
  };
  return (
    <div className="container mx-auto p-6">
      <header className="bg-blue-800 text-white rounded-lg mb-6 p-6 flex ">
        <ScaleIcon />
        <h1 className="text-2xl font-semibold pl-2">Pesagem</h1>
        <p className="font-sans text-sm pl-4 text-blue-500">
          by Johnathan Herbert
        </p>
      </header>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Gestão de Ordens</h2>
        <input
          type="number"
          placeholder="Código Receita"
          value={ativo}
          onChange={(e) => setAtivo(e.target.value)}
          className="w-full p-3 mb-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAddOrdem}
          className="w-full bg-blue-600 text-white p-3 mb-3 rounded-lg shadow-lg hover:bg-blue-700 transition"
        >
          Adicionar Ordem
        </button>
        <button
          onClick={handleUpdateTotal}
          className="w-full bg-blue-700 text-white p-3 rounded-lg shadow-lg hover:bg-blue-800 transition"
        >
          Atualizar Tabela
        </button>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-semibold mb-4">Ordens Adicionadas</h3>
          <div className="rounded-lg shadow-lg p-2">
            <table className="min-w-full bg-white shadow-md rounded-xl">
              <thead className="bg-blue-gray-100 text-gray-700 text-xs uppercase">
                <tr>
                  <th className="py-3 px-4 text-left">Código</th>
                  <th className="py-3 px-4 text-left">Nome</th>
                  <th className="py-3 px-4 text-left">Ações</th>
                </tr>
              </thead>
              <tbody className="text-blue-gray-900">
                {ordens.map((ordem, index) => (
                  <tr
                    key={index}
                    className="border-b border-blue-gray-200 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">{ordem.codigo}</td>
                    <td className="py-3 px-4">{ordem.nome}</td>
                    <td className="py-3 px-4 flex space-x-2">
                      <button
                        onClick={() => handleRemoveOrdem(index)}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                      >
                        Remover
                      </button>
                      <button
                        onClick={() => handleEditOrdem(index)}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-xl font-semibold mt-6 mb-4">
            Somatória de Excipientes{" "}
            <span>
              <div className="flex">
                <div className="flex m-2">
                  <div className="bg-blue-600 w-4 h-4"></div>
                  <p className="font-sans text-sm text-gray-400 pl-2">Manual</p>
                </div>
                <div className="flex m-2">
                  <div className="bg-red-500 w-4 h-4"></div>
                  <p className="font-sans text-sm text-gray-400 pl-2">
                    Automática
                  </p>
                </div>
              </div>
            </span>
          </h3>
          <div className="rounded-lg shadow-lg p-2">
            <table className="min-w-full bg-white shadow-md rounded-xl">
              <thead className="bg-blue-gray-100 text-gray-700 text-xs uppercase">
                <tr>
                  <th className="py-3 px-4 text-left">Excipiente</th>
                  <th className="py-3 px-4 text-left">Quantidade Total (Kg)</th>
                  <th className="py-3 px-4 text-left">Ordens</th>
                </tr>
              </thead>
              <tbody className="text-blue-gray-900">
                {Object.entries(excipientes).map(
                  ([excipient, { total, ordens }]) => (
                    <tr
                      key={excipient}
                      className="border-b border-blue-gray-200 hover:bg-gray-50"
                    >
                      <td
                        className={`py-3 px-4 ${
                          [
                            "LACTOSE (200)",
                            "LACTOSE (50/70)",
                            "AMIDO DE MILHO PREGELATINIZADO",
                            "CELULOSE MIC (TIPO200)",
                            "CELULOSE MIC.(TIPO102)",
                            "FOSF.CAL.DIB.(COMPDIRETA)",
                            "AMIDO",
                            "CELULOSE+LACTOSE",
                          ].includes(excipient)
                            ? "text-red-600"
                            : "text-blue-600"
                        }`}
                      >
                        {excipient}
                      </td>
                      <td className="py-3 px-4">{total} kg</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleExpandExcipient(excipient)}
                          className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 transition"
                        >
                          {expandedExcipient === excipient
                            ? "Ocultar Ordens"
                            : "Mostrar Ordens"}
                        </button>
                        {expandedExcipient === excipient && (
                          <ul className="mt-3 space-y-2 text-gray-700">
                            {ordens.map((ordem, index) => (
                              <li key={index}>
                                Código:{" "}
                                <span className="text-blue-600">
                                  {ordem.codigo}
                                </span>
                                , Quantidade:{" "}
                                <span className="text-blue-600 font-bold">
                                  {ordem.quantidade} kg
                                </span>
                                , Ativo:{" "}
                                <span className="text-blue-400 font-bold">
                                  {ordem.nome}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Gráfico de Excipientes</h3>
          <div className="w-full h-80">
            <Bar data={chartData} options={{ responsive: true }} />
          </div>
        </div>
      </div>

      {editingOrdem && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
            <h3 className="text-xl font-semibold mb-4">
              Editar Ordem: {editingOrdem.codigo}
            </h3>
            {Object.entries(editingExcipiente).map(([excipient, value]) => (
              <div key={excipient} className="mb-4">
                <label className="block text-sm mb-2 font-medium">
                  {excipient}
                </label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) =>
                    handleExcipientChange(excipient, e.target.value)
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleRemoveExcipient(excipient)}
                  className="text-red-600 mt-2"
                >
                  Remover
                </button>
              </div>
            ))}
            <div className="flex space-x-3">
              <button
                onClick={handleSaveEdit}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Salvar
              </button>
              <button
                onClick={handleCloseEdit}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      <p className="text-center">
        Projeto em desenvolvimento - Johnathan Herbert ID 75710{" "}
      </p>
    </div>
  );
}
