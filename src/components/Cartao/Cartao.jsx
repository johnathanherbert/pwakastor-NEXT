export default function Cartao({ data }) {
    return (
        <div className="border border-black p-4 w-80 font-sans text-xs mx-auto mt-5 text-black h-fit rounded-md shadow-md bg-gray-50">
            <div className="flex justify-between border-b border-black pb-1 mb-2">
                <div className="font-bold">{data.familia || 'N/A'}</div>
                <div className="font-bold">{data.key || 'N/A'}</div>
            </div>
            <div className="flex flex-col space-y-1">
                <div className="flex justify-between">
                    <div className="font-bold">OP:</div>
                    <div className="border-b border-black flex-grow ml-1 text-right">{data.ordem || 'N/A'}</div>
                </div>
                <div className="flex justify-between">
                    <div className="font-bold">Data:</div>
                    <div className="border-b border-black flex-grow ml-1 text-right">{data.created_on || 'N/A'}</div>
                </div>
                <div className="flex justify-between">
                    <div className="font-bold">Cód:</div>
                    <div className="border-b border-black flex-grow ml-1 text-right">{data.material || 'N/A'}</div>
                </div>
                <div className="flex justify-between">
                    <div className="font-bold">Lote:</div>
                    <div className="border-b border-black flex-grow ml-1 text-right">{data.lote || 'N/A'}</div>
                </div>
                <div className="flex justify-between">
                    <div className="font-bold">Tamanho do lote (CPR/CAPS):</div>
                    <div className="border-b border-black flex-grow ml-1 text-right">{data.qtd_teorica || 'N/A'}</div>
                </div>
                <div className="flex justify-between">
                    <div className="font-bold">Desc:</div>
                    <div className="border-b border-black flex-grow ml-1 text-right">{data.texto_breve_material || 'N/A'}</div>
                </div>
                <div className="flex justify-between">
                    <div className="font-bold">Punção/formato:</div>
                    <div className="border-b border-black flex-grow ml-1 text-right">{data.revestimento || 'N/A'}</div>
                </div>
                <div className="font-bold">Etapas:</div>
                <div className="flex justify-between">
                    <div className="font-bold">PES</div>
                </div>
                <div className="flex justify-between">
                    <div className="font-bold">PA</div>
                    <div className="border-b border-black flex-grow ml-1 text-right">{data.pesagem || 'N/A'}</div>
                    <div className="font-bold ml-4">PD</div>
                    <div className="border-b border-black flex-grow ml-1 text-right">{data.lead_time || 'N/A'}</div>
                    <div className="font-bold ml-4">PM</div>
                    <div className="border-b border-black flex-grow ml-1 text-right">{data.previsao_chegada || 'N/A'}</div>
                </div>
                <div className="flex justify-between">
                    <div className="font-bold">CLF</div>
                    <div className="border-b border-black flex-grow ml-1 text-right">{data.peneira_status_classificacao || 'N/A'}</div>
                    <div className="font-bold ml-4">TC</div>
                    <div className="border-b border-black flex-grow ml-1 text-right">{data.familia || 'N/A'}</div>
                </div>
                <div className="flex justify-between">
                    <div className="font-bold">MIS</div>
                    <div className="border-b border-black flex-grow ml-1 text-right">{data.status_sistema || 'N/A'}</div>
                    <div className="font-bold ml-4">TC</div>
                    <div className="border-b border-black flex-grow ml-1 text-right">{data.status_vencimento || 'N/A'}</div>
                    <div className="border-b border-black flex-grow ml-1 text-right">{data.dias_em_processo || 'N/A'}</div>
                </div>
                <div className="flex justify-between">
                    <div className="font-bold">COP</div>
                    <div className="border-b border-black flex-grow ml-1 text-right">{data.familia || 'N/A'}</div>
                    <div className="font-bold ml-4">TC</div>
                    <div className="border-b border-black flex-grow ml-1 text-right">{data.classificacao_criticos || 'N/A'}</div>
                    <div className="border-b border-black flex-grow ml-1 text-right">{data.posicao_atual || 'N/A'}</div>
                </div>
            </div>
        </div>
    );
}