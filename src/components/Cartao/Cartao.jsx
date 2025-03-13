import React from "react";

export default function Cartao({ data }) {
  return (
    <div className="border border-black w-[350px] font-sans text-xs mx-auto mt-5 text-black bg-white rounded-md shadow-md p-2">
      {/* Cabeçalho */}
      <div className="flex justify-between border-b border-black pb-1 font-bold text-sm">
        <span>COP LEG.1</span>
        <span>3/3</span>
      </div>
      
      {/* Informações principais */}
      <div className="grid grid-cols-2 gap-1 mt-2">
        <div className="flex justify-between">
          <span className="font-bold">OP:</span>
          <span>{data.ordem || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Data:</span>
          <span>{data.created_on || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Cód:</span>
          <span>{data.material || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Lote:</span>
          <span>{data.lote || 'N/A'}</span>
        </div>
        <div className="col-span-2 flex justify-between">
          <span className="font-bold">Tamanho do lote (CPR/CAPS):</span>
          <span>{data.qtd_teorica || 'N/A'}</span>
        </div>
        <div className="col-span-2 flex justify-between font-bold">
          <span>Desc.:</span>
          <span>{data.texto_breve_material || 'N/A'}</span>
        </div>
      </div>
      
      {/* Tabela de Etapas */}
      <div className="mt-2 border-t border-black pt-1">
        <div className="grid grid-cols-5 text-center font-bold text-xs border-b border-black">
          <span>Etapas</span>
          <span>PA</span>
          <span>PD</span>
          <span>PM</span>
          <span>TC</span>
        </div>
        <div className="grid grid-cols-5 text-center border-b border-black">
          <span>PES</span>
          <span className="border border-black">█</span>
          <span className="border border-black">█</span>
          <span>2,2</span>
        </div>
        <div className="grid grid-cols-5 text-center border-b border-black">
          <span>GRA</span>
          <span className="col-span-2">VG 400</span>
          <span className="col-span-2">06:51</span>
        </div>
        <div className="grid grid-cols-5 text-center border-b border-black">
          <span>SEC</span>
          <span className="col-span-2">LTO 400</span>
          <span className="col-span-2">06:51</span>
        </div>
        <div className="grid grid-cols-5 text-center border-b border-black">
          <span>CLF</span>
          <span className="col-span-2">CLAS M.1</span>
          <span className="col-span-2">02:25</span>
        </div>
        <div className="grid grid-cols-5 text-center border-b border-black">
          <span>MIS</span>
          <span className="col-span-2">MIST 2</span>
          <span className="col-span-2 bg-gray-300">HT 07 D</span>
        </div>
        <div className="grid grid-cols-5 text-center border-b border-black">
          <span>COP</span>
          <span className="col-span-2">COP LEG.1</span>
          <span className="col-span-2 bg-gray-300">HT 08 D</span>
        </div>
        <div className="grid grid-cols-5 text-center border-b border-black">
          <span>REV</span>
          <span className="col-span-2">REV. 150 3</span>
          <span className="col-span-2">06:51</span>
        </div>
      </div>
      
      {/* Observações */}
      <div className="mt-2 bg-red-600 text-white font-bold text-center py-1">
        Crítico / VERMELHO
      </div>
    </div>
  );
}