'use client'
import { useState, useRef, useEffect } from 'react';
import { CalculatorIcon, XMarkIcon } from '@heroicons/react/24/outline';

const Calculator = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState(null);
  const [operation, setOperation] = useState(null);
  const [newNumber, setNewNumber] = useState(true);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  
  const buttonRef = useRef(null);

  // Função para calcular e atualizar a posição do modal
  const updateModalPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setModalPosition({
        top: rect.bottom + 8, // 8px de espaçamento
        left: Math.max(16, rect.left - 320 + rect.width), // Alinha à direita do botão, com margem mínima
      });
    }
  };

  // Atualiza a posição quando o modal é aberto
  useEffect(() => {
    if (isOpen) {
      updateModalPosition();
      // Adiciona listener para redimensionamento
      window.addEventListener('resize', updateModalPosition);
      // Cleanup
      return () => window.removeEventListener('resize', updateModalPosition);
    }
  }, [isOpen]);

  const handleNumber = (num) => {
    if (newNumber) {
      setDisplay(num.toString());
      setNewNumber(false);
    } else {
      setDisplay(display + num.toString());
    }
  };

  const handleOperation = (op) => {
    if (operation && !newNumber) {
      calculate();
    }
    setPreviousValue(parseFloat(display));
    setOperation(op);
    setNewNumber(true);
  };

  const calculate = () => {
    if (previousValue === null || newNumber) return;
    
    const current = parseFloat(display);
    let result;

    switch (operation) {
      case '+':
        result = previousValue + current;
        break;
      case '-':
        result = previousValue - current;
        break;
      case '*':
        result = previousValue * current;
        break;
      case '/':
        result = previousValue / current;
        break;
      default:
        return;
    }

    setDisplay(result.toString());
    setPreviousValue(null);
    setOperation(null);
    setNewNumber(true);
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setNewNumber(true);
  };

  const buttons = [
    '7', '8', '9', '/',
    '4', '5', '6', '*',
    '1', '2', '3', '-',
    '0', '.', '=', '+'
  ];

  return (
    <>
      {/* Botão da Calculadora */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 
                 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg
                 transition-colors duration-200"
      >
        <CalculatorIcon className="h-5 w-5" />
        <span className="hidden sm:inline">Calculadora</span>
      </button>

      {/* Modal da Calculadora */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal */}
          <div 
            className="fixed z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl"
            style={{
              top: `${modalPosition.top}px`,
              left: `${modalPosition.left}px`,
              maxHeight: 'calc(100vh - 80px)', // Evita que o modal ultrapasse a tela
              transform: 'translateX(-50%)', // Centraliza horizontalmente
            }}
          >
            {/* Cabeçalho */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Calculadora
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Display */}
            <div className="p-4">
              <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg mb-4">
                <div className="text-right text-2xl font-mono text-gray-900 dark:text-gray-100">
                  {display}
                </div>
              </div>

              {/* Teclado */}
              <div className="grid grid-cols-4 gap-2">
                {/* Botão Clear */}
                <button
                  onClick={clear}
                  className="col-span-4 p-3 text-white bg-red-500 hover:bg-red-600 
                           rounded-lg transition-colors duration-200"
                >
                  Clear
                </button>

                {/* Botões Numéricos e Operações */}
                {buttons.map((btn) => (
                  <button
                    key={btn}
                    onClick={() => {
                      if (btn === '=') {
                        calculate();
                      } else if (['+', '-', '*', '/'].includes(btn)) {
                        handleOperation(btn);
                      } else {
                        handleNumber(btn);
                      }
                    }}
                    className={`p-3 text-lg font-medium rounded-lg transition-colors duration-200 
                              ${['+', '-', '*', '/', '='].includes(btn)
                                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
                              }`}
                  >
                    {btn}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Calculator; 