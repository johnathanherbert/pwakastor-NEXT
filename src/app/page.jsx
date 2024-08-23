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
    <div className="container mx-auto p-3 max-w-full overflow-x-hidden">
      <header className="bg-blue-800 text-white rounded-lg mb-4 p-4 flex items-center">
        <ScaleIcon className="w-6 h-6" />
        <h1 className="text-xl font-semibold pl-2 text-sm md:text-base">
          Pesagem
        </h1>
        <p className="font-sans text-sm pl-2 text-blue-500">
          by Johnathan Herbert
        </p>
      </header>

      <section className="mb-4">
        <h2 className="text-lg font-semibold mb-2 text-sm md:text-base">
          Gestão de Ordens
        </h2>
        <input
          type="number"
          placeholder="Código Receita"
          value={ativo}
          onChange={(e) => setAtivo(e.target.value)}
          className="w-full p-2 mb-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-sm"
        />
        <button
          onClick={handleAddOrdem}
          className="w-full bg-blue-600 text-white p-2 mb-2 rounded-lg shadow-lg hover:bg-blue-700 transition text-sm md:text-sm"
        >
          Adicionar Ordem
        </button>
        <button
          onClick={handleUpdateTotal}
          className="w-full bg-blue-700 text-white p-2 rounded-lg shadow-lg hover:bg-blue-800 transition text-sm md:text-sm"
        >
          Atualizar Tabela
        </button>
      </section>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <h3 className="text-lg font-semibold mb-2 text-sm md:text-base">
            Ordens Adicionadas
          </h3>
          <div className="rounded-lg shadow-lg p-2 max-w-full overflow-x-auto">
            <table className="min-w-full bg-white shadow-md rounded-xl text-sm md:text-sm">
              <thead className="bg-blue-gray-100 text-gray-700 text-sm uppercase">
                <tr>
                  <th className="py-2 px-2 text-left">Código</th>
                  <th className="py-2 px-2 text-left">Nome</th>
                  <th className="py-2 px-2 text-left">Ações</th>
                </tr>
              </thead>
              <tbody className="text-blue-gray-900">
                {ordens.map((ordem, index) => (
                  <tr
                    key={index}
                    className="border-b border-blue-gray-200 hover:bg-gray-50"
                  >
                    <td className="py-2 px-2">{ordem.codigo}</td>
                    <td className="py-2 px-2">{ordem.nome}</td>
                    <td className="py-2 px-2 flex space-x-1">
                      <button
                        onClick={() => handleRemoveOrdem(index)}
                        className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition"
                      >
                        Remover
                      </button>
                      <button
                        onClick={() => handleEditOrdem(index)}
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-sm font-semibold mt-4 mb-2 text-sm md:text-base">
            Somatória de Excipientes{" "}
            <span>
              <div className="flex">
                <div className="flex m-1">
                  <div className="bg-blue-600 w-3 h-3"></div>
                  <p className="font-sans text-sm text-gray-400 pl-1">Manual</p>
                </div>
                <div className="flex m-1">
                  <div className="bg-red-500 w-3 h-3"></div>
                  <p className="font-sans text-sm text-gray-400 pl-1">
                    Automática
                  </p>
                </div>
              </div>
            </span>
          </h3>
          <div className="rounded-lg shadow-lg p-2 max-w-full overflow-x-auto">
            <table className="min-w-full bg-white shadow-md rounded-xl text-sm md:text-sm">
              <thead className="bg-blue-gray-100 text-gray-700 text-sm uppercase">
                <tr>
                  <th className="py-1 px-1 text-left">Excipiente</th>
                  <th className="py-1 px-1 text-left">Quantidade Total (Kg)</th>
                  <th className="py-1 px-1 text-left">Ordens</th>
                </tr>
              </thead>
              <tbody className="text-blue-gray-900">
                {Object.entries(excipientes).map(
                  ([excipient, { total, ordens }]) => (
                    <tr
                      key={excipient}
                      className="border-b border-blue-gray-200 hover:bg-gray-50 transition-colors duration-300"
                    >
                      <td colSpan={3} className="py-3 px-4">
                        <div className="flex flex-col items-start space-y-2">
                          <div
                            className="flex justify-between items-center w-full cursor-pointer"
                            onClick={() =>
                              handleToggleExpandExcipient(excipient)
                            }
                          >
                            <div
                              className={`text-sm font-semibold ${
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
                            </div>
                            <div className="text-sm text-blue-700 font-semibold">
                              {total} kg
                            </div>
                          </div>
                          {expandedExcipient === excipient && (
                            <ul className="w-full mt-2 space-y-3 p-2 bg-gray-100 rounded-lg shadow-inner">
                              {ordens.map((ordem, index) => (
                                <li
                                  key={index}
                                  className="p-2 border border-gray-300 rounded-lg flex items-center space-x-6 bg-white shadow-sm hover:shadow-lg transition-shadow"
                                >
                                  <div className="flex flex-col">
                                    <span className="text-sm text-gray-500">
                                      Código:
                                    </span>
                                    <span className="text-blue-600 font-semibold">
                                      {ordem.codigo}
                                    </span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-sm text-gray-500">
                                      Quantidade:
                                    </span>
                                    <span className="text-blue-600">
                                      {ordem.quantidade} kg
                                    </span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-sm text-gray-500">
                                      Ativo:
                                    </span>
                                    <span className="text-blue-400">
                                      {ordem.nome}
                                    </span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
