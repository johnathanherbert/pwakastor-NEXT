import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import Tesseract from 'tesseract.js';
import { Button, Spinner } from 'flowbite-react';
import { HiCamera, HiX } from 'react-icons/hi';

const MobileOcrScanner = ({ onResult, onClose }) => {
  const webcamRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const captureAndRecognize = async () => {
    const screenshot = webcamRef.current.getScreenshot();
    if (!screenshot) {
      setError("Não foi possível tirar uma foto. Por favor, verifique a permissão da câmera.");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const { data: { text } } = await Tesseract.recognize(
        screenshot,
        'por',
        { logger: m => console.log(m) }
      );

      console.log("Texto extraído:", text);

      // Extrair os dados da etiqueta
      const ordemMatch = text.match(/ordem\s*[:#]?\s*(\d{6,})/i) || 
                          text.match(/op\s*[:#]?\s*(\d{6,})/i) ||
                          text.match(/(\d{6,})/i); // Fallback para qualquer número com 6+ dígitos
                          
      const receitaMatch = text.match(/c[oó]digo\s*da\s*receita\s*[:#]?\s*(\d{6})/i) || 
                           text.match(/receita\s*[:#]?\s*(\d{6})/i) ||
                           text.match(/(\d{6})[^\d]*$/i); // Fallback para um número de 6 dígitos no final
                           
      const dataMatch = text.match(/data\s*[:#]?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i) ||
                        text.match(/pesagem\s*[:#]?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i) ||
                        text.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/i); // Qualquer data no formato xx/xx/xxxx

      const dataExtraida = {
        ordem: ordemMatch ? ordemMatch[1] : '',
        codigoReceita: receitaMatch ? receitaMatch[1] : '',
        data: dataMatch ? dataMatch[1] : new Date().toLocaleDateString('pt-BR'),
      };

      setResult(dataExtraida);
      
      if (onResult) {
        onResult(dataExtraida);
      }
    } catch (error) {
      console.error('Erro no OCR:', error);
      setError("Não foi possível reconhecer o texto. Tente novamente com melhor iluminação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Scanner de Etiqueta
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <HiX className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 flex flex-col items-center">
          <div className="w-full relative bg-gray-900 mb-4 rounded overflow-hidden">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full h-auto"
              videoConstraints={{
                facingMode: 'environment' // Usar câmera traseira em dispositivos móveis
              }}
            />
            
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <Spinner size="xl" />
              </div>
            )}
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-lg text-sm w-full">
              {error}
            </div>
          )}
          
          {result && (
            <div className="mb-4 p-3 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-lg text-sm w-full">
              <p><strong>OP:</strong> {result.ordem}</p>
              <p><strong>Código da Receita:</strong> {result.codigoReceita}</p>
              <p><strong>Data:</strong> {result.data}</p>
            </div>
          )}
          
          <div className="flex gap-2 w-full">
            <Button
              className="flex-1"
              color={loading ? "gray" : "blue"}
              onClick={captureAndRecognize}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Processando...
                </>
              ) : (
                <>
                  <HiCamera className="mr-2 h-5 w-5" />
                  Escanear Etiqueta
                </>
              )}
            </Button>
            
            {result && result.ordem && (
              <Button
                color="success"
                onClick={() => {
                  onResult(result);
                  onClose();
                }}
              >
                Usar Dados
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileOcrScanner;