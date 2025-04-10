// Script temporário para remover a pasta que está causando conflito
const fs = require('fs');
const path = require('path');

// Caminho para a pasta que queremos remover
const dirToRemove = path.join(__dirname, 'src', 'app', 'vaga', '[sala]');

function deleteFolderRecursive(directoryPath) {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file) => {
      const curPath = path.join(directoryPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // Recursive call for directories
        deleteFolderRecursive(curPath);
      } else {
        // Delete file
        fs.unlinkSync(curPath);
        console.log(`Arquivo removido: ${curPath}`);
      }
    });
    fs.rmdirSync(directoryPath);
    console.log(`Diretório removido: ${directoryPath}`);
  }
}

try {
  console.log(`Tentando remover: ${dirToRemove}`);
  deleteFolderRecursive(dirToRemove);
  console.log('Remoção concluída com sucesso!');
} catch (error) {
  console.error('Erro ao remover diretório:', error);
}