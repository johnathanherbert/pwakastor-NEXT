import { useState, useEffect } from 'react';

export default function useAppUpdate(checkIntervalMinutes = 30) {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [latestVersion, setLatestVersion] = useState(null);

  useEffect(() => {
    // Carrega a versão do cache apenas uma vez na inicialização
    const loadCachedVersion = async () => {
      try {
        const cachedVersion = localStorage.getItem('appVersion');
        if (cachedVersion) {
          setCurrentVersion(cachedVersion);
        }
      } catch (error) {
        console.error('Erro ao carregar versão do cache:', error);
      }
    };

    loadCachedVersion();
  }, []);

  // Configura verificador de atualizações periódico
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        // Adiciona um timestamp para evitar cache do navegador
        const response = await fetch(`/api/version.json?t=${Date.now()}`);
        
        if (!response.ok) {
          throw new Error('Falha ao buscar informações de versão');
        }
        
        const data = await response.json();
        const fetchedVersion = data.version;
        
        setLatestVersion(fetchedVersion);
        
        // Se não tivermos uma versão armazenada, esta é a primeira carga
        if (!currentVersion) {
          localStorage.setItem('appVersion', fetchedVersion);
          setCurrentVersion(fetchedVersion);
          return;
        }
        
        // Verifica se a versão atual é diferente da armazenada
        if (currentVersion !== fetchedVersion) {
          setHasUpdate(true);
        }
      } catch (error) {
        console.error('Erro ao verificar atualizações:', error);
      }
    };

    // Verifica imediatamente na inicialização
    checkForUpdates();
    
    // Configura verificações periódicas
    const intervalId = setInterval(checkForUpdates, checkIntervalMinutes * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [currentVersion, checkIntervalMinutes]);

  return { hasUpdate, currentVersion, latestVersion };
}