"use client";
import React from "react";

const familias = [
  "F1", "F2", "F3", "F4", "F5", "F6", "F7", "L1", "L2", "L3", "L4", "L5", "L6", "L7", "L8",
  "S250", "K500", "T400", "Pam1", "Pam2", "Mg2", "Stinfer", "Total"
];

const dados = {
  F1: {
    "3turno": { VS: { quantidade: 2, remedio: "Paracetamol" }, VU: { quantidade: 1, remedio: "Ibuprofeno" } },
    "1turno": { VS: { quantidade: 3, remedio: "Aspirina" }, VU: { quantidade: 2, remedio: "Dipirona" } },
    "2turno": { VS: { quantidade: 1, remedio: "Omeprazol" }, VU: { quantidade: 2, remedio: "Loratadina" } },
    status: 137
  },
  // Adicione dados similares para as outras famílias
};

const formatStatus = (value) => {
  if (value === null) return "";
  if (value >= 1000) return "999%";
  return `${value}%`;
};

export default function RejunkaDashboard() {
  return (
    <div className="flex flex-col w-screen h-screen bg-gray-100 p-4">
      <header className="bg-blue-600 text-white p-4 rounded-t-lg">
        <h1 className="text-2xl font-bold">Dashboard de Medicamentos</h1>
      </header>
      
      <div className="flex flex-1 space-x-4 mt-4">
        <div className="w-[40%] bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 bg-blue-500 text-white font-bold">
            Tabela de Distribuição de Medicamentos
          </div>
          <div className="p-2 overflow-auto max-h-[calc(100vh-200px)]">
            <table className="w-full border-collapse text-xs">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2 text-left">Família</th>
                  <th colSpan="2" className="p-2 text-center">3 turno</th>
                  <th colSpan="2" className="p-2 text-center">1 turno</th>
                  <th colSpan="2" className="p-2 text-center">2 turno</th>
                  <th className="p-2 text-center">Status</th>
                </tr>
                <tr className="bg-gray-100">
                  <th className="p-1"></th>
                  <th className="p-1 text-center">VS</th>
                  <th className="p-1 text-center">VU</th>
                  <th className="p-1 text-center">VS</th>
                  <th className="p-1 text-center">VU</th>
                  <th className="p-1 text-center">VS</th>
                  <th className="p-1 text-center">VU</th>
                  <th className="p-1"></th>
                </tr>
              </thead>
              <tbody>
                {familias.map((familia, index) => (
                  <tr key={familia} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="p-2 font-medium border-r border-gray-200">{familia}</td>
                    {["3turno", "1turno", "2turno"].map((turno) => (
                      <React.Fragment key={turno}>
                        <td className="p-1 text-center border-r border-gray-200">
                          {dados[familia]?.[turno]?.VS ? 
                            `${dados[familia][turno].VS.quantidade} ${dados[familia][turno].VS.remedio.substring(0, 5)}` : 
                            ''}
                        </td>
                        <td className="p-1 text-center border-r border-gray-200">
                          {dados[familia]?.[turno]?.VU ? 
                            `${dados[familia][turno].VU.quantidade} ${dados[familia][turno].VU.remedio.substring(0, 5)}` : 
                            ''}
                        </td>
                      </React.Fragment>
                    ))}
                    <td className="p-2 text-right font-medium text-blue-600">
                      {formatStatus(dados[familia]?.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="w-[60%] space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-2">Estatísticas Gerais</h2>
            {/* Adicione aqui componentes para estatísticas gerais */}
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-2">Gráfico de Distribuição</h2>
            {/* Adicione aqui um componente de gráfico */}
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-2">Alertas</h2>
            {/* Adicione aqui um componente de alertas */}
          </div>
        </div>
      </div>
    </div>
  );
}
