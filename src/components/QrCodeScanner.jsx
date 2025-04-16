import React, { useEffect, useState, useRef } from 'react';
import { Button, Spinner } from 'flowbite-react';
import { HiX } from 'react-icons/hi';
import jsQR from 'jsqr';

const QrCodeScanner = ({ onResult, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState(null);
  
  // Iniciar câmera ao abrir o componente
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', true); // Necessário para iOS
          setLoading(false);
        }
      } catch (err) {
        console.error('Erro ao acessar câmera:', err);
        setError('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
        setLoading(false);
      }
    };

    startCamera();
    
    return () => {
      // Limpar stream da câmera ao desmontar
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);
  
  // Analisar frames do vídeo para detectar QR codes
  useEffect(() => {
    if (!scanning || loading || error) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrame;
    
    const scanQrCode = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // Desenhar quadro atual do vídeo no canvas para análise
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Obter dados de imagem do canvas
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Tentar detectar QR code
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });
        
        if (code) {
          console.log("QR Code detectado:", code.data);
          setScanning(false);
          
          // Chamar callback com o resultado
          if (onResult) {
            onResult(code.data);
          }
          return;
        }
      }
      
      // Continuar escaneando
      animationFrame = requestAnimationFrame(scanQrCode);
    };
    
    scanQrCode();
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [scanning, loading, error, onResult]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Escaneie o QR Code da Vaga
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
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Spinner size="xl" />
              </div>
            )}
            
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto"
              style={{ display: loading ? 'none' : 'block' }}
            />
            
            <canvas 
              ref={canvasRef} 
              className="hidden" // Canvas oculto, usado apenas para processamento
            />
            
            {/* Overlay com moldura para posicionar o QR code */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-2 border-white border-opacity-70 rounded-lg w-2/3 h-2/3"></div>
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-lg text-sm w-full">
              {error}
            </div>
          )}
          
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
            Posicione o QR code da vaga dentro do quadro para escanear
          </p>
          
          <Button
            onClick={onClose}
            className="w-full bg-black/10 hover:bg-black/20 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QrCodeScanner;