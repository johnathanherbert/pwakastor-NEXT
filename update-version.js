/**
 * Script para atualizar automaticamente a versão da aplicação
 * Pode ser executado como um hook de pre-commit do Git
 */
const fs = require('fs');
const path = require('path');

// Caminho para os arquivos de versão
const versionFilePath = path.join(__dirname, 'public', 'api', 'version.json');
const manifestFilePath = path.join(__dirname, 'public', 'manifest.json');

// Função para incrementar a versão (semver)
function incrementVersion(version, type = 'patch') {
  const [major, minor, patch] = version.split('.').map(Number);
  
  switch(type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

// Determinar o tipo de incremento (pode ser passado como argumento de linha de comando)
const updateType = process.argv[2] || 'patch';

try {
  // Ler a versão atual do manifest.json
  const manifestData = JSON.parse(fs.readFileSync(manifestFilePath, 'utf8'));
  let currentVersion = manifestData.version || '0.1.0';
  
  // Incrementar versão
  const newVersion = incrementVersion(currentVersion, updateType);
  console.log(`Incrementando versão de ${currentVersion} para ${newVersion}`);
  
  // Atualizar manifest.json
  manifestData.version = newVersion;
  fs.writeFileSync(manifestFilePath, JSON.stringify(manifestData, null, 2), 'utf8');
  
  // Obter timestamp atual
  const buildTime = new Date().toISOString();
  
  // Criar ou atualizar arquivo version.json
  const versionData = {
    version: newVersion,
    buildTime
  };
  
  fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2), 'utf8');
  
  console.log(`✅ Arquivos de versão atualizados para v${newVersion}`);
} catch (error) {
  console.error('❌ Erro ao atualizar versão:', error);
  process.exit(1);
}