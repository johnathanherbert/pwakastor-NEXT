export default function Cartao() {
    return (
        <div className="border border-black p-4 w-80 font-sans text-xs mx-auto mt-5 text-black h-fit rounded-md shadow-md bg-gray-50">
            <div className="flex justify-between border-b border-black pb-1 mb-2">
                <div className="font-bold">COP FET.3</div>
                <div className="font-bold">5/5</div>
            </div>
            <div className="flex flex-col space-y-1">
                <div className="flex justify-between">
                    <div className="font-bold">OP:</div>
                    <div className="border-b border-black flex-grow ml-1 text-right">2189524</div>
                </div>
                <div className="flex justify-between">
                    <div className="font-bold">Data:</div>
                    <div className="border-b border-black flex-grow ml-1 text-right">05/06/2024</div>
                </div>
                <div className="flex justify-between">
                    <div className="font-bold">Cód:</div>
                    <div className="border-b border-black flex-grow ml-1 text-right">702536I</div>
                </div>
                <div className="flex justify-between">
                    <div className="font-bold">Lote:</div>
                    <div className="border-b border-black flex-grow ml-1 text-right">S4D4430</div>
                </div>
                <div className="flex justify-between">
                    <div className="font-bold">Tamanho do lote (CPR/CAPS):</div>
                    <div className="border-b border-black flex-grow ml-1 text-right">4.000.000</div>
                </div>
                <div className="flex justify-between">
                    <div className="font-bold">Desc:</div>
                    <div className="border-b border-black flex-grow ml-1 text-right">HIDROCLOROTIAZIDA 25MG COM</div>
                </div>
                <div className="flex justify-between">
                    <div className="font-bold">Punção/formato:</div>
                    <div className="border-b border-black flex-grow ml-1 text-right">Ø 6,0 mm Circular Côncavo Monossectado</div>
                </div>
                <div className="font-bold">Etapas:</div>
                <div className="flex justify-between">
                    <div className="font-bold">PES</div>
                </div>
                <div className="flex justify-between">
                    <div className="font-bold">PA</div>
                    <div className="border-b border-black flex-grow ml-1 text-right">0</div>
                    <div className="font-bold ml-4">PD</div>
                    <div className="border-b border-black flex-grow ml-1 text-right">0,2</div>
                    <div className="font-bold ml-4">PM</div>
                    <div className="border-b border-black flex-grow ml-1 text-right">0,2</div>
                </div>
                <div className="flex justify-between">
                    <div className="font-bold">CLF</div>
                    <div className="border-b border-black flex-grow ml-1 text-right">CLASSIF.1</div>
                    <div className="font-bold ml-4">TC</div>
                    <div className="border-b border-black flex-grow ml-1 text-right">01:30</div>
                </div>
                <div className="flex justify-between">
                    <div className="font-bold">MIS</div>
                    <div className="border-b border-black flex-grow ml-1 text-right">MIST 1</div>
                    <div className="font-bold ml-4">TC</div>
                    <div className="border-b border-black flex-grow ml-1 text-right">HT 05 D</div>
                    <div className="border-b border-black flex-grow ml-1 text-right">00:43</div>
                </div>
                <div className="flex justify-between">
                    <div className="font-bold">COP</div>
                    <div className="border-b border-black flex-grow ml-1 text-right">COP FET.3</div>
                    <div className="font-bold ml-4">TC</div>
                    <div className="border-b border-black flex-grow ml-1 text-right">HT N/A</div>
                    <div className="border-b border-black flex-grow ml-1 text-right">05:33</div>
                </div>
            </div>
        </div>
    );
};