// filepath: c:\Users\johna\OneDrive\Documentos\development\pwakastor-NEXT\src\app\configuracao\page.jsx
import React from 'react';
import RecipeManager from '@/components/RecipeManager';

export const metadata = {
  title: 'Configuração de Receitas',
  description: 'Gerenciamento de receitas e formulações',
};

export default function ConfiguracaoPage() {
  return (
    <div className="container mx-auto px-4">
      <RecipeManager />
    </div>
  );
}