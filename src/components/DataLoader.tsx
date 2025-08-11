import React, { useState } from 'react';
import { firestoreService } from '../services/firestoreService';

const DataLoader: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleLoadData = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Verificar se os dados já existem
      const dataExists = await firestoreService.checkIfDataExists('monthlyData');
      
      if (dataExists) {
        setMessage('Os dados já foram carregados anteriormente no Firebase.');
        return;
      }

      setMessage('Carregando dados dos arquivos JSON para o Firebase...');
      
      // Carregar os dados
      await firestoreService.loadJsonDataToFirestore();
      
      setMessage('Dados carregados com sucesso para o Firebase!');
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      setError(`Erro ao carregar dados: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckData = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const monthlyDataExists = await firestoreService.checkIfDataExists('monthlyData');
      const occurrencesExists = await firestoreService.checkIfDataExists('occurrences');
      
      setMessage(`
        Status das coleções:
        - monthlyData: ${monthlyDataExists ? 'Dados existem' : 'Vazia'}
        - occurrences: ${occurrencesExists ? 'Dados existem' : 'Vazia'}
      `);
    } catch (error: any) {
      setError(`Erro ao verificar dados: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Gerenciamento de Dados Firebase
      </h2>
      
      <div className="space-y-4">
        <div className="flex gap-4">
          <button
            onClick={handleLoadData}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Carregando...' : 'Carregar Dados JSON'}
          </button>
          
          <button
            onClick={handleCheckData}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verificando...' : 'Verificar Status'}
          </button>

          <button
            onClick={() => window.open('/admin/reset-password', '_blank')}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Redefinir Senha
          </button>
        </div>

        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <pre className="whitespace-pre-wrap">{message}</pre>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <h3 className="font-semibold mb-2">Instruções:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Use "Verificar Status" para ver se os dados já foram carregados</li>
          <li>Use "Carregar Dados JSON" para importar os arquivos da pasta public/data</li>
          <li>Os dados serão carregados nas coleções 'monthlyData' e 'occurrences'</li>
          <li>O sistema evita duplicação verificando se os dados já existem</li>
        </ul>
      </div>
    </div>
  );
};

export default DataLoader;

