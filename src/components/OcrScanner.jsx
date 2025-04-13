import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import Tesseract from 'tesseract.js';

const OcrScanner = ({ onResult }) => {
  const webcamRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const captureAndRecognize = async () => {
    const screenshot = webcamRef.current.getScreenshot();
    if (!screenshot) return;

    setLoading(true);
    try {
      const { data: { text } } = await Tesseract.recognize(
        screenshot,
        'por',
        { logger: m => console.log(m) }
      );

      const ordemMatch = text.match(/ordem\s+(\d{6,})/i);
      const receitaMatch = text.match(/c[oó]digo da receita\s+(\d{6})/i);
      const fimProducaoMatch = text.match(/Fim da produ[cç][aã]o\s+(\d{1,2}\/\d{1,2}\/\d{4})/i);

      const dataExtraida = {
        ordem: ordemMatch ? ordemMatch[1] : '',
        codigoReceita: receitaMatch ? receitaMatch[1] : '',
        fimProducao: fimProducaoMatch ? fimProducaoMatch[1] : '',
      };

      setResult(dataExtraida);
      if (onResult) onResult(dataExtraida);
    } catch (error) {
      console.error('Erro no OCR:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={300}
        height={200}
      />
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={captureAndRecognize}
        disabled={loading}
      >
        {loading ? 'Processando...' : 'Tirar Foto e Ler OCR'}
      </button>

      {result && (
        <div className="mt-4 text-left">
          <p><strong>Ordem:</strong> {result.ordem}</p>
          <p><strong>Código da Receita:</strong> {result.codigoReceita}</p>
          <p><strong>Fim da Produção:</strong> {result.fimProducao}</p>
        </div>
      )}
    </div>
  );
};

export default OcrScanner;
